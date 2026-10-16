import { NextResponse } from 'next/server';
import {
  callAgentEndpoint,
  callGemini,
  getAgentEndpoint,
  getLastAgentError,
  getLastGeminiError,
  isAgentAvailable,
} from '@/lib/agent-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 临时诊断端点：确认 Agent / Gemini 调用链路是否真的打通。诊断完成后删除。
export async function GET() {
  const endpoints = {
    assessment: getAgentEndpoint('assessment'),
    coach: getAgentEndpoint('coach'),
    memory: getAgentEndpoint('memory'),
    proactive: getAgentEndpoint('proactive'),
    mentorMatch: getAgentEndpoint('mentorMatch'),
  };

  const available = isAgentAvailable();

  const gemini = await callGemini({ input: '只回复两个字：你好' });
  const geminiError = getLastGeminiError();

  const coachEp = endpoints.coach;
  const agent = coachEp ? await callAgentEndpoint(coachEp, { input: '只回复两个字：你好' }) : null;
  const agentError = getLastAgentError();

  return NextResponse.json({
    revision: process.env.K_REVISION ?? null,
    service: process.env.K_SERVICE ?? null,
    projectId: process.env.GOOGLE_CLOUD_PROJECT ?? null,
    hasKeyFile: !!process.env.GOOGLE_APPLICATION_CREDENTIALS,
    isAgentAvailable: available,
    endpointsPresent: Object.fromEntries(
      Object.entries(endpoints).map(([k, v]) => [k, !!v])
    ),
    gemini: gemini ? { ok: true, sample: gemini.text.slice(0, 120) } : { ok: false, error: geminiError },
    agent: agent ? { ok: true, sample: agent.text.slice(0, 120) } : { ok: false, error: agentError },
  });
}
