import { NextRequest, NextResponse } from 'next/server';
import { getDB, findUser, newId, nowIso, addEvidence, syncToFirestore } from '@/lib/store';
import type { DB } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import type { Booking, BookingKind, BookingStatus, PackageOrder } from '@/lib/types';

export const runtime = 'nodejs';

const VISIBLE_STATUSES: BookingStatus[] = ['confirmed', 'completed', 'released'];

function mentorOwnerUid(db: DB, mentorId: string): string | undefined {
  return db.mentors.find((m) => m.id === mentorId)?.userId;
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
    .map((b): Booking => {
      const related = b.coacheeId === uid || mentorIds.includes(b.mentorId);
      if (!related || !VISIBLE_STATUSES.includes(b.status)) {
        return { ...b, meetingLink: undefined };
      }
      return b;
    });

  return NextResponse.json({ bookings });
}

interface BookingBody {
  action?:
    | 'create'
    | 'redeem'
    | 'confirm'
    | 'reject'
    | 'complete'
    | 'release'
    | 'endorse';
  mentorId?: string;
  slotId?: string;
  kind?: string;
  topic?: string;
  packageOrderId?: string;
  bookingId?: string;
  text?: string;
}

export async function POST(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const db = getDB();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  let body: BookingBody = {};
  try {
    body = (await req.json()) as BookingBody;
  } catch {
    body = {};
  }

  switch (body.action) {
    case 'create': {
      const { mentorId, slotId, kind, topic } = body;
      if (
        typeof mentorId !== 'string' ||
        typeof slotId !== 'string' ||
        typeof topic !== 'string' ||
        (kind !== 'single' && kind !== 'package')
      ) {
        return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
      }
      const mentor = db.mentors.find((m) => m.id === mentorId);
      if (!mentor) {
        return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
      }
      const slot = db.mentorSlots.find(
        (s) => s.id === slotId && s.mentorId === mentorId
      );
      if (!slot) {
        return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
      }
      if (slot.status !== 'available') {
        return NextResponse.json({ error: 'This slot is already booked' }, { status: 409 });
      }
      slot.status = 'booked';

      const amount =
        kind === 'package' ? mentor.pricePackage5 : mentor.priceSingle;
      const booking: Booking = {
        id: newId('bk'),
        coacheeId: uid,
        coacheeName: user.name,
        mentorId: mentor.id,
        mentorName: mentor.displayName,
        slotId: slot.id,
        kind: kind as BookingKind,
        status: 'held',
        amount,
        snapshotMentorName: mentor.displayName,
        snapshotPrice: amount,
        scheduledTime: slot.startAt,
        topic,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

      let packageOrder: PackageOrder | null = null;
      if (kind === 'package') {
        packageOrder = {
          id: newId('pkg'),
          coacheeId: uid,
          mentorId: mentor.id,
          totalSessions: 5,
          remainingRedemptions: 4,
          amount: mentor.pricePackage5,
          status: 'active',
          createdAt: nowIso(),
        };
        db.packageOrders.push(packageOrder);
        syncToFirestore('packageOrders', packageOrder.id, packageOrder);
        booking.packageOrderId = packageOrder.id;
      }

      db.bookings.push(booking);
      syncToFirestore('bookings', booking.id, booking);
      return NextResponse.json({ booking, packageOrder });
    }

    case 'redeem': {
      const { packageOrderId, slotId, topic } = body;
      if (
        typeof packageOrderId !== 'string' ||
        typeof slotId !== 'string' ||
        typeof topic !== 'string'
      ) {
        return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
      }
      const order = db.packageOrders.find((o) => o.id === packageOrderId);
      if (!order) {
        return NextResponse.json({ error: 'Package order not found' }, { status: 404 });
      }
      if (order.coacheeId !== uid) {
        return NextResponse.json({ error: 'You are not allowed to use this package' }, { status: 403 });
      }
      if (order.remainingRedemptions <= 0) {
        return NextResponse.json({ error: 'No redemptions left in this package' }, { status: 409 });
      }
      const slot = db.mentorSlots.find(
        (s) => s.id === slotId && s.mentorId === order.mentorId
      );
      if (!slot) {
        return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
      }
      if (slot.status !== 'available') {
        return NextResponse.json({ error: 'This slot is already booked' }, { status: 409 });
      }

      slot.status = 'booked';
      order.remainingRedemptions -= 1;
      if (order.remainingRedemptions === 0) order.status = 'consumed';

      const mentor = db.mentors.find((m) => m.id === order.mentorId);
      const booking: Booking = {
        id: newId('bk'),
        coacheeId: uid,
        coacheeName: user.name,
        mentorId: order.mentorId,
        mentorName: mentor?.displayName ?? '',
        slotId: slot.id,
        kind: 'package',
        status: 'held',
        amount: 0,
        snapshotMentorName: mentor?.displayName ?? '',
        snapshotPrice: mentor?.priceSingle ?? 0,
        scheduledTime: slot.startAt,
        packageOrderId: order.id,
        topic,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      db.bookings.push(booking);
      syncToFirestore('bookings', booking.id, booking);
      return NextResponse.json({ booking, packageOrder: order });
    }

    case 'confirm': {
      const booking = db.bookings.find((b) => b.id === body.bookingId);
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      if (mentorOwnerUid(db, booking.mentorId) !== uid) {
        return NextResponse.json({ error: 'Only the mentor can confirm' }, { status: 403 });
      }
      booking.status = 'confirmed';
      // The coachee can only see the meeting link after the mentor confirms
      if (!booking.meetingLink) {
        booking.meetingLink = `https://meet.example.com/rebloom-${booking.id}`;
      }
      booking.updatedAt = nowIso();
      return NextResponse.json({ booking });
    }

    case 'reject': {
      const booking = db.bookings.find((b) => b.id === body.bookingId);
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      if (mentorOwnerUid(db, booking.mentorId) !== uid) {
        return NextResponse.json({ error: 'Only the mentor can reject' }, { status: 403 });
      }
      booking.status = 'rejected';
      booking.updatedAt = nowIso();

      const slot = db.mentorSlots.find((s) => s.id === booking.slotId);
      if (slot && slot.status === 'booked') slot.status = 'available';

      if (booking.packageOrderId) {
        const order = db.packageOrders.find((o) => o.id === booking.packageOrderId);
        if (order) {
          order.remainingRedemptions += 1;
          if (order.status === 'consumed') order.status = 'active';
        }
      }
      return NextResponse.json({ booking });
    }

    case 'complete': {
      const booking = db.bookings.find((b) => b.id === body.bookingId);
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      const isParty =
        booking.coacheeId === uid || mentorOwnerUid(db, booking.mentorId) === uid;
      if (!isParty) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }
      booking.status = 'completed';
      booking.updatedAt = nowIso();
      return NextResponse.json({ booking });
    }

    case 'release': {
      const booking = db.bookings.find((b) => b.id === body.bookingId);
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      if (booking.coacheeId !== uid) {
        return NextResponse.json({ error: 'Only the coachee can confirm completion' }, { status: 403 });
      }
      booking.status = 'released';
      booking.updatedAt = nowIso();
      return NextResponse.json({ booking });
    }

    case 'endorse': {
      const booking = db.bookings.find((b) => b.id === body.bookingId);
      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      if (mentorOwnerUid(db, booking.mentorId) !== uid) {
        return NextResponse.json({ error: 'Only the mentor can endorse' }, { status: 403 });
      }
      if (booking.status !== 'released') {
        return NextResponse.json({ error: 'Booking is not in a state that can be endorsed' }, { status: 409 });
      }
      const text = typeof body.text === 'string' ? body.text.trim() : '';
      if (!text) {
        return NextResponse.json({ error: 'Endorsement text cannot be empty' }, { status: 400 });
      }
      booking.endorsement = text;
      booking.updatedAt = nowIso();

      const evidence = addEvidence(db, {
        uid: booking.coacheeId,
        type: 'mentor_endorsement',
        title: `Mentor endorsement: ${booking.mentorName}`,
        detail: text,
        source: 'auto',
        tags: ['Mentor endorsement', 'Verified'],
        relatedType: 'booking',
        relatedId: booking.id,
        isPublic: true,
      });
      return NextResponse.json({ booking, evidence });
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
