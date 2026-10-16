import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import type { Booking } from '@/lib/types';

export const runtime = 'nodejs';

function maskMeetingLink(booking: Booking, uid: string): Booking {
  if (booking.coacheeId !== uid) {
    return { ...booking, meetingLink: undefined };
  }
  return booking;
}

export async function GET(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const db = getDB();
  const mentorIds = db.mentors
    .filter((m) => m.userId === uid)
    .map((m) => m.id);

  const bookings = db.bookings
    .filter((b) => b.coacheeId === uid || mentorIds.includes(b.mentorId))
    .map((b) => maskMeetingLink(b, uid));

  const peerChats = db.peerChats
    .filter((c) => c.requesterId === uid || c.helperId === uid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const packageOrders = db.packageOrders.filter((o) => o.coacheeId === uid);

  return NextResponse.json({ bookings, peerChats, packageOrders });
}
