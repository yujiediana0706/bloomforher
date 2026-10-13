import { NextRequest, NextResponse } from 'next/server';
import { getDB, findUser } from '@/lib/store';
import { SESSION_COOKIE } from '@/lib/session';

export const runtime = 'nodejs';

interface SessionBody {
  action?: 'get' | 'login' | 'logout';
  uid?: string;
}

async function readBody(req: NextRequest): Promise<SessionBody> {
  try {
    return (await req.json()) as SessionBody;
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  const db = getDB();
  const body = await readBody(req);
  const action = body.action ?? 'get';

  if (action === 'get') {
    const uid = req.cookies.get(SESSION_COOKIE)?.value;
    const user = uid ? findUser(db, uid) ?? null : null;
    return NextResponse.json({ user });
  }

  if (action === 'login') {
    const uid = body.uid;
    if (!uid) {
      return NextResponse.json({ error: '缺少 uid' }, { status: 400 });
    }
    const user = findUser(db, uid);
    if (!user) {
      return NextResponse.json({ error: '账号不存在' }, { status: 400 });
    }
    const res = NextResponse.json({ user });
    res.cookies.set(SESSION_COOKIE, uid, {
      httpOnly: false,
      path: '/',
      sameSite: 'lax',
    });
    return res;
  }

  if (action === 'logout') {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
    return res;
  }

  return NextResponse.json({ error: '未知操作' }, { status: 400 });
}
