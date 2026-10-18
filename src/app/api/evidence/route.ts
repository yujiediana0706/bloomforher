import { NextRequest, NextResponse } from 'next/server';
import { ensureLoaded, findUser, addEvidence } from '@/lib/store';
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

/** Never let the weekly AI summary block the page: 6s cap, then fallback text. */
async function weeklySummaryWithTimeout(
  user: Parameters<typeof buildWeeklyConfidenceSummary>[0],
  evidences: Parameters<typeof buildWeeklyConfidenceSummary>[1]
): Promise<string> {
  try {
    return await Promise.race([
      buildWeeklyConfidenceSummary(user, evidences),
      new Promise<string>((resolve) =>
        setTimeout(
          () =>
            resolve(
              evidences.length > 0
                ? `${evidences.length} evidence item(s) recorded so far. The detailed weekly review is still being prepared.`
                : ''
            ),
          6000
        )
      ),
    ]);
  } catch {
    return evidences.length > 0
      ? `${evidences.length} evidence item(s) recorded so far.`
      : '';
  }
}

export async function GET(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const db = await ensureLoaded();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const evidences = db.evidences
    .filter((e) => e.uid === uid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const confidence = computeConfidenceScore(evidences);
  const weeklySummary = await weeklySummaryWithTimeout(user, evidences);

  return NextResponse.json({ evidences, confidence, weeklySummary });
}

export async function POST(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const db = await ensureLoaded();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  let body: EvidenceBody = {};
  try {
    body = (await req.json()) as EvidenceBody;
  } catch {
    body = {};
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const detail = typeof body.detail === 'string' ? body.detail : '';
  if (!title) {
    return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
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
