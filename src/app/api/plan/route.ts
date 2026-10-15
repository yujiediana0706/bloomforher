import { NextRequest, NextResponse } from 'next/server';
import { getDB, findUser, nowIso } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import { buildReturnPlan } from '@/lib/ai';
import type { ReturnPlan } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const db = getDB();
  return NextResponse.json({ plan: db.returnPlans[uid] ?? null });
}

export async function POST(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const db = getDB();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

  let feedback: string | undefined;
  try {
    const body = (await req.json()) as { feedback?: unknown };
    if (typeof body.feedback === 'string') feedback = body.feedback;
  } catch {
    feedback = undefined;
  }

  const built = await buildReturnPlan(user, feedback);

  // 保留已完成任务状态：同名 taskId 沿用旧计划的 completed
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

  if (user.journeyStep < 5) user.journeyStep = 5;
  user.updatedAt = nowIso();

  return NextResponse.json({ plan });
}
