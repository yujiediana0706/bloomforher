import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/store';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = getDB();
  const mentor = db.mentors.find((m) => m.id === params.id);
  if (!mentor) {
    return NextResponse.json({ error: '导师不存在' }, { status: 404 });
  }
  const slots = db.mentorSlots.filter((s) => s.mentorId === mentor.id);
  return NextResponse.json({ mentor, slots });
}
