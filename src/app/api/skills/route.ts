import { NextRequest, NextResponse } from 'next/server';
import { ensureLoaded, findUser, addEvidence, nowIso, syncToFirestore } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import { buildSkillProfile } from '@/lib/ai';
import type { SkillProfile } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const db = await ensureLoaded();
  return NextResponse.json({ skillProfile: db.skillProfiles[uid] ?? null });
}

export async function POST(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const db = await ensureLoaded();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const built = await buildSkillProfile(user);
  const skillProfile: SkillProfile = { uid, createdAt: nowIso(), ...built };
  db.skillProfiles[uid] = skillProfile;
  syncToFirestore('skillProfiles', uid, skillProfile);

  // Record the assessment once — regenerating the profile must not duplicate it.
  const alreadyRecorded = db.evidences.some(
    (e) => e.uid === uid && e.type === 'assessment_result' && e.title === 'Completed the Skill Discovery assessment'
  );
  if (!alreadyRecorded) {
    addEvidence(db, {
      uid,
      type: 'assessment_result',
      title: 'Completed the Skill Discovery assessment',
      detail: `AI identified ${built.transferableSkills.length} transferable skills and completed confidence calibration across ${built.confidenceCalibration.length} dimensions.`,
      source: 'auto',
      tags: ['Skill discovery', 'Calibration'],
      isPublic: true,
    });
  }

  if (user.journeyStep < 2) user.journeyStep = 2;
  user.updatedAt = nowIso();
  syncToFirestore('users', uid, user);

  return NextResponse.json({ skillProfile });
}
