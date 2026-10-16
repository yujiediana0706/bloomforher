import { NextRequest, NextResponse } from 'next/server';
import { ensureLoaded, findUser, nowIso, syncToFirestore } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import { buildOpportunityReport } from '@/lib/ai';
import type { OpportunityReport } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const db = await ensureLoaded();
  return NextResponse.json({
    opportunityReport: db.opportunityReports[uid] ?? null,
  });
}

export async function POST(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const db = await ensureLoaded();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const skills = db.skillProfiles[uid];
  if (!skills) {
    return NextResponse.json({ error: 'Please complete Skill Discovery first' }, { status: 400 });
  }

  const built = await buildOpportunityReport(user, skills);
  const opportunityReport: OpportunityReport = {
    uid,
    createdAt: nowIso(),
    ...built,
  };
  db.opportunityReports[uid] = opportunityReport;
  syncToFirestore('opportunityReports', uid, opportunityReport);

  if (user.journeyStep < 3) user.journeyStep = 3;
  user.updatedAt = nowIso();
  syncToFirestore('users', uid, user);

  return NextResponse.json({ opportunityReport });
}
