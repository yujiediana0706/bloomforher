import { NextRequest, NextResponse } from 'next/server';
import { getDB, findUser } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import {
  computeConfidenceScore,
  EVIDENCE_TYPE_LABELS,
  EVIDENCE_TYPE_WEIGHTS,
  CONFIDENCE_BASE,
} from '@/lib/constants';
import type { EvidenceType } from '@/lib/types';

export const runtime = 'nodejs';

interface NextTask {
  title: string;
  href: string;
}

export async function GET(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const db = getDB();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const evidences = db.evidences
    .filter((e) => e.uid === uid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const confidence = computeConfidenceScore(evidences);

  const types = Object.keys(EVIDENCE_TYPE_WEIGHTS) as EvidenceType[];
  const breakdown = types
    .map((type) => ({
      type,
      label: EVIDENCE_TYPE_LABELS[type],
      count: evidences.filter((e) => e.type === type).length,
      weight: EVIDENCE_TYPE_WEIGHTS[type],
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.weight - a.weight);

  const nextTasks: NextTask[] = [];
  if (user.journeyStep < 2) {
    nextTasks.push({ title: 'Complete sign-up and goal setting', href: '/onboarding' });
  }
  if (!db.skillProfiles[uid]) {
    nextTasks.push({ title: 'Complete Skill Discovery and generate your transferable-skills profile', href: '/skills' });
  }
  if (!db.opportunityReports[uid]) {
    nextTasks.push({ title: 'Explore AI opportunities matched to you', href: '/opportunities' });
  }
  const doneTasks = db.labTasks.filter(
    (t) => t.uid === uid && t.status === 'done'
  ).length;
  if (doneTasks === 0) {
    nextTasks.push({ title: 'Complete your first hands-on task', href: '/tasks-lab' });
  }
  if (!db.returnPlans[uid]) {
    nextTasks.push({ title: 'Generate your 30-day return plan', href: '/plan' });
  }
  if (user.journeyStep < 6) {
    nextTasks.push({ title: 'Join the Plaza to meet fellow travelers', href: '/plaza' });
  }

  const lifts = db.users.map((u) =>
    Math.max(
      0,
      computeConfidenceScore(db.evidences.filter((e) => e.uid === u.uid)) -
        CONFIDENCE_BASE
    )
  );
  const avgConfidenceLift = lifts.length
    ? Math.round(lifts.reduce((sum, n) => sum + n, 0) / lifts.length)
    : 0;

  const impact = {
    mentors: db.mentors.length,
    womenSupported: new Set(db.users.map((u) => u.uid)).size,
    evidences: db.evidences.length,
    plazaConnections: db.peerChats.length,
    avgConfidenceLift,
  };

  return NextResponse.json({
    user,
    confidence,
    breakdown,
    nextTasks: nextTasks.slice(0, 3),
    recentEvidence: evidences.slice(0, 5),
    impact,
  });
}
