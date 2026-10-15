// 把种子数据导入 Firestore。在 Cloud Run 上执行（本地因网络限制可能失败）。
// 用法：node scripts/seed-firestore.js

const admin = require('firebase-admin');
const fs = require('fs');

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '/Users/yujiejiang/gcp-keys/rebloom-backend.json';
const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'buildercup2026-511504';

const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(key),
  projectId: projectId,
});

const db = admin.firestore();

// 种子数据（从 mockData.ts 复制，去掉 TypeScript 类型）
const SEED_DATA = {
  users: [
    {
      uid: 'demo_returner',
      name: '林知夏',
      email: 'demo.returner@rebloom.ai',
      currentRole: '互联网运营',
      targetRole: 'AI 运营',
      skills: ['项目管理', '内容策划', '数据分析'],
      goals: ['回归职场', '掌握 AI 工具'],
      constraints: {
        returnToWork: true,
        newIndustry: true,
        flexibility: true,
        weeklyHours: 6,
      },
      segment: 'setter',
      lifeStage: 'returning_parent',
      confidenceSelf: 5,
      journeyStep: 5,
      coffeeAvailability: [{ dayOfWeek: 2, timeRange: '20:00-21:00' }],
      communityAgreed: true,
      backgroundSummary: '产后回归，之前在互联网公司做运营，想转型 AI 领域',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uid: 'demo_explorer',
      name: '陈思远',
      email: 'demo.explorer@rebloom.ai',
      currentRole: '应届毕业生',
      targetRole: 'AI 产品',
      skills: ['写作', '沟通'],
      goals: ['找到方向', '进入 AI 行业'],
      constraints: {
        returnToWork: false,
        newIndustry: true,
        flexibility: true,
        weeklyHours: 10,
      },
      segment: 'explorer',
      lifeStage: 'student',
      confidenceSelf: 4,
      journeyStep: 2,
      coffeeAvailability: [{ dayOfWeek: 6, timeRange: '14:00-15:00' }],
      communityAgreed: true,
      backgroundSummary: '即将毕业，对 AI 感兴趣但不知道从何开始',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  skillProfiles: [
    {
      uid: 'demo_returner',
      transferableSkills: [
        {
          id: 'ai_sk_1',
          name: '流程结构化与拆解',
          evidence: '你在「互联网运营」的经历中，已经把复杂事务整理成可执行步骤',
          aiRelevance: 90,
          narrative: '你在过往工作中已经做到了「把混乱信息拆成步骤」，这正是 AI 工作流设计需要的核心能力。',
        },
        {
          id: 'ai_sk_2',
          name: '沟通与需求翻译',
          evidence: '你需要长期在不同角色之间对齐信息与预期',
          aiRelevance: 85,
          narrative: '你在协作中已经做到了「把不同人的话翻译成统一语言」，这是 AI 岗位的关键能力。',
        },
      ],
      uniqueValue: '你当前处于「产后回归」阶段。你的独特价值在于把过去的真实经验翻译成 AI 工作流语言——这不是从零开始，而是把能力换个战场。',
      confidenceCalibration: [
        { dimension: '技术自我效能感', selfScore: 5, aiScore: 9, evidenceRef: '你在真实项目中已经做到了系统化拆解与落地' },
        { dimension: 'AI 工具就绪度', selfScore: 6, aiScore: 8, evidenceRef: '你愿意开始了解 AI 工具，这已经是 AI 运营的起点能力' },
      ],
      createdAt: new Date().toISOString(),
    },
  ],
  opportunityReports: [
    {
      uid: 'demo_returner',
      roleMatches: [
        {
          id: 'ai_role_ops',
          title: 'AI 运营（AI Operations）',
          matchScore: 90,
          description: '把 AI 能力落到具体业务流程：设计提示词模板、搭建内容与服务工作流、监控输出质量并迭代。',
          whyFit: '你的结构化与协作能力高度匹配，且不需要编程基础。',
          requiredSkills: ['提示词设计', '工作流搭建', '跨部门协作', '数据复盘', '质量评估'],
          typicalWorkflows: ['梳理场景 → 设计模板 → 小范围试点 → 收集反馈 → 迭代推广'],
          realWorldExamples: ['教育公司用 AI 运营把答疑响应从 2 天缩短到 2 小时'],
          tradeoffs: '优势：门槛低、需求大、可灵活；代价：需持续跟进工具变化。',
          category: 'AI 运营',
        },
      ],
      womenFriendlyTracks: [
        { title: 'AI 运营', reason: '门槛适中、需求大、支持灵活与远程。' },
        { title: 'AI 教育', reason: '看重表达与教学，天然承接教育/内容背景。' },
      ],
      genderRiskHints: [
        { scenario: '担心生育/育儿断档被追问', gentleAdvice: '不必掩饰，把空窗期讲成「另一种场景的能力沉淀」。' },
      ],
      createdAt: new Date().toISOString(),
    },
  ],
  returnPlans: [
    {
      uid: 'demo_returner',
      paceLabel: '产后回归',
      weeklyHours: 6,
      totalWeeks: 4,
      interruptibleStages: [1, 2, 3, 4],
      returnPlaybook: '如需暂停，执行「8 周回归计划」：把 4 周任务按优先级拆成 8 周，每周只保留 1 个核心任务——暂停不等于淘汰。',
      weeks: [
        {
          week: 1,
          theme: '建立 AI 工具基本手感',
          weeklyHours: 6,
          learningResources: ['第 1 周主题资料与案例清单'],
          practiceTasks: [
            { id: 'ai_pt_1_1', week: 1, title: '用 AI 完成一次资料整理', category: 'practice', estimatedHours: 3, completed: false },
          ],
          jobSearchMilestones: ['完成第 1 周复盘'],
          interruptible: true,
        },
      ],
      createdAt: new Date().toISOString(),
    },
  ],
  evidences: [
    {
      id: 'ev_seed_1',
      uid: 'demo_returner',
      type: 'task_outcome',
      title: '完成 AI 任务：竞品分析',
      detail: '用 AI 完成了一次完整的竞品分析，获得 4.8 分反馈',
      source: 'auto',
      tags: ['AI 运营', '竞品分析'],
      isPublic: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ev_seed_2',
      uid: 'demo_returner',
      type: 'mentor_endorsement',
      title: '导师背书：结构化能力',
      detail: '导师评价你具备出色的结构化思维和执行能力',
      source: 'auto',
      tags: ['导师', '结构化'],
      isPublic: true,
      createdAt: new Date().toISOString(),
    },
  ],
  plazaPosts: [
    {
      id: 'post_seed_1',
      authorId: 'demo_returner',
      anonymous: true,
      anonymousHandle: '小花_产后回归',
      title: '产后回归第一天，用 AI 整理了一份行业报告',
      body: '今天第一天回归工作，用 AI 工具花 30 分钟整理了一份行业报告，效率比预期高很多。虽然还有些生疏，但感觉自己在慢慢找回状态。',
      images: [],
      tags: ['产后回归', 'AI 工具'],
      status: 'open',
      kudosCount: 5,
      commentCount: 3,
      willingToHelpCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

async function seed() {
  console.log('开始导入种子数据到 Firestore...');

  for (const [collection, docs] of Object.entries(SEED_DATA)) {
    const batch = db.batch();
    let count = 0;

    for (const doc of docs) {
      const id = doc.id || doc.uid || doc.postId || `seed_${Date.now()}_${count}`;
      const ref = db.collection(collection).doc(id);
      batch.set(ref, doc, { merge: true });
      count++;
    }

    await batch.commit();
    console.log(`✅ ${collection}: ${count} 条记录`);
  }

  console.log('种子数据导入完成');
}

seed().then(() => process.exit(0)).catch((e) => {
  console.error('导入失败:', e.message);
  process.exit(1);
});
