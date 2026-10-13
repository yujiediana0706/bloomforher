import { NextRequest, NextResponse } from 'next/server';
import { getDB, newId } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import type { MentorSlot } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const db = getDB();
  const mentor = db.mentors.find((m) => m.userId === uid);
  if (!mentor) return NextResponse.json({ slots: [] });
  const slots = db.mentorSlots
    .filter((s) => s.mentorId === mentor.id)
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  return NextResponse.json({ slots, mentorId: mentor.id });
}

export async function POST(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const body = (await req.json().catch(() => null)) as {
    startAt?: string;
    endAt?: string;
  } | null;
  if (!body?.startAt) {
    return NextResponse.json({ error: '缺少开始时间' }, { status: 400 });
  }
  const db = getDB();
  const mentor = db.mentors.find((m) => m.userId === uid);
  if (!mentor) {
    return NextResponse.json({ error: '请先开通导师资料' }, { status: 400 });
  }
  const start = new Date(body.startAt);
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: '时间格式错误' }, { status: 400 });
  }
  const end = body.endAt
    ? new Date(body.endAt)
    : new Date(start.getTime() + 60 * 60 * 1000);
  const slot: MentorSlot = {
    id: newId('slot'),
    mentorId: mentor.id,
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    status: 'available',
  };
  db.mentorSlots.push(slot);
  return NextResponse.json({ slot });
}

export async function DELETE(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { slotId?: string } | null;
  if (!body?.slotId) {
    return NextResponse.json({ error: '缺少 slotId' }, { status: 400 });
  }
  const db = getDB();
  const mentor = db.mentors.find((m) => m.userId === uid);
  if (!mentor) return NextResponse.json({ error: '无权限' }, { status: 403 });
  const slot = db.mentorSlots.find(
    (s) => s.id === body.slotId && s.mentorId === mentor.id
  );
  if (!slot) return NextResponse.json({ error: '档期不存在' }, { status: 404 });
  if (slot.status === 'booked') {
    return NextResponse.json({ error: '已被预约，无法删除' }, { status: 409 });
  }
  db.mentorSlots = db.mentorSlots.filter((s) => s.id !== slot.id);
  return NextResponse.json({ ok: true });
}
