import { NextRequest, NextResponse } from 'next/server';
import { ensureLoaded, findUser, nowIso, syncToFirestore } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import { buildReturnPlan } from '@/lib/ai';
import type { ReturnPlan } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const db = await ensureLoaded();
  return NextResponse.json({ plan: db.returnPlans[uid] ?? null });
}

export async function POST(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const db = await ensureLoaded();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  let feedback: string | undefined;
  try {
    const body = (await req.json()) as { feedback?: unknown };
    if (typeof body.feedback === 'string') feedback = body.feedback;
  } catch {
    feedback = undefined;
  }

  const built = await buildReturnPlan(user, feedback);

  // Preserve completed-task state: reuse the completed flag from the old plan for the same taskId
  const previous = db.returnPlans[uid];
  if (previous) {
    const completedMap = new Map<string, boolean>();
    for (const week of previous.weeks) {
      for (const task of week.practiceTasks) {
        completedMap.set(task.id, task.completed);
      }
    }
    for (const week of built.weeks) {
      for (const task of week.practiceTasks) {
        const prev = completedMap.get(task.id);
        if (prev !== undefined) task.completed = prev;
      }
    }
  }

  const plan: ReturnPlan = { uid, createdAt: nowIso(), ...built };
  db.returnPlans[uid] = plan;
  syncToFirestore('returnPlans', uid, plan);

  if (user.journeyStep < 5) user.journeyStep = 5;
  user.updatedAt = nowIso();
  syncToFirestore('users', uid, user);

  return NextResponse.json({ plan });
}
