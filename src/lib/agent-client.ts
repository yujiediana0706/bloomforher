// Agent Platform / Reasoning Engine 调用客户端。有 endpoint 时调真实 Agent，无则返回 null（回退到占位逻辑）。
// 仅服务端使用。

import { GoogleAuth } from 'google-auth-library';
import { readFileSync } from 'fs';

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const projectId = process.env.GOOGLE_CLOUD_PROJECT;
const SCOPES = ['https://www.googleapis.com/auth/cloud-platform'];

let _auth: GoogleAuth | null = null;
let _initFailed = false;
let _lastAgentError: string | null = null;
let _lastGeminiError: string | null = null;

export function getLastAgentError(): string | null {
  return _lastAgentError;
}

export function getLastGeminiError(): string | null {
  return _lastGeminiError;
}

function getAuth(): GoogleAuth | null {
  if (_auth) return _auth;
  if (_initFailed) return null;

  try {
    if (keyPath) {
      // 本地开发：显式服务账号 key 文件
      const key = JSON.parse(readFileSync(keyPath, 'utf8'));
      _auth = new GoogleAuth({ credentials: key, projectId: projectId || undefined, scopes: SCOPES });
    } else {
      // Cloud Run / GCP：Application Default Credentials（元数据服务器），无需 key 文件
      _auth = new GoogleAuth({ projectId: projectId || undefined, scopes: SCOPES });
    }
    return _auth;
  } catch (e) {
    console.error('[Agent] 初始化失败:', (e as Error).message);
    _initFailed = true;
    return null;
  }
}

export interface AgentRequest {
  /** 系统提示词（角色设定） */
  systemInstruction?: string;
  /** 用户输入 */
  input: string;
  /** 上下文（JSON 字符串） */
  context?: Record<string, unknown>;
  /** 历史消息 */
  history?: Array<{ role: 'user' | 'model'; content: string }>;
}

interface AgentResponse {
  text: string;
}

/** 调 Reasoning Engine（Agent Studio 部署的 Agent） */
export async function callAgentEndpoint(
  endpoint: string,
  req: AgentRequest
): Promise<AgentResponse | null> {
  const auth = getAuth();
  if (!auth) return null;

  try {
    const client = await auth.getClient();
    const token = (await client.getAccessToken()).token;

    // 从 endpoint 提取 location
    // endpoint 格式：projects/107927033625/locations/us-west1/reasoningEngines/5963861020219801600
    const locationMatch = endpoint.match(/locations\/([^/]+)/);
    const location = locationMatch?.[1] || 'us-central1';

    const url = `https://${location}-aiplatform.googleapis.com/v1/${endpoint}:query`;

    // 构建输入文本
    let fullInput = req.input;
    if (req.systemInstruction) {
      fullInput = `[系统设定] ${req.systemInstruction}\n\n[用户输入] ${req.input}`;
    }
    if (req.context) {
      fullInput += `\n\n[上下文] ${JSON.stringify(req.context)}`;
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
      console.error(`[Agent] 调用失败 (${endpoint}): ${_lastAgentError}`);
      return null;
    }

    const data = await res.json();
    // Reasoning Engine 返回格式：{ output: { text: "..." } } 或 { output: "..." }
    const raw = data.output;
    const text = typeof raw === 'string' ? raw : (raw?.text ?? '');
    if (!text) {
      _lastAgentError = `empty output; raw=${JSON.stringify(data).slice(0, 300)}`;
      console.error(`[Agent] 空输出 (${endpoint}): ${_lastAgentError}`);
      return null;
    }
    _lastAgentError = null;
    return { text };
  } catch (e) {
    _lastAgentError = (e as Error).message;
    console.error(`[Agent] 异常 (${endpoint}):`, _lastAgentError);
    return null;
  }
}

/** 调 Vertex AI Gemini generateContent（fallback）。模型名可通过 GEMINI_MODEL 覆盖，默认按候选列表逐个探测。 */
const MODEL_CANDIDATES = process.env.GEMINI_MODEL
  ? [process.env.GEMINI_MODEL]
  : ['gemini-2.5-flash', 'gemini-2.0-flash-001', 'gemini-1.5-flash-002'];

export async function callGemini(req: AgentRequest): Promise<AgentResponse | null> {
  const auth = getAuth();
  if (!auth || !projectId) return null;

  try {
    const client = await auth.getClient();
    const token = (await client.getAccessToken()).token;

    const location = 'us-central1';

    // 构建 contents（各模型复用）
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (req.systemInstruction) {
      contents.push({
        role: 'user',
        parts: [{ text: `[系统设定] ${req.systemInstruction}` }],
      });
      contents.push({
        role: 'model',
        parts: [{ text: '我已理解上述设定，将严格遵循。' }],
      });
    }

    if (req.context) {
      contents.push({
        role: 'user',
        parts: [{ text: `[上下文] ${JSON.stringify(req.context)}` }],
      });
      contents.push({
        role: 'model',
        parts: [{ text: '我已收到上下文信息。' }],
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

    for (const model of MODEL_CANDIDATES) {
      const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents }),
      });

      if (!res.ok) {
        const err = await res.text();
        _lastGeminiError = `HTTP ${res.status} (${model}): ${err.slice(0, 200)}`;
        console.error('[Gemini] 调用失败:', _lastGeminiError);
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) {
        _lastGeminiError = `empty output (${model}); raw=${JSON.stringify(data).slice(0, 200)}`;
        console.error('[Gemini] 空输出:', _lastGeminiError);
        continue;
      }
      _lastGeminiError = null;
      return { text };
    }
    return null;
  } catch (e) {
    _lastGeminiError = (e as Error).message;
    console.error('[Gemini] 异常:', _lastGeminiError);
    return null;
  }
}

/** 判断 Agent 是否可用（有 endpoint 或能调 Gemini） */
export function isAgentAvailable(): boolean {
  return getAuth() !== null;
}

/** 获取指定 Agent 的 endpoint */
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
