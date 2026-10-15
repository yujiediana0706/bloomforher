import { NextRequest, NextResponse } from 'next/server';
import { getDB, findUser, newId, nowIso, syncToFirestore } from '@/lib/store';
import type { DB } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import { pickAnonymousHandle } from '@/lib/constants';
import { moderateContent } from '@/lib/ai';
import type { PlazaPost } from '@/lib/types';

export const runtime = 'nodejs';

interface PlazaPostView extends Omit<PlazaPost, 'authorId'> {
  authorDisplay: string;
  viewerIsAuthor: boolean;
}

function toPlazaPostView(
  post: PlazaPost,
  viewerUid: string | null,
  db: DB
): PlazaPostView {
  const author = db.users.find((u) => u.uid === post.authorId);
  const authorDisplay = post.anonymous
    ? post.anonymousHandle ?? '匿名用户'
    : author?.name ?? '匿名用户';
  const { authorId: _authorId, ...rest } = post;
  return { ...rest, authorDisplay, viewerIsAuthor: viewerUid === post.authorId };
}

const MAX_IMAGES = 3;
const MAX_IMAGE_CHARS = 1_500_000; // 单张 data URL 上限（约 1.1MB 图片）

export async function GET(req: NextRequest) {
  const db = getDB();
  const uid = getUidFromRequest(req);
  const status = req.nextUrl.searchParams.get('status');

  let posts = [...db.plazaPosts];
  if (status) posts = posts.filter((p) => p.status === status);
  posts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({
    posts: posts.map((p) => toPlazaPostView(p, uid, db)),
  });
}

interface CreatePostBody {
  title?: string;
  body?: string;
  images?: string[];
  tags?: string[];
  anonymous?: boolean;
}

export async function POST(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const db = getDB();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 });

  let body: CreatePostBody = {};
  try {
    body = (await req.json()) as CreatePostBody;
  } catch {
    body = {};
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const text = typeof body.body === 'string' ? body.body.trim() : '';
  const images = Array.isArray(body.images)
    ? body.images.filter(
        (i): i is string =>
          typeof i === 'string' && i.length > 0 && i.length <= MAX_IMAGE_CHARS
      )
    : [];
  if (!title && !text && images.length === 0) {
    return NextResponse.json(
      { error: '标题、正文、图片至少填写一项' },
      { status: 400 }
    );
  }
  if (images.length > MAX_IMAGES) {
    return NextResponse.json(
      { error: `图片最多 ${MAX_IMAGES} 张` },
      { status: 400 }
    );
  }

  // AI 内容安全审核（守护者）
  const moderation = await moderateContent({ title, body: text, images });
  if (!moderation.pass) {
    return NextResponse.json(
      { error: moderation.advice || '内容未通过审核，请调整后再试', code: 'CONTENT_REJECTED' },
      { status: 400 }
    );
  }

  const postId = newId('post');
  const anonymous = Boolean(body.anonymous);
  const post: PlazaPost = {
    id: postId,
    authorId: uid,
    anonymous,
    title,
    body: text,
    images,
    tags: Array.isArray(body.tags)
      ? body.tags.filter((t): t is string => typeof t === 'string')
      : [],
    status: 'open',
    kudosCount: 0,
    commentCount: 0,
    willingToHelpCount: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  if (anonymous) post.anonymousHandle = pickAnonymousHandle(uid, postId);

  db.plazaPosts.unshift(post);
  syncToFirestore('plazaPosts', post.id, post);

  return NextResponse.json({ post: toPlazaPostView(post, uid, db) });
}
