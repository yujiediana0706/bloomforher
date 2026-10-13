// 服务端内存数据层（原型）。所有写入统一经过 API routes，无需 Firebase 凭据即可运行。
// 使用 globalThis 单例，保证在同一 Node 进程中跨请求/热更新保留状态。

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
  }
  return globalThis.__rebloomDB;
}

let counter = 0;
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

// —— 便于路由使用的查询助手 ——
export function findUser(db: DB, uid: string): UserProfile | undefined {
  return db.users.find((u) => u.uid === uid);
}

export function addEvidence(
  db: DB,
  ev: Omit<EvidenceItem, 'id' | 'createdAt'>
): EvidenceItem {
  const item: EvidenceItem = { ...ev, id: newId('ev'), createdAt: nowIso() };
  db.evidences.unshift(item);
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
