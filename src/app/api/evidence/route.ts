import { NextRequest, NextResponse } from 'next/server';
import { getDB, findUser, addEvidence } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import { computeConfidenceScore } from '@/lib/constants';
import { buildWeeklyConfidenceSummary } from '@/lib/ai';

export const runtime = 'nodejs';

interface EvidenceBody {
  title?: string;
  detail?: string;
  tags?: string[];
  isPublic?: boolean;
}

export async function GET(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const db = getDB();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

  const evidences = db.evidences
    .filter((e) => e.uid === uid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const confidence = computeConfidenceScore(evidences);
  const weeklySummary = await buildWeeklyConfidenceSummary(user, evidences);

  return NextResponse.json({ evidences, confidence, weeklySummary });
}

export async function POST(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const db = getDB();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

  let body: EvidenceBody = {};
  try {
    body = (await req.json()) as EvidenceBody;
  } catch {
    body = {};
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const detail = typeof body.detail === 'string' ? body.detail : '';
  if (!title) {
    return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
  }

  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === 'string')
    : [];
  const isPublic = typeof body.isPublic === 'boolean' ? body.isPublic : false;

  const evidence = addEvidence(db, {
    uid,
    type: 'project_work',
    title,
    detail,
    source: 'manual',
    tags,
    isPublic,
  });

  return NextResponse.json({ evidence });
}
