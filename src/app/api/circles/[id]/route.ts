import { NextRequest, NextResponse } from 'next/server';
import { getDB, findUser, newId, nowIso, addEvidence, syncToFirestore } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import type { CircleComment, EvidenceItem } from '@/lib/types';

export const runtime = 'nodejs';

interface CircleActionBody {
  action?: 'comment' | 'kudos' | 'report';
  text?: string;
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

  const post = db.circlePosts.find((p) => p.id === params.id);
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  let body: CircleActionBody = {};
  try {
    body = (await req.json()) as CircleActionBody;
  } catch {
    body = {};
  }

  switch (body.action) {
    case 'comment': {
      const text = typeof body.text === 'string' ? body.text.trim() : '';
      if (!text) {
        return NextResponse.json({ error: 'Comment text cannot be empty' }, { status: 400 });
      }
      const comment: CircleComment = {
        id: newId('cc'),
        postId: post.id,
        authorId: uid,
        authorName: user.name,
        text,
        createdAt: nowIso(),
      };
      db.circleComments.push(comment);
      syncToFirestore('circleComments', comment.id, comment);
      post.commentCount += 1;
      syncToFirestore('circlePosts', post.id, post);
      return NextResponse.json({ comment });
    }

    case 'kudos': {
      post.kudosCount += 1;
      let evidence: EvidenceItem | null = null;
      if (post.kudosCount >= 3 && post.authorId === uid) {
        const exists = db.evidences.some(
          (e) =>
            e.uid === post.authorId &&
            e.type === 'community_kudos' &&
            e.relatedId === post.id
        );
        if (!exists) {
          evidence = addEvidence(db, {
            uid: post.authorId,
            type: 'community_kudos',
            title: `Peer recognition: the post received ${post.kudosCount} kudos`,
            detail: `"${post.title}" received ${post.kudosCount} peer kudos.`,
            source: 'auto',
            tags: ['Circle', 'Peer recognition'],
            relatedType: 'circle_post',
            relatedId: post.id,
            isPublic: true,
          });
        }
      }
      return NextResponse.json({ kudosCount: post.kudosCount, evidence });
    }

    case 'report': {
      const reason = typeof body.reason === 'string' ? body.reason : '';
      db.reports.push({
        id: newId('rp'),
        reporterId: uid,
        targetType: 'circle_post',
        targetId: post.id,
        reason,
        createdAt: nowIso(),
      });
      syncToFirestore('reports', `rp_${Date.now()}`, { reporterId: uid, targetType: 'circle_post', targetId: post.id, reason, createdAt: nowIso() });
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
