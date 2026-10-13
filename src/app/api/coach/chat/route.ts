import { NextRequest, NextResponse } from 'next/server';
import { getDB, findUser, newId, nowIso } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import { coachReply } from '@/lib/ai';
import type { CoachMessage } from '@/lib/types';

export const runtime = 'nodejs';

interface ChatBody {
  message?: string;
  history?: { role: 'user' | 'coach'; content: string }[];
}

const CHUNK_SIZE = 10;
const CHUNK_INTERVAL_MS = 30;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const db = getDB();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

  let body: ChatBody = {};
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    body = {};
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
  }

  const recentEvidences = db.evidences
    .filter((e) => e.uid === uid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const { content, microAction } = coachReply(user, recentEvidences, message);

  // 写入对话历史
  const messages = db.coachMessages[uid] ?? (db.coachMessages[uid] = []);
  const userMessage: CoachMessage = {
    id: newId('cm'),
    role: 'user',
    content: message,
    createdAt: nowIso(),
  };
  const coachMessage: CoachMessage = {
    id: newId('cm'),
    role: 'coach',
    content,
    microAction,
    createdAt: nowIso(),
  };
  messages.push(userMessage, coachMessage);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (let i = 0; i < content.length; i += CHUNK_SIZE) {
          const delta = content.slice(i, i + CHUNK_SIZE);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`)
          );
          await sleep(CHUNK_INTERVAL_MS);
        }
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ done: true, microAction })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
