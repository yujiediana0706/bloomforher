import { NextRequest, NextResponse } from 'next/server';
import { ensureLoaded, findUser, newId, nowIso } from '@/lib/store';
import { getUidFromRequest, isAnonymousUid } from '@/lib/session';
import { coachReply, type CoachContext } from '@/lib/ai';
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
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  // The AI Mentor is a protected feature: anonymous visitors must sign up first.
  if (isAnonymousUid(uid)) {
    return NextResponse.json(
      { error: 'Please sign up first to chat with your AI Mentor.' },
      { status: 401 }
    );
  }

  const db = await ensureLoaded();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  let body: ChatBody = {};
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    body = {};
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
  }

  const recentEvidences = db.evidences
    .filter((e) => e.uid === uid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  // —— Context fed back: plan progress + task feedback + mentor sessions, so the Agent understands the user better over time ——
  const plan = db.returnPlans[uid];
  let planProgress: CoachContext['planProgress'];
  if (plan) {
    const tasks = plan.weeks.flatMap((w) => w.practiceTasks);
    planProgress = {
      done: tasks.filter((t) => t.completed).length,
      total: tasks.length,
      nextTaskTitle: tasks.find((t) => !t.completed)?.title,
    };
  }
  const feedbackScores = db.labTasks
    .filter((t) => t.uid === uid)
    .flatMap((t) => t.submissions.map((s) => s.feedback?.score))
    .filter((s): s is number => typeof s === 'number');
  const completedSessionCount = db.bookings.filter(
    (b) => b.coacheeId === uid && (b.status === 'completed' || b.status === 'released')
  ).length;

  // Skill portrait: the coach only gets the evidence-based summary, so every
  // ability claim can be traced to the user's real data.
  const skillProfile = db.skillProfiles[uid];
  const strengths = skillProfile?.transferableSkills.map((s) => ({
    name: s.name,
    evidenceLevel: s.evidenceLevel ?? 'unrated',
    evidence: s.evidence,
  }));
  const skillGaps = skillProfile?.skillGaps?.map((g) => ({
    skill: g.skill,
    priority: g.priority,
    why: g.why,
  }));

  const context: CoachContext = {
    planProgress,
    recentFeedbackScore: feedbackScores.at(-1),
    completedSessionCount,
    strengths,
    skillGaps,
  };

  // Load the persisted conversation history so the coach remembers prior turns.
  // We feed the last 10 messages (5 user/coach pairs) — enough for continuity
  // without drowning the current prompt.
  const history = (db.coachMessages[uid] ?? []).slice(-10).map((m) => ({
    role: m.role as 'user' | 'coach',
    content: m.content,
  }));
  if (history.length) {
    context.conversationHistory = history;
  }

  const { content, microAction } = await coachReply(user, recentEvidences, message, context);

  // Write the conversation history
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
