import { NextRequest, NextResponse } from 'next/server';
import { getDB, findUser, newId, nowIso, syncBatchToFirestore } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import { buildLabTasks } from '@/lib/ai';
import type { LabTask } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const db = getDB();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

  let tasks = db.labTasks.filter((t) => t.uid === uid);
  if (tasks.length === 0) {
    const built = await buildLabTasks(user);
    const created: LabTask[] = built.map((t) => ({
      ...t,
      id: newId('lab'),
      uid,
      createdAt: nowIso(),
    }));
    db.labTasks.push(...created);
    syncBatchToFirestore('labTasks', created);
    tasks = created;
  }

  tasks = [...tasks].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return NextResponse.json({ tasks });
}
