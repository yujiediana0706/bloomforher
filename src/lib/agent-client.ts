// Agent Platform / Reasoning Engine call client. When an endpoint exists it calls the real Agent; otherwise it returns null (falling back to placeholder logic).
// Server-side only.

import { GoogleAuth } from 'google-auth-library';
import { readFileSync } from 'fs';

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const envProjectId = process.env.GOOGLE_CLOUD_PROJECT;
const SCOPES = ['https://www.googleapis.com/auth/cloud-platform'];

let _auth: GoogleAuth | null = null;
let _initFailed = false;
let _lastAgentError: string | null = null;
let _lastGeminiError: string | null = null;
let _resolvedProjectId: string | null | undefined;

function getAuth(): GoogleAuth | null {
  if (_auth) return _auth;
  if (_initFailed) return null;

  try {
    if (keyPath) {
      // Local development: explicit service-account key file
      const key = JSON.parse(readFileSync(keyPath, 'utf8'));
      _auth = new GoogleAuth({ credentials: key, projectId: envProjectId || undefined, scopes: SCOPES });
    } else {
      // Cloud Run / GCP: Application Default Credentials (metadata server), no key file needed
      _auth = new GoogleAuth({ projectId: envProjectId || undefined, scopes: SCOPES });
    }
    return _auth;
  } catch (e) {
    console.error('[Agent] initialization failed:', (e as Error).message);
    _initFailed = true;
    return null;
  }
}

/** Resolve the GCP project ID from env or the GCP metadata server (Cloud Run). */
async function getProjectId(): Promise<string | null> {
  if (envProjectId) return envProjectId;
  if (_resolvedProjectId !== undefined) return _resolvedProjectId;
  const auth = getAuth();
  if (!auth) {
    _resolvedProjectId = null;
    return null;
  }
  try {
    _resolvedProjectId = await auth.getProjectId();
  } catch {
    _resolvedProjectId = null;
  }
  return _resolvedProjectId;
}

export interface AgentRequest {
  /** System prompt (role definition) */
  systemInstruction?: string;
  /** User input */
  input: string;
  /** Context (JSON string) */
  context?: Record<string, unknown>;
  /** History messages */
  history?: Array<{ role: 'user' | 'model'; content: string }>;
}

interface AgentResponse {
  text: string;
}

/** Call the Reasoning Engine (an Agent deployed in Agent Studio) */
export async function callAgentEndpoint(
  endpoint: string,
  req: AgentRequest
): Promise<AgentResponse | null> {
  const auth = getAuth();
  if (!auth) return null;

  try {
    const client = await auth.getClient();
    const token = (await client.getAccessToken()).token;

    // Extract the location from the endpoint
    // endpoint format: projects/107927033625/locations/us-west1/reasoningEngines/5963861020219801600
    const locationMatch = endpoint.match(/locations\/([^/]+)/);
    const location = locationMatch?.[1] || 'us-central1';

    const url = `https://${location}-aiplatform.googleapis.com/v1/${endpoint}:query`;

    // Build the input text
    let fullInput = req.input;
    if (req.systemInstruction) {
      fullInput = `[System] ${req.systemInstruction}\n\n[User input] ${req.input}`;
    }
    if (req.context) {
      fullInput += `\n\n[Context] ${JSON.stringify(req.context)}`;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: {
          query: fullInput,
          ...(req.history && { history: req.history }),
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      _lastAgentError = `HTTP ${res.status}: ${err.slice(0, 300)}`;
      console.error(`[Agent] call failed (${endpoint}): ${_lastAgentError}`);
      return null;
    }

    const data = await res.json();
    // Reasoning Engine return format: { output: { text: "..." } } or { output: "..." }
    const raw = data.output;
    const text = typeof raw === 'string' ? raw : (raw?.text ?? '');
    if (!text) {
      _lastAgentError = `empty output; raw=${JSON.stringify(data).slice(0, 300)}`;
      console.error(`[Agent] empty output (${endpoint}): ${_lastAgentError}`);
      return null;
    }
    _lastAgentError = null;
    return { text };
  } catch (e) {
    _lastAgentError = (e as Error).message;
    console.error(`[Agent] exception (${endpoint}):`, _lastAgentError);
    return null;
  }
}

/** Call Vertex AI Gemini generateContent (fallback). The model name can be overridden via GEMINI_MODEL; by default it probes each candidate in order. */
const MODEL_CANDIDATES: Array<{ model: string; location: string }> = process.env.GEMINI_MODEL
  ? [{ model: process.env.GEMINI_MODEL, location: process.env.GEMINI_LOCATION || 'global' }]
  : [
      { model: 'gemini-3.5-flash', location: 'global' },
      { model: 'gemini-2.5-flash', location: 'us-central1' },
      { model: 'gemini-2.0-flash-001', location: 'us-central1' },
    ];

export async function callGemini(req: AgentRequest): Promise<AgentResponse | null> {
  const auth = getAuth();
  const projectId = await getProjectId();
  if (!auth || !projectId) return null;

  try {
    const client = await auth.getClient();
    const token = (await client.getAccessToken()).token;

    // Build the contents (reused across models)
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (req.context) {
      contents.push({
        role: 'user',
        parts: [{ text: `[Context] ${JSON.stringify(req.context)}` }],
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'I have received the context information.' }],
      });
    }

    if (req.history) {
      for (const msg of req.history) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      }
    }

    contents.push({ role: 'user', parts: [{ text: req.input }] });

    for (const { model, location } of MODEL_CANDIDATES) {
      // The global endpoint host name has no region prefix; other regions use {location}-aiplatform.googleapis.com
      const host = location === 'global' ? 'aiplatform.googleapis.com' : `${location}-aiplatform.googleapis.com`;
      const url = `https://${host}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          req.systemInstruction
            ? { systemInstruction: { parts: [{ text: req.systemInstruction }] }, contents }
            : { contents }
        ),
      });

      if (!res.ok) {
        const err = await res.text();
        _lastGeminiError = `HTTP ${res.status} (${model}): ${err.slice(0, 200)}`;
        console.error('[Gemini] call failed:', _lastGeminiError);
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) {
        _lastGeminiError = `empty output (${model}); raw=${JSON.stringify(data).slice(0, 200)}`;
        console.error('[Gemini] empty output:', _lastGeminiError);
        continue;
      }
      _lastGeminiError = null;
      return { text };
    }
    return null;
  } catch (e) {
    _lastGeminiError = (e as Error).message;
    console.error('[Gemini] exception:', _lastGeminiError);
    return null;
  }
}

/** Determine whether the Agent is available (has an endpoint, or can call Gemini) */
export function isAgentAvailable(): boolean {
  return getAuth() !== null;
}

/** Get the endpoint for the specified Agent */
export function getAgentEndpoint(agentName: 'assessment' | 'coach' | 'memory' | 'proactive' | 'mentorMatch'): string | null {
  const envMap: Record<string, string> = {
    assessment: 'AGENT_ENDPOINT_ASSESSMENT',
    coach: 'AGENT_ENDPOINT_COACH',
    memory: 'AGENT_ENDPOINT_MEMORY',
    proactive: 'AGENT_ENDPOINT_PROACTIVE',
    mentorMatch: 'AGENT_ENDPOINT_MENTOR_MATCH',
  };
  return process.env[envMap[agentName]] || null;
}
