import { NextRequest, NextResponse } from 'next/server';
import { getDB, findUser, newId, nowIso, syncToFirestore } from '@/lib/store';
import type { DB } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import { pickAnonymousHandle } from '@/lib/constants';
import type { PlazaComment, PlazaPost } from '@/lib/types';

export const runtime = 'nodejs';

interface PlazaPostView extends Omit<PlazaPost, 'authorId'> {
  authorDisplay: string;
  viewerIsAuthor: boolean;
}

interface PlazaCommentView extends Omit<PlazaComment, 'authorId'> {
  authorDisplay: string;
}

function toPlazaPostView(
  post: PlazaPost,
  viewerUid: string | null,
  db: DB
): PlazaPostView {
  const author = db.users.find((u) => u.uid === post.authorId);
  const authorDisplay = post.anonymous
    ? post.anonymousHandle ?? 'Anonymous user'
    : author?.name ?? 'Anonymous user';
  const { authorId: _authorId, ...rest } = post;
  return { ...rest, authorDisplay, viewerIsAuthor: viewerUid === post.authorId };
}

function toPlazaCommentView(c: PlazaComment, db: DB): PlazaCommentView {
  const author = db.users.find((u) => u.uid === c.authorId);
  const authorDisplay = c.anonymous
    ? c.anonymousHandle ?? 'Anonymous user'
    : author?.name ?? 'Anonymous user';
  const { authorId: _authorId, ...rest } = c;
  return { ...rest, authorDisplay };
}

// Kudos dedup: persists across requests (module-level memory, globalThis singleton)
interface KudosRegistry {
  __rebloomKudosSeen?: Set<string>;
}
function kudosSeen(): Set<string> {
  const g = globalThis as unknown as KudosRegistry;
  if (!g.__rebloomKudosSeen) {
    g.__rebloomKudosSeen = new Set<string>();
  }
  return g.__rebloomKudosSeen;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getDB();
  const uid = getUidFromRequest(req);
  const post = db.plazaPosts.find((p) => p.id === params.id);
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const isAuthor = uid !== null && uid === post.authorId;
  const comments = db.plazaComments
    .filter((c) => c.postId === post.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((c) => toPlazaCommentView(c, db));

  const willingList = db.willing[post.id] ?? [];
  const willing = isAuthor ? willingList : null;
  const myWilling = uid
    ? willingList.some((w) => w.helperUid === uid)
    : false;

  return NextResponse.json({
    post: toPlazaPostView(post, uid, db),
    comments,
    willing,
    myWilling,
    isAuthor,
  });
}

interface ActionBody {
  action?: 'comment' | 'kudos' | 'report' | 'resolve';
  text?: string;
  anonymous?: boolean;
  reason?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const db = getDB();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const post = db.plazaPosts.find((p) => p.id === params.id);
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  let body: ActionBody = {};
  try {
    body = (await req.json()) as ActionBody;
  } catch {
    body = {};
  }

  switch (body.action) {
    case 'comment': {
      const text = typeof body.text === 'string' ? body.text.trim() : '';
      if (!text) {
        return NextResponse.json({ error: 'Comment text cannot be empty' }, { status: 400 });
      }
      const anonymous = Boolean(body.anonymous);
      const commentId = newId('pc');
      const comment: PlazaComment = {
        id: commentId,
        postId: post.id,
        authorId: uid,
        anonymous,
        text,
        createdAt: nowIso(),
      };
      if (anonymous) comment.anonymousHandle = pickAnonymousHandle(uid, commentId);
      db.plazaComments.push(comment);
      syncToFirestore('plazaComments', comment.id, comment);
      post.commentCount += 1;
      post.updatedAt = nowIso();
      syncToFirestore('plazaPosts', post.id, post);
      return NextResponse.json({ comment: toPlazaCommentView(comment, db) });
    }

    case 'kudos': {
      const key = `${post.id}::${uid}`;
      const seen = kudosSeen();
      if (!seen.has(key)) {
        seen.add(key);
        post.kudosCount += 1;
        post.updatedAt = nowIso();
      }
      return NextResponse.json({ kudosCount: post.kudosCount });
    }

    case 'report': {
      const reason = typeof body.reason === 'string' ? body.reason : '';
      db.reports.push({
        id: newId('rp'),
        reporterId: uid,
        targetType: 'plaza_post',
        targetId: post.id,
        reason,
        createdAt: nowIso(),
      });
      syncToFirestore('reports', `rp_${Date.now()}`, { reporterId: uid, targetType: 'plaza_post', targetId: post.id, reason, createdAt: nowIso() });
      return NextResponse.json({ ok: true });
    }

    case 'resolve': {
      if (uid !== post.authorId) {
        return NextResponse.json({ error: 'Only the author can mark it resolved' }, { status: 403 });
      }
      post.status = 'resolved';
      post.updatedAt = nowIso();
      return NextResponse.json({ post: toPlazaPostView(post, uid, db) });
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
