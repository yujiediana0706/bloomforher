// Server-side data layer. Prefers Firestore when a GCP project is configured,
// and falls back to an in-memory store for local development.
// In memory mode a globalThis singleton keeps state across requests and hot
// reloads within the same Node process.

import type {
  Booking,
  CircleComment,
  CirclePost,
  CoachMessage,
  EvidenceItem,
  LabTask,
  Mentor,
  MentorSlot,
  OpportunityReport,
  PackageOrder,
  PeerChat,
  PlazaComment,
  PlazaPost,
  ReportItem,
  ReturnPlan,
  SkillProfile,
  UserProfile,
  WillingToHelp,
} from './types';
import {
  COMMUNITY_USERS,
  MENTORS,
  MENTOR_SLOTS,
  MENTOR_USERS,
  SEED_CIRCLE_POSTS,
  SEED_PLAZA_COMMENTS,
  SEED_PLAZA_POSTS,
} from './mockData';
import { getFirestoreDb, useFirestore } from './firestore';

export interface Credential {
  salt: string;
  hash: string;
}

export interface DB {
  users: UserProfile[];
  credentials: Record<string, Credential>;
  skillProfiles: Record<string, SkillProfile>;
  opportunityReports: Record<string, OpportunityReport>;
  returnPlans: Record<string, ReturnPlan>;
  labTasks: LabTask[];
  evidences: EvidenceItem[];
  plazaPosts: PlazaPost[];
  plazaComments: PlazaComment[];
  willing: Record<string, WillingToHelp[]>;
  peerChats: PeerChat[];
  mentors: Mentor[];
  mentorSlots: MentorSlot[];
  bookings: Booking[];
  packageOrders: PackageOrder[];
  circlePosts: CirclePost[];
  circleComments: CircleComment[];
  reports: ReportItem[];
  coachMessages: Record<string, CoachMessage[]>;
}

declare global {
  // eslint-disable-next-line no-var
  var __herriseDB: DB | undefined;
  // eslint-disable-next-line no-var
  var __herriseFirestoreLoaded: boolean | undefined;
  // In-flight Firestore load, shared so concurrent callers await one pass.
  // eslint-disable-next-line no-var
  var __herriseLoadPromise: Promise<void> | undefined;
}

function initDB(): DB {
  return {
    // Only platform content is seeded. Real end users start from an empty
    // account and build their journey from scratch.
    users: [...COMMUNITY_USERS, ...MENTOR_USERS],
    credentials: {},
    skillProfiles: {},
    opportunityReports: {},
    returnPlans: {},
    labTasks: [],
    evidences: [],
    plazaPosts: [...SEED_PLAZA_POSTS],
    plazaComments: [...SEED_PLAZA_COMMENTS],
    willing: {},
    peerChats: [],
    mentors: [...MENTORS],
    mentorSlots: [...MENTOR_SLOTS],
    bookings: [],
    packageOrders: [],
    circlePosts: [...SEED_CIRCLE_POSTS],
    circleComments: [],
    reports: [],
    coachMessages: {},
  };
}

export function getDB(): DB {
  if (!globalThis.__herriseDB) {
    globalThis.__herriseDB = initDB();
    // Load from Firestore asynchronously on first call (fire-and-forget).
    loadFromFirestore().catch((e) => {
      console.error('[Firestore] initial load failed:', (e as Error).message);
    });
  }
  return globalThis.__herriseDB;
}

/** Ensure Firestore data is loaded (called by API routes before writes). */
export async function ensureLoaded(): Promise<DB> {
  const db = getDB();
  if (!globalThis.__herriseFirestoreLoaded) {
    await loadFromFirestore();
  }
  return db;
}

// —— Firestore sync layer ——

const COLLECTION_MAP: Record<string, keyof DB> = {
  users: 'users',
  credentials: 'credentials',
  skillProfiles: 'skillProfiles',
  opportunityReports: 'opportunityReports',
  returnPlans: 'returnPlans',
  labTasks: 'labTasks',
  evidences: 'evidences',
  plazaPosts: 'plazaPosts',
  plazaComments: 'plazaComments',
  peerChats: 'peerChats',
  mentors: 'mentors',
  mentorSlots: 'mentorSlots',
  bookings: 'bookings',
  packageOrders: 'packageOrders',
  circlePosts: 'circlePosts',
  circleComments: 'circleComments',
};

/**
 * Load Firestore data into memory. Single-flight: concurrent callers await the
 * same load, and the load only ever runs once, so a second concurrent pass can
 * never overwrite the in-memory DB after new writes have already happened.
 */
export async function loadFromFirestore(): Promise<void> {
  if (globalThis.__herriseFirestoreLoaded) return;
  if (!globalThis.__herriseLoadPromise) {
    globalThis.__herriseLoadPromise = doLoadFromFirestore()
      .then((loaded) => {
        if (loaded) globalThis.__herriseFirestoreLoaded = true;
      })
      .finally(() => {
        globalThis.__herriseLoadPromise = undefined;
      });
  }
  await globalThis.__herriseLoadPromise;
}

async function doLoadFromFirestore(): Promise<boolean> {
  const fs = getFirestoreDb();
  if (!fs) return false;

  const db = getDB();
  console.log('[Firestore] loading data from Firestore...');

  // Timeout for restricted-network environments to avoid hanging.
  const timeout = <T>(p: Promise<T>, ms = 5000): Promise<T> =>
    Promise.race([
      p,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), ms)),
    ]);

  const isRecordCollection = (dbKey: keyof DB) =>
    dbKey === 'skillProfiles' ||
    dbKey === 'opportunityReports' ||
    dbKey === 'returnPlans' ||
    dbKey === 'credentials';

  // Load every collection in parallel so the first request is not serialized
  // across ~17 round-trips.
  await Promise.all(
    Object.entries(COLLECTION_MAP).map(async ([collection, dbKey]) => {
      try {
        const snapshot = await timeout(fs.collection(collection).get());
        if (snapshot.empty) return;

        if (isRecordCollection(dbKey)) {
          // Record type: keyed by uid.
          const record: Record<string, unknown> = {};
          snapshot.docs.forEach((doc) => {
            const data = doc.data() as Record<string, unknown>;
            const key = (data.uid as string) || doc.id;
            if (key) record[key] = data;
          });
          (db as unknown as Record<string, unknown>)[dbKey] = record;
        } else {
          // Array type.
          const items = snapshot.docs.map((doc) => doc.data());
          (db as unknown as Record<string, unknown>)[dbKey] = items;
        }
      } catch (e) {
        console.error(`[Firestore] failed to load ${collection}:`, (e as Error).message);
      }
    })
  );

  console.log('[Firestore] data loaded');
  return true;
}

/** Sync a single document to Firestore (async, non-blocking). */
export function syncToFirestore(collection: string, docId: string, data: unknown): void {
  const fs = getFirestoreDb();
  if (!fs) return;

  const docRef = fs.collection(collection).doc(docId);
  docRef.set(data as Record<string, unknown>, { merge: true }).catch((e) => {
    console.error(`[Firestore] failed to sync ${collection}/${docId}:`, (e as Error).message);
  });
}

/** Sync a batch of array documents to Firestore. */
export function syncBatchToFirestore<T extends { id: string }>(collection: string, items: T[]): void {
  const fs = getFirestoreDb();
  if (!fs) return;

  const batch = fs.batch();
  items.forEach((item) => {
    const ref = fs.collection(collection).doc(item.id);
    batch.set(ref, item as Record<string, unknown>, { merge: true });
  });
  batch.commit().catch((e) => {
    console.error(`[Firestore] failed to batch sync ${collection}:`, (e as Error).message);
  });
}

/** Delete a document from Firestore. */
export function deleteFromFirestore(collection: string, docId: string): void {
  const fs = getFirestoreDb();
  if (!fs) return;

  fs.collection(collection).doc(docId).delete().catch((e) => {
    console.error(`[Firestore] failed to delete ${collection}/${docId}:`, (e as Error).message);
  });
}

/** Whether Firestore is currently in use. */
export function isFirestoreMode(): boolean {
  return useFirestore();
}

// —— Query helpers used by routes ——

let counter = 0;
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function findUser(db: DB, uid: string): UserProfile | undefined {
  return db.users.find((u) => u.uid === uid);
}

export function findUserByEmail(db: DB, email: string): UserProfile | undefined {
  const target = email.trim().toLowerCase();
  return db.users.find((u) => u.email.toLowerCase() === target);
}

/**
 * For deferred registration: an anonymous visitor (uid starts with "anon_")
 * may not have a UserProfile yet. Create a minimal one so the diagnosis
 * flow can store data under that uid before the user registers.
 */
export function ensureUser(db: DB, uid: string): UserProfile {
  const existing = findUser(db, uid);
  if (existing) return existing;

  const now = nowIso();
  const user: UserProfile = {
    uid,
    name: 'Explorer',
    email: '',
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
    segment: 'setter',
    lifeStage: 'growth',
    confidenceSelf: 5,
    journeyStep: 1,
    coffeeAvailability: [],
    communityAgreed: false,
    backgroundSummary: '',
    createdAt: now,
    updatedAt: now,
  };
  db.users.push(user);
  syncToFirestore('users', uid, user);
  return user;
}

/**
 * Migrate all anonymous data to a newly registered user. Called from the
 * registration route when an anonymous visitor signs up: every collection
 * keyed by the old anon uid is re-keyed to the new real uid, then the anon
 * user row is removed.
 */
export function migrateAnonymousData(db: DB, anonUid: string, realUid: string): void {
  for (const collection of [
    'skillProfiles',
    'opportunityReports',
    'returnPlans',
  ] as const) {
    if (db[collection][anonUid]) {
      db[collection][realUid] = db[collection][anonUid];
      delete db[collection][anonUid];
      syncToFirestore(collection, realUid, db[collection][realUid]);
    }
  }
  for (const task of db.labTasks) {
    if (task.uid === anonUid) {
      task.uid = realUid;
      syncToFirestore('labTasks', task.id, task);
    }
  }
  for (const ev of db.evidences) {
    if (ev.uid === anonUid) {
      ev.uid = realUid;
      syncToFirestore('evidences', ev.id, ev);
    }
  }
  if (db.coachMessages[anonUid]) {
    db.coachMessages[realUid] = db.coachMessages[anonUid];
    delete db.coachMessages[anonUid];
  }
  const idx = db.users.findIndex((u) => u.uid === anonUid);
  if (idx >= 0) db.users.splice(idx, 1);
}

export function addEvidence(
  db: DB,
  ev: Omit<EvidenceItem, 'id' | 'createdAt'>
): EvidenceItem {
  const item: EvidenceItem = { ...ev, id: newId('ev'), createdAt: nowIso() };
  db.evidences.unshift(item);
  syncToFirestore('evidences', item.id, item);
  return item;
}

/** Task/outcome milestone: generates milestone evidence at 1/5/10 completed
 *  tasks (each milestone type is generated only once). */
export function checkTaskMilestones(db: DB, uid: string): EvidenceItem | null {
  const doneCount = db.labTasks.filter(
    (t) => t.uid === uid && t.status === 'done'
  ).length;
  for (const threshold of [1, 5, 10]) {
    if (doneCount >= threshold) {
      const exists = db.evidences.some(
        (e) =>
          e.uid === uid &&
          e.type === 'milestone' &&
          e.tags.includes(`Milestone ${threshold}`)
      );
      if (!exists) {
        return addEvidence(db, {
          uid,
          type: 'milestone',
          title: `Milestone: ${threshold} hands-on tasks completed`,
          detail: `You have completed ${threshold} real AI task(s). Keep going.`,
          source: 'auto',
          tags: ['Milestone', `Milestone ${threshold}`],
          isPublic: true,
        });
      }
    }
  }
  return null;
}
