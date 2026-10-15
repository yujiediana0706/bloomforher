import { NextRequest, NextResponse } from 'next/server';
import { getDB, findUser, newId, nowIso, syncToFirestore } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import { LIFE_STAGE_LABELS } from '@/lib/constants';
import type { CirclePost, CirclePostType } from '@/lib/types';

export const runtime = 'nodejs';

const CIRCLE_TYPES: CirclePostType[] = ['qa', 'opportunity', 'win', 'cheer'];

export async function GET() {
  const db = getDB();
  const posts = [...db.circlePosts].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );
  return NextResponse.json({ posts });
}

interface CreateCircleBody {
  type?: string;
  title?: string;
  body?: string;
  tags?: string[];
  evidenceRef?: string;
}

export async function POST(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const db = getDB();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

  let body: CreateCircleBody = {};
  try {
    body = (await req.json()) as CreateCircleBody;
  } catch {
    body = {};
  }

  const type = body.type as CirclePostType | undefined;
  if (!type || !CIRCLE_TYPES.includes(type)) {
    return NextResponse.json({ error: '帖子类型不合法' }, { status: 400 });
  }
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) {
    return NextResponse.json({ error: '标题不能为空' }, { status: 400 });
  }

  const post: CirclePost = {
    id: newId('circle'),
    authorId: uid,
    authorName: user.name,
    authorAvatarUrl: user.avatarUrl,
    authorStage: LIFE_STAGE_LABELS[user.lifeStage],
    type,
    title,
    body: typeof body.body === 'string' ? body.body : '',
    tags: Array.isArray(body.tags)
      ? body.tags.filter((t): t is string => typeof t === 'string')
      : [],
    kudosCount: 0,
    commentCount: 0,
    createdAt: nowIso(),
  };
  if (typeof body.evidenceRef === 'string') post.evidenceRef = body.evidenceRef;

  db.circlePosts.unshift(post);
  syncToFirestore('circlePosts', post.id, post);
  return NextResponse.json({ post });
}
