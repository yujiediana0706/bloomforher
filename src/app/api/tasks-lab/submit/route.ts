import { NextRequest, NextResponse } from 'next/server';
import {
  getDB,
  findUser,
  newId,
  nowIso,
  addEvidence,
  checkTaskMilestones,
} from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import { evaluateSubmission } from '@/lib/ai';
import type { LabSubmission } from '@/lib/types';

export const runtime = 'nodejs';

interface SubmitBody {
  taskId?: string;
  text?: string;
}

export async function POST(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const db = getDB();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  let body: SubmitBody = {};
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    body = {};
  }

  const { taskId, text } = body;
  if (typeof taskId !== 'string' || typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  const task = db.labTasks.find((t) => t.id === taskId);
  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }
  if (task.uid !== uid) {
    return NextResponse.json({ error: 'You are not allowed to modify this task' }, { status: 403 });
  }

  const feedback = await evaluateSubmission(text);
  const submission: LabSubmission = {
    id: newId('sub'),
    text,
    feedback,
    submittedAt: nowIso(),
  };
  task.submissions.push(submission);

  if (task.status !== 'done') task.status = 'done';

  const evidence = addEvidence(db, {
    uid,
    type: 'task_outcome',
    title: `Hands-on task: ${task.title}`,
    detail: `Scored ${feedback.score} / 5 against the rubric.`,
    source: 'auto',
    tags: ['Hands-on task'],
    relatedType: 'lab_task',
    relatedId: task.id,
    isPublic: true,
  });

  checkTaskMilestones(db, uid);

  if (user.journeyStep < 4) user.journeyStep = 4;
  user.updatedAt = nowIso();

  return NextResponse.json({ task, feedback, evidence });
}
