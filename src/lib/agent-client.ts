// Agent Platform / Reasoning Engine 调用客户端。有 endpoint 时调真实 Agent，无则返回 null（回退到占位逻辑）。
// 仅服务端使用。

import { GoogleAuth } from 'google-auth-library';
import { readFileSync } from 'fs';

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const projectId = process.env.GOOGLE_CLOUD_PROJECT;

let _auth: GoogleAuth | null = null;
let _initFailed = false;

function getAuth(): GoogleAuth | null {
  if (_auth) return _auth;
  if (_initFailed) return null;
  if (!keyPath || !projectId) return null;

  try {
    const key = JSON.parse(readFileSync(keyPath, 'utf8'));
    _auth = new GoogleAuth({
      credentials: key,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    return _auth;
  } catch (e) {
    console.error('[Agent] 初始化失败:', (e as Error).message);
    _initFailed = true;
    return null;
  }
}

interface AgentRequest {
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
      console.error(`[Agent] 调用失败 (${endpoint}):`);
      console.error(`  Status: ${res.status}`);
      console.error(`  Error: ${err.slice(0, 500)}`);
      return null;
    }

    const data = await res.json();
    // Reasoning Engine 返回格式：{ output: { text: "..." } } 或 { output: "..." }
    const text = data.output?.text || data.output || '';
    return { text };
  } catch (e) {
    console.error(`[Agent] 异常 (${endpoint}):`, (e as Error).message);
    return null;
  }
}

/** 调 Vertex AI Gemini generateContent（fallback） */
export async function callGemini(req: AgentRequest): Promise<AgentResponse | null> {
  const auth = getAuth();
  if (!auth) return null;

  try {
    const client = await auth.getClient();
    const token = (await client.getAccessToken()).token;

    const location = 'us-central1';
    const model = 'gemini-2.0-flash';
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

    // 构建 contents
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
      console.error('[Gemini] 调用失败:', res.status, err.slice(0, 200));
      return null;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { text };
  } catch (e) {
    console.error('[Gemini] 异常:', (e as Error).message);
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
