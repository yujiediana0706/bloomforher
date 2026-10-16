/**
 * scripts/seed.ts — ReBloom AI idempotent seed script (clear first, then insert)
 *
 * Usage: npx tsx scripts/seed.ts
 * Dependencies: firebase-admin (server SDK; runs with admin privileges, bypassing security rules)
 * Auth: reads SERVICE_ACCOUNT_PATH first; otherwise falls back to GOOGLE_APPLICATION_CREDENTIALS.
 *
 * Note: this script shares the same seed data with src/lib/mockData.ts (single source of truth)
 *       and maps the in-memory data into the Firestore collection structure (uid -> docId / userId).
 */
import { readFileSync } from 'node:fs';
import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import {
  COMMUNITY_USERS,
  MENTORS,
  MENTOR_SLOTS,
  MENTOR_USERS,
  SEED_CIRCLE_POSTS,
  SEED_PLAZA_COMMENTS,
  SEED_PLAZA_POSTS,
} from '../src/lib/mockData';
import type { UserProfile } from '../src/lib/types';

const PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ??
  process.env.GOOGLE_CLOUD_PROJECT ??
  'buildercup2026-511504';

function initApp(): App {
  if (getApps().length) return getApps()[0];
  const saPath = process.env.SERVICE_ACCOUNT_PATH;
  if (saPath) {
    const sa = JSON.parse(readFileSync(saPath, 'utf8'));
    return initializeApp({ credential: cert(sa), projectId: PROJECT_ID });
  }
  // Fall back to GOOGLE_APPLICATION_CREDENTIALS / default credentials
  return initializeApp({ projectId: PROJECT_ID });
}

const app = initApp();
const db: Firestore = getFirestore(app);

const ALL_PROFILES: UserProfile[] = [...COMMUNITY_USERS, ...MENTOR_USERS];

/** Remove the in-memory uid field (for collections whose doc id is the uid) */
function stripUid<T extends { uid?: string }>(obj: T): Omit<T, 'uid'> {
  const { uid: _uid, ...rest } = obj;
  void _uid;
  return rest;
}

/** Remove the in-memory uid field; the doc id is the uid */
function profileDoc(u: UserProfile): Record<string, unknown> {
  const { uid: _uid, ...rest } = u;
  void _uid;
  return rest;
}

/** Public field subset readable from the plaza/marketplace (matches publicProfiles in firestore.rules) */
function publicProfileDoc(u: UserProfile): Record<string, unknown> {
  return {
    uid: u.uid,
    name: u.name,
    avatarUrl: u.avatarUrl ?? null,
    currentRole: u.currentRole,
    targetRole: u.targetRole,
    skills: u.skills,
    lifeStage: u.lifeStage,
    coffeeAvailability: u.coffeeAvailability,
    communityAgreed: u.communityAgreed,
    backgroundSummary: u.backgroundSummary,
  };
}

/** Delete every document in a collection (idempotent: clear first, then insert) */
async function clearCollection(name: string): Promise<void> {
  const snap = await db.collection(name).get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

/** Clear the subcollections under plazaPosts (comments / willingToHelp / private) */
async function clearPlazaSubcollections(): Promise<void> {
  const posts = await db.collection('plazaPosts').get();
  for (const post of posts.docs) {
    for (const sub of ['comments', 'willingToHelp', 'private']) {
      const snap = await post.ref.collection(sub).get();
      const batch = db.batch();
      snap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
}

async function seed(): Promise<void> {
  console.log(`- Target project: ${PROJECT_ID}`);

  // 0) Clear every collection so no demo/legacy data survives
  const topLevel = [
    'users',
    'publicProfiles',
    'credentials',
    'skillProfiles',
    'opportunityReports',
    'returnPlans',
    'planTasks',
    'labTasks',
    'evidences',
    'peerChats',
    'mentors',
    'mentorSlots',
    'bookings',
    'packageOrders',
    'reviews',
    'endorsements',
    'posts',
    'plazaPosts',
    'reports',
    'conversations',
  ];
  await clearPlazaSubcollections();
  for (const name of topLevel) await clearCollection(name);

  // 1) User profiles + public profiles
  const batch = db.batch();
  for (const u of ALL_PROFILES) {
    batch.set(db.collection('users').doc(u.uid), profileDoc(u));
    batch.set(db.collection('publicProfiles').doc(u.uid), publicProfileDoc(u));
  }
  // 2) Mentors + slots
  for (const m of MENTORS) batch.set(db.collection('mentors').doc(m.id), m);
  for (const s of MENTOR_SLOTS) batch.set(db.collection('mentorSlots').doc(s.id), s);
  // 3) Plaza posts (authorId moved into the private subcollection, not exposed in the main doc)
  for (const p of SEED_PLAZA_POSTS) {
    const { authorId, ...publicPost } = p;
    batch.set(db.collection('plazaPosts').doc(p.id), publicPost);
    batch.set(db.collection('plazaPosts').doc(p.id).collection('private').doc('meta'), { authorId });
  }
  // 4) Circle posts
  for (const c of SEED_CIRCLE_POSTS) batch.set(db.collection('posts').doc(c.id), c);

  await batch.commit();

  // 5) Plaza comments — written one by one
  const subBatch = db.batch();
  for (const c of SEED_PLAZA_COMMENTS) {
    subBatch.set(
      db.collection('plazaPosts').doc(c.postId).collection('comments').doc(c.id),
      stripUid(c)
    );
  }
  await subBatch.commit();

  console.log('Seed complete');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
