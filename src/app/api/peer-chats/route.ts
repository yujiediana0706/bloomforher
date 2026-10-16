import { NextRequest, NextResponse } from 'next/server';
import { getDB, findUser, newId, nowIso, addEvidence, syncToFirestore } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import type { PeerChat } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const db = getDB();
  const peerChats = db.peerChats
    .filter((c) => c.requesterId === uid || c.helperId === uid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ peerChats });
}

interface PeerBody {
  action?: 'create' | 'confirm' | 'complete' | 'cancel' | 'appreciate';
  postId?: string;
  helperUid?: string;
  proposedTime?: string;
  chatId?: string;
  chatLink?: string;
  text?: string;
}

export async function POST(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const db = getDB();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  let body: PeerBody = {};
  try {
    body = (await req.json()) as PeerBody;
  } catch {
    body = {};
  }

  switch (body.action) {
    case 'create': {
      const { postId, helperUid, proposedTime } = body;
      if (
        typeof postId !== 'string' ||
        typeof helperUid !== 'string' ||
        typeof proposedTime !== 'string'
      ) {
        return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
      }
      const list = db.willing[postId] ?? [];
      const willing = list.find(
        (w) => w.helperUid === helperUid && w.status === 'offered'
      );
      if (!willing) {
        return NextResponse.json(
          { error: 'This user has not offered to help, or is already booked' },
          { status: 409 }
        );
      }
      willing.status = 'booked';

      const chat: PeerChat = {
        id: newId('chat'),
        requesterId: uid,
        requesterName: user.name,
        helperId: helperUid,
        helperName: willing.helperName,
        postId,
        status: 'requested',
        proposedTime,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.peerChats.push(chat);
      syncToFirestore('peerChats', chat.id, chat);
      return NextResponse.json({ chat });
    }

    case 'confirm': {
      const chat = db.peerChats.find((c) => c.id === body.chatId);
      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }
      if (chat.helperId !== uid) {
        return NextResponse.json({ error: 'Only the helper can confirm' }, { status: 403 });
      }
      chat.status = 'confirmed';
      chat.confirmedTime = nowIso();
      if (typeof body.chatLink === 'string' && body.chatLink) {
        chat.chatLink = body.chatLink;
      }
      chat.updatedAt = nowIso();
      return NextResponse.json({ chat });
    }

    case 'complete': {
      const chat = db.peerChats.find((c) => c.id === body.chatId);
      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }
      if (chat.requesterId !== uid && chat.helperId !== uid) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
      chat.status = 'completed';
      chat.updatedAt = nowIso();
      const list = db.willing[chat.postId] ?? [];
      const willing = list.find((w) => w.helperUid === chat.helperId);
      if (willing) willing.status = 'consumed';
      return NextResponse.json({ chat });
    }

    case 'cancel': {
      const chat = db.peerChats.find((c) => c.id === body.chatId);
      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }
      if (chat.requesterId !== uid && chat.helperId !== uid) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
      chat.status = 'cancelled';
      chat.updatedAt = nowIso();
      const list = db.willing[chat.postId] ?? [];
      const willing = list.find((w) => w.helperUid === chat.helperId);
      if (willing) willing.status = 'offered';
      return NextResponse.json({ chat });
    }

    case 'appreciate': {
      const chat = db.peerChats.find((c) => c.id === body.chatId);
      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
      }
      if (chat.requesterId !== uid) {
        return NextResponse.json({ error: 'Only the requester can express appreciation' }, { status: 403 });
      }
      const text = typeof body.text === 'string' ? body.text.trim() : '';
      if (!text) {
        return NextResponse.json({ error: 'Appreciation text cannot be empty' }, { status: 400 });
      }
      chat.appreciation = text;
      chat.updatedAt = nowIso();

      const evidence = addEvidence(db, {
        uid: chat.helperId,
        type: 'peer_appreciation',
        title: `Peer appreciation: ${chat.requesterName}`,
        detail: text,
        source: 'auto',
        tags: ['Peer appreciation'],
        relatedType: 'peer_chat',
        relatedId: chat.id,
        isPublic: true,
      });
      return NextResponse.json({ chat, evidence });
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
