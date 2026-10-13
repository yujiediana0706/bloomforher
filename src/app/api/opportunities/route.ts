import { NextRequest, NextResponse } from 'next/server';
import { getDB, findUser, nowIso } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import { buildOpportunityReport } from '@/lib/ai';
import type { OpportunityReport } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const db = getDB();
  return NextResponse.json({
    opportunityReport: db.opportunityReports[uid] ?? null,
  });
}

export async function POST(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const db = getDB();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

  const skills = db.skillProfiles[uid];
  if (!skills) {
    return NextResponse.json({ error: '请先完成技能发现' }, { status: 400 });
  }

  const built = buildOpportunityReport(user, skills);
  const opportunityReport: OpportunityReport = {
    uid,
    createdAt: nowIso(),
    ...built,
  };
  db.opportunityReports[uid] = opportunityReport;

  if (user.journeyStep < 3) user.journeyStep = 3;
  user.updatedAt = nowIso();

  return NextResponse.json({ opportunityReport });
}
