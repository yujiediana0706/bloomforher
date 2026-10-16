import { NextRequest, NextResponse } from 'next/server';
import { addEvidence, ensureLoaded, syncToFirestore } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import type { EvidenceItem, PlanTask } from '@/lib/types';

export const runtime = 'nodejs';

interface PlanTaskBody {
  taskId?: string;
  completed?: boolean;
}

export async function PATCH(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const db = await ensureLoaded();
  const plan = db.returnPlans[uid];
  if (!plan) {
    return NextResponse.json({ error: 'No return plan has been generated yet' }, { status: 404 });
  }

  let body: PlanTaskBody = {};
  try {
    body = (await req.json()) as PlanTaskBody;
  } catch {
    body = {};
  }

  const { taskId, completed } = body;
  if (typeof taskId !== 'string' || typeof completed !== 'boolean') {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  let target: PlanTask | undefined;
  for (const week of plan.weeks) {
    const found = week.practiceTasks.find((t) => t.id === taskId);
    if (found) {
      target = found;
      break;
    }
  }
  if (!target) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const wasCompleted = target.completed;
  target.completed = completed;
  syncToFirestore('returnPlans', uid, plan);

  let evidence: EvidenceItem | null = null;
  if (completed && !wasCompleted) {
    evidence = addEvidence(db, {
      uid,
      type: 'skill_progress',
      title: `Completed plan task: ${target.title}`,
      detail: `You completed "${target.title}" in week ${target.week}—this is real learning progress.`,
      source: 'auto',
      tags: ['Return plan', 'Learning progress'],
      relatedType: 'plan_task',
      relatedId: target.id,
      isPublic: false,
    });
  }

  return NextResponse.json({ plan, evidence });
}
