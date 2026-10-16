import { NextRequest, NextResponse } from 'next/server';
import { ensureLoaded, findUser, getDB, nowIso, syncToFirestore } from '@/lib/store';
import { getUidFromRequest } from '@/lib/session';
import { MAX_RESUME_BYTES, parseResume } from '@/lib/resume';

export const runtime = 'nodejs';

/** Return the resume stored on the signed-in user's profile. */
export async function GET(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const db = await ensureLoaded();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({
    resumeFileName: user.resumeFileName ?? null,
    resumeText: user.resumeText ?? null,
  });
}

/** Upload a resume, parse it, and persist the extracted text on the user profile. */
export async function POST(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const db = await ensureLoaded();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid upload request' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file was uploaded' }, { status: 400 });
  }
  if (file.size > MAX_RESUME_BYTES) {
    return NextResponse.json(
      { error: 'File is too large. Please upload a file under 5 MB.' },
      { status: 413 }
    );
  }

  let text: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    text = await parseResume(file.name, buffer);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to read this file.';
    return NextResponse.json({ error: message }, { status: 422 });
  }

  // Store the parsed text on the user's profile and persist it to Firestore so
  // it survives restarts and is available to the AI coach and diagnosis.
  user.resumeFileName = file.name;
  user.resumePath = file.name;
  user.resumeText = text;
  user.updatedAt = nowIso();
  syncToFirestore('users', uid, user);

  return NextResponse.json({
    resumeFileName: user.resumeFileName,
    resumeText: user.resumeText,
  });
}

/** Remove the stored resume from the user profile. */
export async function DELETE(req: NextRequest) {
  const uid = getUidFromRequest(req);
  if (!uid) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const db = await ensureLoaded();
  const user = findUser(db, uid);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  delete user.resumeFileName;
  delete user.resumePath;
  delete user.resumeText;
  user.updatedAt = nowIso();
  // Explicit nulls so a merge write actually clears the previously stored fields.
  syncToFirestore('users', uid, {
    ...user,
    resumeFileName: null,
    resumePath: null,
    resumeText: null,
  });

  return NextResponse.json({ ok: true });
}
