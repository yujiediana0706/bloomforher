import { NextRequest, NextResponse } from 'next/server';
import { getDB, findUser, nowIso } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import { LIFE_STAGE_LABELS } from '@/lib/constants';
import type { WillingToHelp } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const db = getDB();
  const post = db.plazaPosts.find((p) => p.id === params.id);
  if (!post) {
    return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
  }
  if (uid !== post.authorId) {
    return NextResponse.json({ error: '只有作者可以查看' }, { status: 403 });
  }

  return NextResponse.json({ willing: db.willing[post.id] ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const db = getDB();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

  const post = db.plazaPosts.find((p) => p.id === params.id);
  if (!post) {
    return NextResponse.json({ error: '帖子不存在' }, { status: 404 });
  }

  const list = db.willing[post.id] ?? (db.willing[post.id] = []);
  if (list.some((w) => w.helperUid === uid)) {
    return NextResponse.json({ error: '你已经表示过愿意帮助' }, { status: 409 });
  }

  const willing: WillingToHelp = {
    helperUid: uid,
    helperName: user.name,
    helperBio: user.backgroundSummary,
    helperSkills: user.skills,
    helperLifeStage: LIFE_STAGE_LABELS[user.lifeStage],
    helperAvatarUrl: user.avatarUrl,
    status: 'offered',
    createdAt: nowIso(),
  };
  list.push(willing);
  post.willingToHelpCount += 1;
  post.updatedAt = nowIso();

  return NextResponse.json({ willing });
}
