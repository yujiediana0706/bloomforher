// 服务端数据层。优先使用 Firestore（有 GCP 凭据时），否则回退到内存（本地开发）。
// 内存模式下用 globalThis 单例，保证同一 Node 进程中跨请求/热更新保留状态。

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
  DEMO_EXPLORER,
  DEMO_RETURNER,
  MENTORS,
  MENTOR_SLOTS,
  MENTOR_USERS,
  SEED_BOOKINGS,
  SEED_CIRCLE_POSTS,
  SEED_EVIDENCES,
  SEED_LAB_TASKS,
  SEED_OPPORTUNITY_REPORT,
  SEED_PACKAGE_ORDERS,
  SEED_PEER_CHATS,
  SEED_PLAZA_COMMENTS,
  SEED_PLAZA_POSTS,
  SEED_RETURN_PLAN,
  SEED_SKILL_PROFILE,
  SEED_WILLING,
} from './mockData';
import { getFirestoreDb, useFirestore } from './firestore';

export interface DB {
  users: UserProfile[];
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
  var __rebloomDB: DB | undefined;
  // eslint-disable-next-line no-var
  var __rebloomFirestoreLoaded: boolean | undefined;
}

function initDB(): DB {
  return {
    users: [DEMO_RETURNER, DEMO_EXPLORER, ...COMMUNITY_USERS, ...MENTOR_USERS],
    skillProfiles: { demo_returner: SEED_SKILL_PROFILE },
    opportunityReports: { demo_returner: SEED_OPPORTUNITY_REPORT },
    returnPlans: { demo_returner: SEED_RETURN_PLAN },
    labTasks: [...SEED_LAB_TASKS],
    evidences: [...SEED_EVIDENCES],
    plazaPosts: [...SEED_PLAZA_POSTS],
    plazaComments: [...SEED_PLAZA_COMMENTS],
    willing: { ...SEED_WILLING },
    peerChats: [...SEED_PEER_CHATS],
    mentors: [...MENTORS],
    mentorSlots: [...MENTOR_SLOTS],
    bookings: [...SEED_BOOKINGS],
    packageOrders: [...SEED_PACKAGE_ORDERS],
    circlePosts: [...SEED_CIRCLE_POSTS],
    circleComments: [],
    reports: [],
    coachMessages: {},
  };
}

export function getDB(): DB {
  if (!globalThis.__rebloomDB) {
    globalThis.__rebloomDB = initDB();
    // 首次调用时异步从 Firestore 加载（fire-and-forget）
    loadFromFirestore().catch((e) => {
      console.error('[Firestore] 初始化加载失败:', (e as Error).message);
    });
  }
  return globalThis.__rebloomDB;
}

/** 确保 Firestore 数据已加载（API routes 在写操作前调用） */
export async function ensureLoaded(): Promise<DB> {
  const db = getDB();
  if (!globalThis.__rebloomFirestoreLoaded) {
    await loadFromFirestore();
  }
  return db;
}

// —— Firestore 同步层 ——

const COLLECTION_MAP: Record<string, keyof DB> = {
  users: 'users',
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

/** 从 Firestore 加载数据到内存（幂等，只执行一次） */
export async function loadFromFirestore(): Promise<void> {
  if (globalThis.__rebloomFirestoreLoaded) return;
  const fs = getFirestoreDb();
  if (!fs) return;

  const db = getDB();
  console.log('[Firestore] 开始从 Firestore 加载数据...');

  // 网络受限环境下设置超时，避免卡住
  const timeout = <T>(p: Promise<T>, ms = 8000): Promise<T> =>
    Promise.race([
      p,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), ms)),
    ]);

  for (const [collection, dbKey] of Object.entries(COLLECTION_MAP)) {
    try {
      const snapshot = await timeout(fs.collection(collection).get());
      if (snapshot.empty) continue;

      if (dbKey === 'skillProfiles' || dbKey === 'opportunityReports' || dbKey === 'returnPlans') {
        // Record 类型：用 uid 作为 key
        const record: Record<string, unknown> = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data() as Record<string, unknown>;
          if (data.uid) record[data.uid as string] = data;
        });
        (db as unknown as Record<string, unknown>)[dbKey] = record;
      } else {
        // 数组类型
        const items = snapshot.docs.map((doc) => doc.data());
        (db as unknown as Record<string, unknown>)[dbKey] = items;
      }
    } catch (e) {
      console.error(`[Firestore] 加载 ${collection} 失败:`, (e as Error).message);
    }
  }

  globalThis.__rebloomFirestoreLoaded = true;
  console.log('[Firestore] 数据加载完成');
}

/** 同步单个文档到 Firestore（异步，不阻塞） */
export function syncToFirestore(collection: string, docId: string, data: unknown): void {
  const fs = getFirestoreDb();
  if (!fs) return;

  const docRef = fs.collection(collection).doc(docId);
  docRef.set(data as Record<string, unknown>, { merge: true }).catch((e) => {
    console.error(`[Firestore] 同步 ${collection}/${docId} 失败:`, (e as Error).message);
  });
}

/** 同步数组中的一批文档到 Firestore */
export function syncBatchToFirestore<T extends { id: string }>(collection: string, items: T[]): void {
  const fs = getFirestoreDb();
  if (!fs) return;

  const batch = fs.batch();
  items.forEach((item) => {
    const ref = fs.collection(collection).doc(item.id);
    batch.set(ref, item as Record<string, unknown>, { merge: true });
  });
  batch.commit().catch((e) => {
    console.error(`[Firestore] 批量同步 ${collection} 失败:`, (e as Error).message);
  });
}

/** 删除 Firestore 中的文档 */
export function deleteFromFirestore(collection: string, docId: string): void {
  const fs = getFirestoreDb();
  if (!fs) return;

  fs.collection(collection).doc(docId).delete().catch((e) => {
    console.error(`[Firestore] 删除 ${collection}/${docId} 失败:`, (e as Error).message);
  });
}

/** 判断当前是否使用 Firestore */
export function isFirestoreMode(): boolean {
  return useFirestore();
}

// —— 便于路由使用的查询助手 ——

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

export function addEvidence(
  db: DB,
  ev: Omit<EvidenceItem, 'id' | 'createdAt'>
): EvidenceItem {
  const item: EvidenceItem = { ...ev, id: newId('ev'), createdAt: nowIso() };
  db.evidences.unshift(item);
  syncToFirestore('evidences', item.id, item);
  return item;
}

/** 任务/成果里程碑：完成数达到 1/5/10 时生成里程碑证据（同类型里程碑只生成一次） */
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
          e.tags.includes(`里程碑${threshold}`)
      );
      if (!exists) {
        return addEvidence(db, {
          uid,
          type: 'milestone',
          title: `里程碑：完成 ${threshold} 个实操任务`,
          detail: `你已经完成 ${threshold} 个真实 AI 任务，继续保持。`,
          source: 'auto',
          tags: ['里程碑', `里程碑${threshold}`],
          isPublic: true,
        });
      }
    }
  }
  return null;
}
