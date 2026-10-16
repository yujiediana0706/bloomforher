import { NextRequest, NextResponse } from 'next/server';
import { ensureLoaded, findUser, nowIso, syncToFirestore } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';

export const runtime = 'nodejs';

const ALLOWED_FIELDS = [
  'name',
  'currentRole',
  'targetRole',
  'skills',
  'goals',
  'backgroundSummary',
  'lifeStage',
  'confidenceSelf',
  'journeyStep',
  'communityAgreed',
  'coffeeAvailability',
  'constraints',
  'segment',
  'resumePath',
  'avatarUrl',
] as const;

export async function GET(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const db = await ensureLoaded();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ user });
}

export async function POST(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
  }
  const db = await ensureLoaded();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  for (const key of ALLOWED_FIELDS) {
    if (key in body) {
      // Prototype stage: allow these editable fields to be merged directly
      (user as unknown as Record<string, unknown>)[key] = body[key];
    }
  }
  user.updatedAt = nowIso();
  syncToFirestore('users', uid, user);
  return NextResponse.json({ user });
}
