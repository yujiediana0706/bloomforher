// Agent Platform / Gemini 调用客户端。有 endpoint 时调真实 Agent，无则返回 null（回退到占位逻辑）。
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

/** 调 Vertex AI Agent Platform（detectIntent）或 Gemini generateContent */
export async function callAgent(req: AgentRequest): Promise<AgentResponse | null> {
  const auth = getAuth();
  if (!auth) return null;

  const client = await auth.getClient();
  const token = (await client.getAccessToken()).token;

  // 优先走 Agent Platform（如果配置了 endpoint）
  const endpoint = process.env.AGENT_ENDPOINT_COACH;
  if (endpoint) {
    return callAgentPlatform(token!, endpoint, req);
  }

  // 否则走 Vertex AI Gemini generateContent
  return callGemini(token!, req);
}

/** 调 Agent Platform（Agent Builder） */
async function callAgentPlatform(
  token: string,
  endpoint: string,
  req: AgentRequest
): Promise<AgentResponse | null> {
  try {
    // Agent Builder 的 REST API 格式
    const url = `https://agent.googleapis.com/v1/${endpoint}:detectIntent`;
    const body = {
      queryInput: {
        text: { text: req.input, languageCode: 'zh-CN' },
      },
      queryParams: {
        payload: {
          systemInstruction: req.systemInstruction,
          context: req.context ? JSON.stringify(req.context) : undefined,
          history: req.history,
        },
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[Agent Platform] 调用失败:', res.status, err.slice(0, 200));
      return null;
    }

    const data = await res.json();
    const text = data.queryResult?.responseMessages?.[0]?.text?.text?.[0]
      || data.queryResult?.fulfillmentText
      || '';
    return { text };
  } catch (e) {
    console.error('[Agent Platform] 异常:', (e as Error).message);
    return null;
  }
}

/** 调 Vertex AI Gemini generateContent */
async function callGemini(token: string, req: AgentRequest): Promise<AgentResponse | null> {
  try {
    const location = 'us-central1';
    const model = 'gemini-2.0-flash';
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:generateContent`;

    // 构建 contents
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // 系统提示词
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

    // 上下文
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

    // 历史
    if (req.history) {
      for (const msg of req.history) {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        });
      }
    }

    // 当前输入
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
