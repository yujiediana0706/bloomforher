import { NextRequest, NextResponse } from 'next/server';
import { getDB, nowIso } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';

export const runtime = 'nodejs';

interface ReviewBody {
  bookingId?: string;
  rating?: number;
  comment?: string;
}

async function readBody(req: NextRequest): Promise<ReviewBody> {
  try {
    return (await req.json()) as ReviewBody;
  } catch {
    return {};
  }
}

function validate(body: ReviewBody): string | null {
  if (typeof body.bookingId !== 'string') return 'Missing booking ID';
  if (
    typeof body.rating !== 'number' ||
    !Number.isInteger(body.rating) ||
    body.rating < 1 ||
    body.rating > 5
  ) {
    return 'Rating must be an integer from 1 to 5';
  }
  if (typeof body.comment !== 'string' || body.comment.trim().length < 5) {
    return 'Review comment must be at least 5 characters';
  }
  return null;
}

export async function POST(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const db = getDB();
  const body = await readBody(req);
  const error = validate(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const booking = db.bookings.find((b) => b.id === body.bookingId);
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }
  if (booking.coacheeId !== uid) {
    return NextResponse.json({ error: 'Only the coachee can leave a review' }, { status: 403 });
  }
  if (booking.status !== 'released') {
    return NextResponse.json({ error: 'Booking is not in a state that can be reviewed' }, { status: 409 });
  }
  if (booking.review) {
    return NextResponse.json({ error: 'This booking has already been reviewed' }, { status: 409 });
  }

  booking.review = {
    rating: body.rating as number,
    comment: (body.comment as string).trim(),
    createdAt: nowIso(),
  };
  booking.updatedAt = nowIso();

  return NextResponse.json({ booking });
}

export async function PUT(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const db = getDB();
  const body = await readBody(req);
  const error = validate(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const booking = db.bookings.find((b) => b.id === body.bookingId);
  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }
  if (booking.coacheeId !== uid) {
    return NextResponse.json({ error: 'Only the coachee can leave a review' }, { status: 403 });
  }

  booking.review = {
    rating: body.rating as number,
    comment: (body.comment as string).trim(),
    createdAt: nowIso(),
  };
  booking.updatedAt = nowIso();

  return NextResponse.json({ booking });
}
