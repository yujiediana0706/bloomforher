import { NextRequest, NextResponse } from 'next/server';
import { findUser, getDB, newId, nowIso, syncToFirestore } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import type { Mentor } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const db = getDB();
  const mentor = db.mentors.find((m) => m.userId === uid) || null;
  return NextResponse.json({ mentor });
}

export async function POST(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  const body = (await req.json().catch(() => null)) as Partial<{
    displayName: string;
    headline: string;
    bio: string;
    companies: string[];
    schools: string[];
    topicTags: string[];
    priceSingle: number;
    pricePackage5: number;
  }> | null;
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
  }
  const db = getDB();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  let mentor = db.mentors.find((m) => m.userId === uid);
  if (!mentor) {
    const created: Mentor = {
      id: newId('mentor'),
      userId: uid,
      displayName: body.displayName || user.name,
      avatarUrl: user.avatarUrl,
      headline: body.headline || 'New mentor',
      bio: body.bio || '',
      companies: body.companies || [],
      schools: body.schools || [],
      topicTags: body.topicTags || [],
      priceSingle: body.priceSingle ?? 49,
      pricePackage5: body.pricePackage5 ?? 199,
      verified: false,
      verificationStatus: 'pending',
      rating: 0,
      sessionsCount: 0,
      impactWomenCount: 0,
      reviews: [],
      createdAt: nowIso(),
    };
    db.mentors.push(created);
    syncToFirestore('mentors', created.id, created);
    mentor = created;
  } else {
    if (body.displayName !== undefined) mentor.displayName = body.displayName;
    if (body.headline !== undefined) mentor.headline = body.headline;
    if (body.bio !== undefined) mentor.bio = body.bio;
    if (body.companies !== undefined) mentor.companies = body.companies;
    if (body.schools !== undefined) mentor.schools = body.schools;
    if (body.topicTags !== undefined) mentor.topicTags = body.topicTags;
    if (body.priceSingle !== undefined) mentor.priceSingle = body.priceSingle;
    if (body.pricePackage5 !== undefined)
      mentor.pricePackage5 = body.pricePackage5;
  }

  return NextResponse.json({ mentor });
}
