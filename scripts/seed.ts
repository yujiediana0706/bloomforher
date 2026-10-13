/**
 * scripts/seed.ts — 「ReBloom AI · 她径」幂等种子脚本（先清后插）
 *
 * 用法：npx tsx scripts/seed.ts
 * 依赖：firebase-admin（服务端 SDK，走 admin 权限，绕过安全规则）
 * 认证：优先读取 SERVICE_ACCOUNT_PATH；否则使用 GOOGLE_APPLICATION_CREDENTIALS。
 *
 * 说明：本脚本与 src/lib/mockData.ts 共享同一份演示数据（单一事实来源），
 *      将内存数据映射为规范 §6 的 Firestore 集合结构（uid → docId / userId）。
 */
import { readFileSync } from 'node:fs';
import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
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
} from '../src/lib/mockData';
import type { UserProfile } from '../src/lib/types';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? 'rebloom-cup';
const DEMO_PASSWORD = 'ReBloom123!';

function initApp(): App {
  if (getApps().length) return getApps()[0];
  const saPath = process.env.SERVICE_ACCOUNT_PATH;
  if (saPath) {
    const sa = JSON.parse(readFileSync(saPath, 'utf8'));
    return initializeApp({ credential: cert(sa), projectId: PROJECT_ID });
  }
  // 回退到 GOOGLE_APPLICATION_CREDENTIALS / 默认凭据
  return initializeApp({ projectId: PROJECT_ID });
}

const app = initApp();
const db: Firestore = getFirestore(app);
const auth = getAuth(app);

const ALL_USERS: UserProfile[] = [DEMO_RETURNER, DEMO_EXPLORER, ...COMMUNITY_USERS];

const ALL_PROFILES: UserProfile[] = [...ALL_USERS, ...MENTOR_USERS];

/** 通用：去掉内存 uid 字段（用于以 uid 为文档 id 的集合） */
function stripUid<T extends { uid?: string }>(obj: T): Omit<T, 'uid'> {
  const { uid: _uid, ...rest } = obj;
  void _uid;
  return rest;
}

/** 去掉内存字段 uid，文档 id 即 uid */
function profileDoc(u: UserProfile): Record<string, unknown> {
  const { uid: _uid, ...rest } = u;
  void _uid;
  return rest;
}

/** 广场/预约可读的公开字段子集（配合 firestore.rules 的 publicProfiles） */
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

/** 清空一个集合的所有文档（幂等：先清后插） */
async function clearCollection(name: string): Promise<void> {
  const snap = await db.collection(name).get();
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

/** 清空 plazaPosts 下的子集合（comments / willingToHelp / private） */
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

/** 创建/更新 Firebase Auth 演示账号（幂等） */
async function upsertAuthUser(email: string, displayName: string): Promise<string> {
  try {
    const user = await auth.getUserByEmail(email);
    await auth.updateUser(user.uid, { displayName, password: DEMO_PASSWORD });
    return user.uid;
  } catch {
    const user = await auth.createUser({ email, password: DEMO_PASSWORD, displayName });
    return user.uid;
  }
}

async function seed(): Promise<void> {
  console.log(`▸ 目标项目：${PROJECT_ID}`);

  // 0) 清空所有集合
  const topLevel = [
    'users',
    'publicProfiles',
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
    'reports',
    'conversations',
  ];
  await clearPlazaSubcollections();
  for (const name of topLevel) await clearCollection(name);

  // 1) 认证账号 + 用户档案 + 公开档案
  const authUids: Record<string, string> = {};
  for (const u of ALL_PROFILES) {
    authUids[u.email] = await upsertAuthUser(u.email, u.name);
  }
  const batch = db.batch();
  for (const u of ALL_PROFILES) {
    batch.set(db.collection('users').doc(u.uid), profileDoc(u));
    batch.set(db.collection('publicProfiles').doc(u.uid), publicProfileDoc(u));
  }
  // 2) 旅程产物（demo.returner 完整）
  batch.set(db.collection('skillProfiles').doc(SEED_SKILL_PROFILE.uid), stripUid(SEED_SKILL_PROFILE));
  batch.set(
    db.collection('opportunityReports').doc(SEED_OPPORTUNITY_REPORT.uid),
    stripUid(SEED_OPPORTUNITY_REPORT)
  );
  batch.set(db.collection('returnPlans').doc(SEED_RETURN_PLAN.uid), stripUid(SEED_RETURN_PLAN));
  // 3) 30 天计划任务展开为 planTasks（§6：planTasks/{id}）
  for (const week of SEED_RETURN_PLAN.weeks) {
    for (const task of week.practiceTasks) {
      batch.set(db.collection('planTasks').doc(task.id), {
        ...task,
        userId: SEED_RETURN_PLAN.uid,
      });
    }
  }
  // 4) 实操任务
  for (const task of SEED_LAB_TASKS) {
    batch.set(db.collection('labTasks').doc(task.id), { ...stripUid(task), userId: task.uid });
  }
  // 5) 证据库
  for (const ev of SEED_EVIDENCES) {
    batch.set(db.collection('evidences').doc(ev.id), { ...stripUid(ev), userId: ev.uid });
  }
  // 6) 导师 + 档期
  for (const m of MENTORS) batch.set(db.collection('mentors').doc(m.id), m);
  for (const s of MENTOR_SLOTS) batch.set(db.collection('mentorSlots').doc(s.id), s);
  // 7) 预约与订单
  const mentorUserIdOf = (mentorId: string) => MENTORS.find((m) => m.id === mentorId)?.userId ?? mentorId;
  for (const b of SEED_BOOKINGS) {
    batch.set(db.collection('bookings').doc(b.id), { ...b, mentorUserId: mentorUserIdOf(b.mentorId) });
  }
  for (const o of SEED_PACKAGE_ORDERS) batch.set(db.collection('packageOrders').doc(o.id), o);
  for (const p of SEED_PEER_CHATS) batch.set(db.collection('peerChats').doc(p.id), p);
  // 8) 广场主帖（authorId 移入私有子集合，主文档不暴露）
  for (const p of SEED_PLAZA_POSTS) {
    const { authorId, ...publicPost } = p;
    batch.set(db.collection('plazaPosts').doc(p.id), publicPost);
    batch.set(db.collection('plazaPosts').doc(p.id).collection('private').doc('meta'), { authorId });
  }
  // 9) 圈子帖
  for (const c of SEED_CIRCLE_POSTS) batch.set(db.collection('posts').doc(c.id), c);

  await batch.commit();

  // 10) 广场子集合（评论 / willingToHelp）— 需逐条写
  const subBatch = db.batch();
  for (const c of SEED_PLAZA_COMMENTS) {
    subBatch.set(
      db.collection('plazaPosts').doc(c.postId).collection('comments').doc(c.id),
      stripUid(c)
    );
  }
  for (const [postId, helpers] of Object.entries(SEED_WILLING)) {
    for (const h of helpers) {
      subBatch.set(
        db.collection('plazaPosts').doc(postId).collection('willingToHelp').doc(h.helperUid),
        h
      );
    }
  }
  await subBatch.commit();

  console.log('✓ 播种完成');
  console.log(`  演示账号密码统一为：${DEMO_PASSWORD}`);
  console.log('  - demo.returner@rebloom.test（Setter · 产后回归，数据完整）');
  console.log('  - demo.explorer@rebloom.test（Explorer · 全新账号）');
  console.log('  - demo.mentor1..3@rebloom.test（导师）');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('✗ 播种失败：', err);
    process.exit(1);
  });
