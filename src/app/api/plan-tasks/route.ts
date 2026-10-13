import { NextRequest, NextResponse } from 'next/server';
import { getDB, addEvidence } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import type { EvidenceItem, PlanTask } from '@/lib/types';

export const runtime = 'nodejs';

interface PlanTaskBody {
  taskId?: string;
  completed?: boolean;
}

export async function PATCH(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const db = getDB();
  const plan = db.returnPlans[uid];
  if (!plan) {
    return NextResponse.json({ error: '尚未生成回归计划' }, { status: 404 });
  }

  let body: PlanTaskBody = {};
  try {
    body = (await req.json()) as PlanTaskBody;
  } catch {
    body = {};
  }

  const { taskId, completed } = body;
  if (typeof taskId !== 'string' || typeof completed !== 'boolean') {
    return NextResponse.json({ error: '参数不合法' }, { status: 400 });
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
    return NextResponse.json({ error: '任务不存在' }, { status: 404 });
  }

  const wasCompleted = target.completed;
  target.completed = completed;

  let evidence: EvidenceItem | null = null;
  if (completed && !wasCompleted) {
    evidence = addEvidence(db, {
      uid,
      type: 'skill_progress',
      title: `完成计划任务：${target.title}`,
      detail: `你在第 ${target.week} 周完成了「${target.title}」，这是一次真实的学习进展。`,
      source: 'auto',
      tags: ['回归计划', '学习进展'],
      relatedType: 'plan_task',
      relatedId: target.id,
      isPublic: false,
    });
  }

  return NextResponse.json({ plan, evidence });
}
