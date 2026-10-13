import { NextResponse } from 'next/server';
import { getDB } from '@/lib/store';

export const runtime = 'nodejs';

export async function GET() {
  const db = getDB();
  return NextResponse.json({ mentors: db.mentors });
}
