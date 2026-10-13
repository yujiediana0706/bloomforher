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
  if (typeof body.bookingId !== 'string') return '缺少预约 ID';
  if (
    typeof body.rating !== 'number' ||
    !Number.isInteger(body.rating) ||
    body.rating < 1 ||
    body.rating > 5
  ) {
    return '评分需为 1-5 的整数';
  }
  if (typeof body.comment !== 'string' || body.comment.trim().length < 5) {
    return '评价内容至少 5 个字';
  }
  return null;
}

export async function POST(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const db = getDB();
  const body = await readBody(req);
  const error = validate(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const booking = db.bookings.find((b) => b.id === body.bookingId);
  if (!booking) {
    return NextResponse.json({ error: '预约不存在' }, { status: 404 });
  }
  if (booking.coacheeId !== uid) {
    return NextResponse.json({ error: '只有学员可评价' }, { status: 403 });
  }
  if (booking.status !== 'released') {
    return NextResponse.json({ error: '当前状态不可评价' }, { status: 409 });
  }
  if (booking.review) {
    return NextResponse.json({ error: '该预约已评价' }, { status: 409 });
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
  if (!uid) return NextResponse.json({ error: '未登录' }, { status: 401 });

  const db = getDB();
  const body = await readBody(req);
  const error = validate(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const booking = db.bookings.find((b) => b.id === body.bookingId);
  if (!booking) {
    return NextResponse.json({ error: '预约不存在' }, { status: 404 });
  }
  if (booking.coacheeId !== uid) {
    return NextResponse.json({ error: '只有学员可评价' }, { status: 403 });
  }

  booking.review = {
    rating: body.rating as number,
    comment: (body.comment as string).trim(),
    createdAt: nowIso(),
  };
  booking.updatedAt = nowIso();

  return NextResponse.json({ booking });
}
