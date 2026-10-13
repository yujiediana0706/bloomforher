import { NextRequest, NextResponse } from 'next/server';
import { getDB, findUser, addEvidence, nowIso } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import { buildSkillProfile } from '@/lib/ai';
import type { SkillProfile } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const db = getDB();
  return NextResponse.json({ skillProfile: db.skillProfiles[uid] ?? null });
}

export async function POST(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const db = getDB();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

  const built = buildSkillProfile(user);
  const skillProfile: SkillProfile = { uid, createdAt: nowIso(), ...built };
  db.skillProfiles[uid] = skillProfile;

  addEvidence(db, {
    uid,
    type: 'assessment_result',
    title: '完成技能发现测评',
    detail: `AI 识别出 ${built.transferableSkills.length} 项可迁移技能，并完成 ${built.confidenceCalibration.length} 维自信度校准。`,
    source: 'auto',
    tags: ['技能发现', '校准'],
    isPublic: true,
  });

  if (user.journeyStep < 2) user.journeyStep = 2;
  user.updatedAt = nowIso();

  return NextResponse.json({ skillProfile });
}
