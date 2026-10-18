import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import {
  ensureLoaded,
  findUser,
  findUserByEmail,
  getDB,
  migrateAnonymousData,
  nowIso,
  syncToFirestore,
} from '@/lib/store';
import {
  clearSessionCookie,
  getUidFromRequest,
  isAnonymousUid,
  setSessionCookie,
} from '@/lib/session';
import {
  hashPassword,
  isValidEmail,
  validatePassword,
  verifyPassword,
} from '@/lib/auth';
import type { UserProfile } from '@/lib/types';

export const runtime = 'nodejs';

interface SessionBody {
  action?: 'get' | 'register' | 'login' | 'logout';
  name?: string;
  email?: string;
  password?: string;
}

async function readBody(req: NextRequest): Promise<SessionBody> {
  try {
    return (await req.json()) as SessionBody;
  } catch {
    return {};
  }
}

function newUid(): string {
  return `u_${randomBytes(9).toString('hex')}`;
}

function createProfile(uid: string, name: string, email: string): UserProfile {
  const ts = nowIso();
  return {
    uid,
    name,
    email,
    currentRole: '',
    targetRole: '',
    skills: [],
    goals: [],
    constraints: {
      returnToWork: false,
      newIndustry: false,
      flexibility: false,
      weeklyHours: 0,
    },
    segment: 'explorer',
    lifeStage: 'student',
    confidenceSelf: 0,
    journeyStep: 1,
    coffeeAvailability: [],
    communityAgreed: false,
    backgroundSummary: '',
    createdAt: ts,
    updatedAt: ts,
  };
}

export async function POST(req: NextRequest) {
  const body = await readBody(req);
  const action = body.action ?? 'get';

  await ensureLoaded();
  const db = getDB();

  if (action === 'get') {
    const uid = getUidFromRequest(req);
    const user = uid ? findUser(db, uid) ?? null : null;
    return NextResponse.json({ user });
  }

  if (action === 'register') {
    const name = (body.name ?? '').trim();
    const email = (body.email ?? '').trim().toLowerCase();
    const password = body.password ?? '';

    if (!name) {
      return NextResponse.json(
        { error: 'Please enter your name.' },
        { status: 400 }
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }
    const weak = validatePassword(password);
    if (weak) {
      return NextResponse.json({ error: weak }, { status: 400 });
    }
    if (findUserByEmail(db, email)) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // If the visitor was anonymous, carry all diagnosis data (profile,
    // skills, opportunities, plan, evidence, lab tasks, chat history) onto
    // the new real account.
    const anonUid = getUidFromRequest(req);
    const uid = newUid();
    const user = createProfile(uid, name, email);

    if (anonUid && isAnonymousUid(anonUid)) {
      const anon = findUser(db, anonUid);
      if (anon) {
        // Copy the anonymous profile's real fields onto the new account,
        // keeping the new uid/email/name.
        user.currentRole = anon.currentRole;
        user.targetRole = anon.targetRole;
        user.skills = anon.skills;
        user.goals = anon.goals;
        user.constraints = anon.constraints;
        user.segment = anon.segment;
        user.lifeStage = anon.lifeStage;
        user.confidenceSelf = anon.confidenceSelf;
        user.journeyStep = anon.journeyStep;
        user.communityAgreed = anon.communityAgreed;
        user.backgroundSummary = anon.backgroundSummary;
        user.coffeeAvailability = anon.coffeeAvailability;
        user.resumeFileName = anon.resumeFileName;
        user.resumePath = anon.resumePath;
        user.resumeText = anon.resumeText;
        user.chosenRole = anon.chosenRole;
      }
      migrateAnonymousData(db, anonUid, uid);
    }

    const { salt, hash } = hashPassword(password);

    db.users.push(user);
    db.credentials[uid] = { salt, hash };
    syncToFirestore('users', uid, user);
    syncToFirestore('credentials', uid, { salt, hash });

    const res = NextResponse.json({ user });
    setSessionCookie(res, uid);
    // Clear the anonymous cookie now that the user has a real session.
    res.cookies.set('herrise_anon', '', { path: '/', maxAge: 0 });
    return res;
  }

  if (action === 'login') {
    const email = (body.email ?? '').trim().toLowerCase();
    const password = body.password ?? '';
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Please enter your email and password.' },
        { status: 400 }
      );
    }
    const user = findUserByEmail(db, email);
    const credential = user ? db.credentials[user.uid] : undefined;
    if (!user || !credential || !verifyPassword(password, credential)) {
      return NextResponse.json(
        { error: 'Incorrect email or password.' },
        { status: 401 }
      );
    }
    const res = NextResponse.json({ user });
    setSessionCookie(res, user.uid);
    return res;
  }

  if (action === 'logout') {
    const res = NextResponse.json({ ok: true });
    clearSessionCookie(res);
    return res;
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
