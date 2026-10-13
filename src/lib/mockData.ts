// 「ReBloom AI · 她径」原型种子数据（对齐规范 §9）
// 注：本文件仅用于前端原型演示；将来接 Firestore 时由 scripts/seed.ts 承担同等职责。

import type {
  Booking,
  CirclePost,
  EvidenceItem,
  LabTask,
  Mentor,
  MentorSlot,
  OpportunityReport,
  PackageOrder,
  PeerChat,
  PlazaComment,
  PlazaPost,
  ReturnPlan,
  SkillProfile,
  UserProfile,
  WillingToHelp,
} from './types';

const NOW = new Date();

function iso(daysOffset: number, hour = 20, minute = 0): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function isoPast(daysAgo: number, hour = 10): string {
  return iso(-daysAgo, hour);
}

// —— 演示用户 ——
export const DEMO_RETURNER: UserProfile = {
  uid: 'demo_returner',
  name: '林知夏',
  email: 'demo.returner@rebloom.test',
  avatarUrl:
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  currentRole: '教育机构 运营主管',
  targetRole: 'AI 运营 / AI 产品',
  skills: ['项目统筹', '课程设计', '跨部门协作', '流程优化', '用户研究'],
  goals: ['重返职场', '切入 AI 行业', '兼顾育儿'],
  constraints: {
    returnToWork: true,
    newIndustry: true,
    flexibility: true,
    weeklyHours: 6,
  },
  segment: 'setter',
  lifeStage: 'returning_parent',
  confidenceSelf: 3,
  journeyStep: 5,
  coffeeAvailability: [
    { dayOfWeek: 3, timeRange: '20:00-21:00' },
    { dayOfWeek: 6, timeRange: '10:00-11:00' },
  ],
  communityAgreed: true,
  backgroundSummary:
    '8 年教育与媒体行业运营经验，曾任运营主管与项目统筹，主导课程体系搭建、跨部门协作与流程优化；因生育与育儿暂停工作约 18 个月，现希望重返职场并切入 AI 相关岗位。',
  createdAt: isoPast(20),
  updatedAt: isoPast(2),
};

export const DEMO_EXPLORER: UserProfile = {
  uid: 'demo_explorer',
  name: '陈思远',
  email: 'demo.explorer@rebloom.test',
  avatarUrl:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  currentRole: '应届生 / 大四在读',
  targetRole: 'AI 产品（待探索）',
  skills: ['沟通表达', '心理学基础', '内容写作'],
  goals: ['探索 AI 职业方向', '积累作品'],
  constraints: {
    returnToWork: false,
    newIndustry: true,
    flexibility: false,
    weeklyHours: 12,
  },
  segment: 'explorer',
  lifeStage: 'student',
  confidenceSelf: 2,
  journeyStep: 1,
  coffeeAvailability: [{ dayOfWeek: 2, timeRange: '19:30-20:30' }],
  communityAgreed: false,
  backgroundSummary:
    '传播学与心理学双学位在读，关注科技伦理与人机交互，希望尽早进入 AI 产品相关工作流。',
  createdAt: isoPast(1),
  updatedAt: isoPast(1),
};

// —— 普通社区女性用户（广场帮助者/评论者）——
export const COMMUNITY_USERS: UserProfile[] = [
  {
    uid: 'user_zhou',
    name: '周敏',
    email: 'zhou.min@rebloom.test',
    currentRole: '自由职业 内容编辑',
    targetRole: 'AI 运营',
    skills: ['内容策划', '数据整理', '社群运营'],
    goals: ['灵活办公', '积累 AI 作品'],
    constraints: {
      returnToWork: true,
      newIndustry: true,
      flexibility: true,
      weeklyHours: 8,
    },
    segment: 'setter',
    lifeStage: 'parttime_transition',
    confidenceSelf: 5,
    journeyStep: 4,
    coffeeAvailability: [
      { dayOfWeek: 1, timeRange: '21:00-22:00' },
      { dayOfWeek: 5, timeRange: '20:00-21:00' },
    ],
    communityAgreed: true,
    backgroundSummary: '二胎妈妈，兼职内容编辑，正在自学 AI 提示词与内容工作流。',
    createdAt: isoPast(30),
    updatedAt: isoPast(5),
  },
  {
    uid: 'user_li',
    name: '李楠',
    email: 'li.nan@rebloom.test',
    currentRole: '跨境电商 运营',
    targetRole: 'AI 教育',
    skills: ['跨境运营', '文案', '用户增长'],
    goals: ['转型 AI 教育', '找同行伙伴'],
    constraints: {
      returnToWork: false,
      newIndustry: true,
      flexibility: true,
      weeklyHours: 10,
    },
    segment: 'setter',
    lifeStage: 'early_career',
    confidenceSelf: 6,
    journeyStep: 3,
    coffeeAvailability: [{ dayOfWeek: 4, timeRange: '19:00-20:00' }],
    communityAgreed: true,
    backgroundSummary: '跨境电商运营 3 年，希望把运营经验迁移到 AI 教育产品。',
    createdAt: isoPast(45),
    updatedAt: isoPast(8),
  },
  {
    uid: 'user_su',
    name: '苏晓',
    email: 'su.xiao@rebloom.test',
    currentRole: 'HR 专员',
    targetRole: 'AI 伦理',
    skills: ['招聘', '组织沟通', '合规意识'],
    goals: ['切入 AI 伦理与治理'],
    constraints: {
      returnToWork: false,
      newIndustry: true,
      flexibility: false,
      weeklyHours: 6,
    },
    segment: 'setter',
    lifeStage: 'growth',
    confidenceSelf: 4,
    journeyStep: 2,
    coffeeAvailability: [{ dayOfWeek: 0, timeRange: '15:00-16:00' }],
    communityAgreed: true,
    backgroundSummary: 'HR 背景，关注 AI 招聘公平与数据合规，希望转向 AI 伦理方向。',
    createdAt: isoPast(12),
    updatedAt: isoPast(1),
  },
];

// —— 3 位差异化女性导师（全部 seed_approved）——
export const MENTORS: Mentor[] = [
  {
    id: 'mentor_1',
    userId: 'demo_mentor1',
    displayName: '林知夏',
    avatarUrl:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    headline: '前大厂 AI 产品经理 · 二胎妈妈回归',
    bio: '曾在大厂负责 AI 助手产品线，经历二胎回归后重新规划职业路径，擅长帮助产后女性把运营经验翻译成 AI 产品语言。',
    companies: ['ByteDance', '快手'],
    schools: ['浙江大学'],
    topicTags: ['AI 产品', '产后回归', '简历重构', '面试辅导'],
    priceSingle: 299,
    pricePackage5: 1299,
    verified: true,
    verificationStatus: 'seed_approved',
    rating: 4.9,
    sessionsCount: 128,
    impactWomenCount: 96,
    reviews: [
      {
        id: 'r_1_1',
        authorName: '匿名·山茶花',
        rating: 5,
        comment: '知夏帮我把 8 年运营经验重写成 AI 产品的语言，两周后我拿到了面试。',
        date: isoPast(14),
      },
      {
        id: 'r_1_2',
        authorName: '周敏',
        rating: 5,
        comment: '她很懂产后回归的顾虑，节奏安排得很温和，不会给压力。',
        date: isoPast(6),
      },
    ],
    createdAt: isoPast(90),
  },
  {
    id: 'mentor_2',
    userId: 'demo_mentor2',
    displayName: '周明远',
    avatarUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    headline: '女性科技创业者 · AI 教育方向',
    bio: '连续创业者，专注 AI 教育产品落地，擅长从 0 到 1 的产品验证与商业模式梳理。',
    companies: ['明远科技（创始人）'],
    schools: ['清华大学'],
    topicTags: ['女性创业', 'AI 教育', '商业模式', '融资'],
    priceSingle: 399,
    pricePackage5: 1799,
    verified: true,
    verificationStatus: 'seed_approved',
    rating: 4.8,
    sessionsCount: 76,
    impactWomenCount: 58,
    reviews: [
      {
        id: 'r_2_1',
        authorName: '李楠',
        rating: 5,
        comment: '明远帮我理清了 AI 教育产品的切入点，非常实战。',
        date: isoPast(20),
      },
      {
        id: 'r_2_2',
        authorName: '匿名·银杏叶',
        rating: 4,
        comment: '信息量大，需要提前准备好问题清单效果更好。',
        date: isoPast(9),
      },
    ],
    createdAt: isoPast(120),
  },
  {
    id: 'mentor_3',
    userId: 'demo_mentor3',
    displayName: '苏叶',
    avatarUrl:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&auto=format&fit=crop&q=80',
    headline: 'AI 运营专家 · 职场新人导师',
    bio: 'AI 内容与运营方向专家，擅长带零基础姐妹做第一个 AI 作品集，耐心且方法论清晰。',
    companies: ['某 AI SaaS 公司'],
    schools: ['复旦大学'],
    topicTags: ['AI 运营', '作品集', '新人入门', '提示词'],
    priceSingle: 199,
    pricePackage5: 899,
    verified: true,
    verificationStatus: 'seed_approved',
    rating: 4.9,
    sessionsCount: 203,
    impactWomenCount: 151,
    reviews: [
      {
        id: 'r_3_1',
        authorName: '苏晓',
        rating: 5,
        comment: '苏叶带我做了第一个 AI 运营作品，手把手很安心。',
        date: isoPast(3),
      },
      {
        id: 'r_3_2',
        authorName: '匿名·蒲公英',
        rating: 5,
        comment: '性价比很高，适合刚起步的姐妹。',
        date: isoPast(11),
      },
    ],
    createdAt: isoPast(60),
  },
];

// —— 导师账号对应的用户档案（§9：demo.mentor1..3@rebloom.test）——
export const MENTOR_USERS: UserProfile[] = MENTORS.map((m, i) => ({
  uid: m.userId,
  name: m.displayName,
  email: `demo.mentor${i + 1}@rebloom.test`,
  avatarUrl: m.avatarUrl,
  currentRole: m.headline,
  targetRole: 'AI 导师',
  skills: m.topicTags,
  goals: ['陪伴女性转型'],
  constraints: {
    returnToWork: false,
    newIndustry: false,
    flexibility: true,
    weeklyHours: 4,
  },
  segment: 'setter',
  lifeStage: 'growth',
  confidenceSelf: 9,
  journeyStep: 6,
  coffeeAvailability: [],
  communityAgreed: true,
  backgroundSummary: m.bio,
  createdAt: m.createdAt,
  updatedAt: m.createdAt,
}));

export const MENTOR_SLOTS: MentorSlot[] = MENTORS.flatMap((m) =>
  Array.from({ length: 5 }).map((_, i) => ({
    id: `${m.id}_slot_${i + 1}`,
    mentorId: m.id,
    startAt: iso(2 + i * 2, 19 + (i % 2), 0),
    endAt: iso(2 + i * 2, 20 + (i % 2), 0),
    status: 'available' as const,
  }))
);

// —— 旅程 ② 技能发现（demo.returner 完整）——
export const SEED_SKILL_PROFILE: SkillProfile = {
  uid: 'demo_returner',
  uniqueValue:
    '你的独特价值在于「把复杂流程翻译成清晰规则」的能力——这正是 AI 运营与 AI 产品最稀缺的桥梁型能力。你带过跨部门项目、设计过课程体系，本质上一直在做「结构化拆解 + 面向人的沟通」，而这正是训练与评估 AI 工作流的核心。',
  transferableSkills: [
    {
      id: 'sk_1',
      name: '流程结构化与拆解',
      evidence: '主导过课程体系搭建，把碎片化内容整合成可复用的课程标准流程',
      aiRelevance: 92,
      narrative:
        '你在课程体系项目中已经做到了「把混乱信息拆成可执行步骤」，这正是 AI 工作流设计（Workflow Design）需要的核心能力。',
    },
    {
      id: 'sk_2',
      name: '跨部门协作与需求翻译',
      evidence: '长期作为运营与教研、市场之间的沟通枢纽，把业务需求翻译为可执行方案',
      aiRelevance: 88,
      narrative:
        '你在跨部门协作中已经做到了「把不同角色的话翻译成统一语言」，这正是 AI 产品经理做需求对齐时的关键能力。',
    },
    {
      id: 'sk_3',
      name: '用户研究与场景判断',
      evidence: '通过学员访谈与数据复盘，判断课程体验问题并迭代',
      aiRelevance: 84,
      narrative:
        '你在学员访谈中已经做到了「从真实反馈里提炼问题」，这正是 AI 产品做场景验证需要的能力。',
    },
    {
      id: 'sk_4',
      name: '内容策划与表达',
      evidence: '独立策划并落地多期教育内容专题',
      aiRelevance: 78,
      narrative:
        '你的内容策划经验，可直接迁移为 AI 提示词设计与输出评估能力。',
    },
    {
      id: 'sk_5',
      name: '项目统筹与节奏管理',
      evidence: '同时推进多条业务线，负责排期、资源与交付',
      aiRelevance: 80,
      narrative:
        '你已经在真实项目中做到了「在有限资源下保证交付」，这正是 AI 运营落地时的项目能力。',
    },
  ],
  confidenceCalibration: [
    {
      dimension: '技术自我效能感',
      selfScore: 3,
      aiScore: 7,
      evidenceRef:
        '你在课程体系项目中已经做到了系统化拆解与落地，这正是 AI 岗位需要的结构化能力——你把它低估成了「只是行政工作」。',
    },
    {
      dimension: 'AI 工具就绪度',
      selfScore: 4,
      aiScore: 7,
      evidenceRef:
        '你已主动尝试用 AI 工具整理资料，这已经是 AI 运营的起点能力。',
    },
    {
      dimension: '职业空窗价值感',
      selfScore: 2,
      aiScore: 7,
      evidenceRef:
        '育儿期的高强度多任务协调，本身就是极强的项目并行管理训练——空窗期不是空白，是另一种场景的能力沉淀。',
    },
    {
      dimension: '领域迁移能力',
      selfScore: 4,
      aiScore: 8,
      evidenceRef:
        '你能把教育行业的用户研究迁移到 AI 产品场景，这是跨领域迁移能力的有力证据。',
    },
    {
      dimension: '问题拆解能力',
      selfScore: 5,
      aiScore: 8,
      evidenceRef:
        '你处理跨部门冲突与流程卡点的经验，正是 AI 工作流中问题定位与拆解的能力。',
    },
    {
      dimension: '伦理与质量判断',
      selfScore: 4,
      aiScore: 7,
      evidenceRef:
        '你在内容与课程把关中的严谨性，可直接迁移为 AI 输出质量的评估与核查能力。',
    },
  ],
  createdAt: isoPast(18),
};

// —— 旅程 ③ AI 机会（demo.returner）——
export const SEED_OPPORTUNITY_REPORT: OpportunityReport = {
  uid: 'demo_returner',
  roleMatches: [
    {
      id: 'role_ops',
      title: 'AI 运营（AI Operations）',
      matchScore: 92,
      description:
        '负责把 AI 能力落到具体业务流程：设计提示词模板、搭建内容与客服工作流、监控输出质量并迭代。',
      whyFit:
        '你的流程结构化、跨部门协作与项目统筹能力高度匹配，且不需要编程基础。',
      requiredSkills: ['提示词设计', '工作流搭建', '跨部门协作', '数据复盘', '质量评估'],
      typicalWorkflows: [
        '梳理业务场景 → 设计提示词模板 → 小范围试点 → 收集反馈 → 迭代推广',
        '搭建 AI 内容生产线 → 制定质量标准 → 抽检输出 → 优化提示词',
      ],
      realWorldExamples: [
        '某教育公司用 AI 运营把课程答疑响应时间从 2 天缩短到 2 小时',
        '某电商团队由运营同学搭建 AI 文案工作流，内容产出效率提升 3 倍',
      ],
      tradeoffs:
        '优势：入门门槛低、需求量大、可远程/灵活；代价：需要持续跟进工具变化，初期成就感来自流程优化而非「技术突破」。',
      category: 'AI 运营',
    },
    {
      id: 'role_product',
      title: 'AI 产品经理（AI Product）',
      matchScore: 85,
      description:
        '定义 AI 功能要解决的真实问题、设计交互与评估标准，协调算法与工程落地。',
      whyFit: '你的用户研究、需求翻译与跨部门协作能力是 AI 产品经理的核心能力。',
      requiredSkills: ['需求洞察', '场景定义', '评估指标设计', '跨团队协作'],
      typicalWorkflows: [
        '用户访谈 → 场景定义 → 与算法/工程对齐 → 设计评估标准 → 上线迭代',
      ],
      realWorldExamples: [
        '某 AI 助手产品由非技术背景 PM 主导场景定义，上线 3 个月留存翻倍',
        '教育 AI 产品通过 PM 设计的评估指标发现并修复了输出偏见问题',
      ],
      tradeoffs:
        '优势：天花板高、影响力大；代价：需要理解 AI 能力边界，前期学习曲线更陡。',
      category: 'AI 产品',
    },
    {
      id: 'role_edu',
      title: 'AI 教育 / 应用推广（AI Adoption）',
      matchScore: 80,
      description:
        '面向企业或公众设计 AI 培训与落地路径，帮助团队真正把 AI 用起来。',
      whyFit: '你的课程设计、内容表达与教学经验，可直接迁移为 AI 培训设计能力。',
      requiredSkills: ['培训设计', '内容表达', '落地陪跑', '效果评估'],
      typicalWorkflows: ['调研团队现状 → 设计培训路径 → 陪跑试点 → 评估落地效果'],
      realWorldExamples: [
        '某企业 AI 培训师由前教师转型，半年带动 200+ 员工上手 AI 工具',
        '教育机构把 AI 应用课程外包给懂教学的人，满意度高于纯技术讲师',
      ],
      tradeoffs:
        '优势：转型路径顺滑、可灵活兼职；代价：收入与项目资源强相关，需要积累服务口碑。',
      category: 'AI 教育',
    },
  ],
  womenFriendlyTracks: [
    { title: 'AI 运营', reason: '门槛适中、需求大、支持灵活与远程，适合产后回归节奏。' },
    { title: 'AI 产品', reason: '重视共情与沟通，非技术背景女性有明显优势。' },
    { title: 'AI 教育', reason: '看重表达与教学，天然承接教育/内容背景。' },
    { title: 'AI 伦理', reason: '重视价值判断与合规视角，适合 HR、法律、社会科学背景。' },
    { title: '数据治理', reason: '强调细致与规范，节奏可控，对技术门槛要求温和。' },
  ],
  genderRiskHints: [
    {
      scenario: '担心生育/育儿断档被面试官追问',
      gentleAdvice:
        '不必掩饰，把空窗期讲成「另一种场景的能力沉淀」，并准备 1-2 个用 AI 工具完成的小作品作为证据。',
    },
    {
      scenario: '信心低谷，觉得自己「不配」AI 岗位',
      gentleAdvice:
        '先用证据库里的真实成果给自己「校准」，女性普遍系统性低估自身技术相关性——这不是能力问题。',
    },
  ],
  createdAt: isoPast(17),
};

// —— 旅程 ⑤ 30 天计划（demo.returner）——
export const SEED_RETURN_PLAN: ReturnPlan = {
  uid: 'demo_returner',
  paceLabel: '产后回归',
  weeklyHours: 6,
  totalWeeks: 4,
  interruptibleStages: [1, 2, 3, 4],
  returnPlaybook:
    '若中途被迫暂停（如孩子生病），执行「8 周回归计划」：把原 4 周任务按优先级拆成 8 周，每周只保留 1 个核心任务，其余顺延，不设补课压力。',
  weeks: [
    {
      week: 1,
      theme: '建立 AI 工具基本手感',
      weeklyHours: 6,
      learningResources: ['AI 提示词入门 40 分钟视频', '主流 AI 工具选型对照表'],
      practiceTasks: [
        {
          id: 'pt_1_1',
          week: 1,
          title: '用 AI 完成一次课程提纲整理',
          category: 'practice',
          estimatedHours: 2,
          completed: true,
        },
        {
          id: 'pt_1_2',
          week: 1,
          title: '体验 2 个 AI 写作工具并记录差异',
          category: 'learning',
          estimatedHours: 2,
          completed: true,
        },
      ],
      jobSearchMilestones: ['更新简历中的 AI 相关描述'],
      interruptible: true,
    },
    {
      week: 2,
      theme: '把过往经验翻译成 AI 语言',
      weeklyHours: 6,
      learningResources: ['AI 运营岗位 JD 拆解清单'],
      practiceTasks: [
        {
          id: 'pt_2_1',
          week: 2,
          title: '重写简历：突出流程结构化与协作能力',
          category: 'practice',
          estimatedHours: 3,
          completed: false,
        },
        {
          id: 'pt_2_2',
          week: 2,
          title: '研究 3 个 AI 运营岗位的真实要求',
          category: 'learning',
          estimatedHours: 2,
          completed: false,
        },
      ],
      jobSearchMilestones: ['投递 3 个 AI 运营实习/初级岗位'],
      interruptible: true,
    },
    {
      week: 3,
      theme: '产出第一个可展示的作品',
      weeklyHours: 6,
      learningResources: ['AI 工作流案例集'],
      practiceTasks: [
        {
          id: 'pt_3_1',
          week: 3,
          title: '完成一个 AI 内容工作流 demo 并记录过程',
          category: 'practice',
          estimatedHours: 4,
          completed: false,
        },
      ],
      jobSearchMilestones: ['作品整理成 1 页展示材料'],
      interruptible: true,
    },
    {
      week: 4,
      theme: '进入真实对话与迭代',
      weeklyHours: 6,
      learningResources: ['面试常见问题应答参考'],
      practiceTasks: [
        {
          id: 'pt_4_1',
          week: 4,
          title: '约一次导师或同辈 coffee chat 做模拟沟通',
          category: 'milestone',
          estimatedHours: 1,
          completed: false,
        },
        {
          id: 'pt_4_2',
          week: 4,
          title: '根据反馈迭代作品与简历',
          category: 'practice',
          estimatedHours: 2,
          completed: false,
        },
      ],
      jobSearchMilestones: ['完成一次模拟面试复盘'],
      interruptible: true,
    },
  ],
  createdAt: isoPast(16),
};

// —— 旅程 ④ 实操任务（demo.returner：2 个已完成含反馈）——
export const SEED_LAB_TASKS: LabTask[] = [
  {
    id: 'lab_1',
    uid: 'demo_returner',
    taskKey: 'lesson-localization',
    title: '用 AI 为一篇英文教案生成 3 个本土化改写并说明取舍',
    scenario:
      '你手上有一篇面向欧美学生的英文教案，需要改写成适合国内中学生使用的内容，同时保持教学目标不变。',
    toolHint: '任意通用大模型；重点观察「改写」与「保留原意」之间的取舍。',
    rubric: [
      '产出 3 个版本且各有明确取舍理由',
      '保留原教学目标与知识结构',
      '本土化到位（案例/语言/文化）',
      '说明哪一版最优及原因',
    ],
    estimatedMinutes: 30,
    status: 'done',
    submissions: [
      {
        id: 'sub_1_1',
        text: '版本一：仅替换文化案例，其余保留；版本二：重写互动环节为小组讨论；版本三：整体重排为国内课标结构。我选了版本二，因为它在保持目标的同时更符合本地课堂节奏。',
        feedback: {
          highlights: [
            '你明确写出了三个版本的差异，并给出取舍依据，这是「结构化判断」的有力证据。',
            '你选择版本二并说明与本地课堂节奏的关系，体现了对真实使用场景的敏感度。',
          ],
          actionableSuggestions: [
            '可补充一句「若课时更短则选版本一」，用条件分支让取舍更完整。',
          ],
          skillGapAnalysis: [
            '已掌握：结构化改写与取舍判断',
            '下一步微技能：为不同约束条件准备备选方案',
          ],
          score: 4.5,
          evaluatedAt: isoPast(15),
        },
        submittedAt: isoPast(15),
      },
    ],
    createdAt: isoPast(16),
  },
  {
    id: 'lab_2',
    uid: 'demo_returner',
    taskKey: 'competitor-table',
    title: '用 AI 做一次竞品功能对比表',
    scenario:
      '选择 3 个同类 AI 工具，对比核心功能、定价与适用场景，输出一张可用于汇报的对比表。',
    toolHint: '大模型 + 表格整理；注意让 AI 标注信息的不确定来源。',
    rubric: [
      '覆盖 3 个竞品且维度一致',
      '包含功能/定价/适用场景',
      '标注信息来源与不确定性',
      '给出 1 条业务结论',
    ],
    estimatedMinutes: 40,
    status: 'done',
    submissions: [
      {
        id: 'sub_2_1',
        text: '对比了 A/B/C 三个工具：A 擅长长文本但贵；B 便宜但输出不稳定；C 平衡但生态弱。结论是团队先用 B 试水。信息来自官网与 2 篇测评，部分定价可能有更新。',
        feedback: {
          highlights: [
            '你主动标注了信息来源与不确定性，这是 AI 输出质量核查的关键意识。',
            '你给出了「先用 B 试水」的业务结论，说明你能把对比转成决策。',
          ],
          actionableSuggestions: [
            '建议为「输出不稳定」补充一个具体案例，增强说服力。',
          ],
          skillGapAnalysis: [
            '已掌握：信息核查与决策输出',
            '下一步微技能：用数据量化「不稳定」',
          ],
          score: 4.8,
          evaluatedAt: isoPast(8),
        },
        submittedAt: isoPast(8),
      },
    ],
    createdAt: isoPast(12),
  },
];

// —— 贯穿层 B 证据库（demo.returner：8 条覆盖多类型）——
export const SEED_EVIDENCES: EvidenceItem[] = [
  {
    id: 'ev_1',
    uid: 'demo_returner',
    type: 'assessment_result',
    title: '完成技能发现测评',
    detail: 'AI 识别出 5 项可迁移技能，并完成 6 维自信度校准。',
    source: 'auto',
    tags: ['技能发现', '校准'],
    isPublic: true,
    createdAt: isoPast(18),
  },
  {
    id: 'ev_2',
    uid: 'demo_returner',
    type: 'task_outcome',
    title: '实操任务：教案本土化改写',
    detail: '按 rubric 评分 4.5 / 5，亮点是结构化取舍判断。',
    source: 'auto',
    tags: ['实操任务'],
    relatedId: 'lab_1',
    isPublic: true,
    createdAt: isoPast(15),
  },
  {
    id: 'ev_3',
    uid: 'demo_returner',
    type: 'task_outcome',
    title: '实操任务：竞品功能对比表',
    detail: '按 rubric 评分 4.8 / 5，展现了信息核查与决策输出能力。',
    source: 'auto',
    tags: ['实操任务'],
    relatedId: 'lab_2',
    isPublic: true,
    createdAt: isoPast(8),
  },
  {
    id: 'ev_4',
    uid: 'demo_returner',
    type: 'skill_progress',
    title: '完成第一周计划任务',
    detail: '完成「用 AI 整理课程提纲」与「体验 2 个 AI 写作工具」。',
    source: 'auto',
    tags: ['回归计划'],
    isPublic: false,
    createdAt: isoPast(14),
  },
  {
    id: 'ev_5',
    uid: 'demo_returner',
    type: 'mentor_endorsement',
    title: '导师背书：林知夏',
    detail: '「知夏在会话中展现出极强的结构化表达力，能把运营经验清晰翻译为 AI 产品语言。」',
    source: 'auto',
    tags: ['导师背书', '已认证'],
    isPublic: true,
    createdAt: isoPast(10),
  },
  {
    id: 'ev_6',
    uid: 'demo_returner',
    type: 'peer_appreciation',
    title: '同辈感谢：周敏',
    detail: '「谢谢知夏耐心帮我梳理 AI 运营的入门路径，让我不再害怕起步。」',
    source: 'auto',
    tags: ['同辈感谢'],
    isPublic: true,
    createdAt: isoPast(7),
  },
  {
    id: 'ev_7',
    uid: 'demo_returner',
    type: 'community_kudos',
    title: '同辈认可：帖子获得 3 个加油',
    detail: '「产后 2 年想转 AI 但怕跟不上」获得 3 个同辈加油。',
    source: 'auto',
    tags: ['对话广场', '同辈认可'],
    isPublic: true,
    createdAt: isoPast(5),
  },
  {
    id: 'ev_8',
    uid: 'demo_returner',
    type: 'milestone',
    title: '里程碑：完成首个实操任务',
    detail: '你完成了第一个真实 AI 任务并获得正向反馈。',
    source: 'auto',
    tags: ['里程碑'],
    isPublic: true,
    createdAt: isoPast(15),
  },
];

// —— 专业导师预约（demo.returner：2 条 released）——
export const SEED_PACKAGE_ORDERS: PackageOrder[] = [
  {
    id: 'pkg_1',
    coacheeId: 'demo_returner',
    mentorId: 'mentor_1',
    totalSessions: 5,
    remainingRedemptions: 3,
    amount: 1299,
    status: 'active',
    createdAt: isoPast(12),
  },
];

export const SEED_BOOKINGS: Booking[] = [
  {
    id: 'bk_1',
    coacheeId: 'demo_returner',
    coacheeName: '林知夏',
    mentorId: 'mentor_1',
    mentorName: '林知夏',
    slotId: 'mentor_1_slot_1',
    kind: 'package',
    status: 'released',
    amount: 0,
    snapshotMentorName: '林知夏',
    snapshotPrice: 1299,
    scheduledTime: isoPast(10, 19),
    meetingLink: 'https://meet.example.com/rebloom-demo-link',
    packageOrderId: 'pkg_1',
    topic: '职业空窗期的简历重构与 AI 运营定位',
    review: {
      rating: 5,
      comment: '知夏帮我把空窗期讲成了优势，简历终于有方向了。',
      createdAt: isoPast(9),
    },
    endorsement:
      '知夏在会话中展现出极强的结构化表达力，能把运营经验清晰翻译为 AI 产品语言。',
    createdAt: isoPast(12),
    updatedAt: isoPast(9),
  },
  {
    id: 'bk_2',
    coacheeId: 'demo_returner',
    coacheeName: '林知夏',
    mentorId: 'mentor_3',
    mentorName: '苏叶',
    slotId: 'mentor_3_slot_2',
    kind: 'single',
    status: 'released',
    amount: 199,
    snapshotMentorName: '苏叶',
    snapshotPrice: 199,
    scheduledTime: isoPast(4, 20),
    meetingLink: 'https://meet.example.com/rebloom-demo-link-2',
    topic: 'AI 运营第一个作品怎么做',
    createdAt: isoPast(6),
    updatedAt: isoPast(3),
  },
];

// —— Peer Coffee Chat（demo.returner：1 条 completed 含感谢）——
export const SEED_PEER_CHATS: PeerChat[] = [
  {
    id: 'pc_1',
    requesterId: 'user_zhou',
    requesterName: '周敏',
    helperId: 'demo_returner',
    helperName: '林知夏',
    postId: 'post_help_1',
    status: 'completed',
    proposedTime: isoPast(8, 20),
    confirmedTime: isoPast(7, 21),
    chatLink: 'https://meet.example.com/rebloom-peer-demo',
    appreciation: '谢谢知夏耐心帮我梳理 AI 运营的入门路径，让我不再害怕起步。',
    createdAt: isoPast(9),
    updatedAt: isoPast(7),
  },
];

// —— 对话广场 ——
export const SEED_PLAZA_POSTS: PlazaPost[] = [
  {
    id: 'post_help_1',
    authorId: 'demo_returner',
    anonymous: true,
    anonymousHandle: '匿名·山茶花',
    images: [],
    title: '产后 2 年想转 AI，但怕跟不上',
    body: '离开职场快两年了，看到大家都在聊 AI 有点慌。我做过教育和运营，想知道从哪个方向切入最现实，也怕自己学不动。有没有姐妹走过这条路？',
    tags: ['产后回归', 'AI 运营', '求方向'],
    status: 'resolved',
    kudosCount: 3,
    commentCount: 2,
    willingToHelpCount: 2,
    createdAt: isoPast(9),
    updatedAt: isoPast(7),
  },
  {
    id: 'post_help_2',
    authorId: 'user_li',
    anonymous: true,
    anonymousHandle: '匿名·银杏叶',
    images: [],
    title: '非技术背景，AI 产品经理真的可行吗？',
    body: '我是跨境电商运营，想转 AI 产品。看到岗位都要求懂技术，有点打退堂鼓。想听听真实转型的人怎么说。',
    tags: ['AI 产品', '非技术背景'],
    status: 'open',
    kudosCount: 5,
    commentCount: 1,
    willingToHelpCount: 1,
    createdAt: isoPast(4),
    updatedAt: isoPast(3),
  },
  {
    id: 'post_help_3',
    authorId: 'user_su',
    anonymous: false,
    images: [],
    title: 'HR 转 AI 伦理，需要补哪些知识？',
    body: '我做招聘 4 年，关注 AI 招聘公平和数据合规。想转 AI 伦理方向，但不确定从哪里开始学。',
    tags: ['AI 伦理', '转型路径'],
    status: 'open',
    kudosCount: 2,
    commentCount: 1,
    willingToHelpCount: 0,
    createdAt: isoPast(2),
    updatedAt: isoPast(2),
  },
  {
    id: 'post_win_1',
    authorId: 'user_zhou',
    anonymous: false,
    images: [
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80',
    ],
    title: '我用 AI 把社群周报从 3 小时压缩到 40 分钟',
    body: '跟着平台的工作流思路，把周报拆成模板+人工复核，效率高了好多。原来我也能做到！',
    tags: ['AI 运营', '作品'],
    status: 'open',
    kudosCount: 6,
    commentCount: 1,
    willingToHelpCount: 0,
    evidenceRef: 'seed_win_evidence',
    createdAt: isoPast(6),
    updatedAt: isoPast(5),
  },
  {
    id: 'post_win_2',
    authorId: 'user_li',
    anonymous: false,
    images: [],
    title: '拿到第一个 AI 运营实习面试机会',
    body: '把运营经验重写成 AI 语言后，简历终于有回音了！分享给还在犹豫的姐妹。',
    tags: ['好消息', 'AI 运营'],
    status: 'open',
    kudosCount: 9,
    commentCount: 2,
    willingToHelpCount: 0,
    createdAt: isoPast(3),
    updatedAt: isoPast(2),
  },
  {
    id: 'post_cheer_1',
    authorId: 'user_su',
    anonymous: false,
    images: [
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80',
    ],
    title: '找一位同行伙伴一起打卡学 AI',
    body: '想找一位姐妹，每周互相打卡、聊聊进度，互相监督也互相打气。有人在学 AI 伦理/治理方向吗？',
    tags: ['找伙伴', '打卡'],
    status: 'open',
    kudosCount: 4,
    commentCount: 0,
    willingToHelpCount: 0,
    createdAt: isoPast(1),
    updatedAt: isoPast(1),
  },
];

export const SEED_PLAZA_COMMENTS: PlazaComment[] = [
  {
    id: 'pc_c1',
    postId: 'post_help_1',
    authorId: 'user_zhou',
    anonymous: false,
    text: '我跟你情况很像，去年也很慌。后来先从 AI 运营切入，把原来的内容经验用上了，现在在做兼职。别急，你可以的。',
    createdAt: isoPast(8),
  },
  {
    id: 'pc_c2',
    postId: 'post_help_1',
    authorId: 'user_li',
    anonymous: true,
    anonymousHandle: '匿名·蒲公英',
    text: '教育+运营背景其实很吃香，AI 教育和 AI 运营都很欢迎这种组合，加油！',
    createdAt: isoPast(7),
  },
  {
    id: 'pc_c3',
    postId: 'post_help_2',
    authorId: 'user_su',
    anonymous: false,
    text: 'AI 产品不一定要会写代码，懂场景和协作更重要，可以试试做个小作品证明自己。',
    createdAt: isoPast(3),
  },
  {
    id: 'pc_c4',
    postId: 'post_help_3',
    authorId: 'user_li',
    anonymous: false,
    text: '可以先从数据合规和 AI 招聘公平这两个具体场景入手，资料相对好找。',
    createdAt: isoPast(1),
  },
  {
    id: 'pc_c5',
    postId: 'post_win_1',
    authorId: 'demo_returner',
    anonymous: false,
    text: '太棒了！这种「模板+人工复核」的思路我也在用，效率真的不一样。',
    createdAt: isoPast(5),
  },
  {
    id: 'pc_c6',
    postId: 'post_win_2',
    authorId: 'user_zhou',
    anonymous: false,
    text: '恭喜！面试记得讲讲你是怎么把运营经验翻译成 AI 语言的。',
    createdAt: isoPast(2),
  },
  {
    id: 'pc_c7',
    postId: 'post_win_2',
    authorId: 'user_su',
    anonymous: false,
    text: '接好运！我也要开始准备简历了。',
    createdAt: isoPast(1),
  },
];

export const SEED_WILLING: Record<string, WillingToHelp[]> = {
  post_help_1: [
    {
      helperUid: 'user_zhou',
      helperName: '周敏',
      helperBio: '二胎妈妈，兼职内容编辑，正在自学 AI 提示词与内容工作流。',
      helperSkills: ['内容策划', '社群运营', 'AI 工具入门'],
      helperLifeStage: '兼职过渡',
      status: 'offered',
      createdAt: isoPast(8),
    },
    {
      helperUid: 'user_li',
      helperName: '李楠',
      helperBio: '跨境电商运营 3 年，正在转型 AI 教育。',
      helperSkills: ['运营', '文案', '用户增长'],
      helperLifeStage: '职场新人',
      status: 'consumed',
      createdAt: isoPast(8),
    },
  ],
  post_help_2: [
    {
      helperUid: 'demo_returner',
      helperName: '林知夏',
      helperBio: '前教育运营主管，正在转 AI 运营，愿意分享非技术转型经验。',
      helperSkills: ['流程结构化', '跨部门协作', 'AI 运营'],
      helperLifeStage: '产后回归',
      status: 'offered',
      createdAt: isoPast(3),
    },
  ],
};

// —— 圈子帖子（demo.returner 3 条）——
export const SEED_CIRCLE_POSTS: CirclePost[] = [
  {
    id: 'circle_1',
    authorId: 'demo_returner',
    authorName: '林知夏',
    authorStage: '产后回归',
    type: 'win',
    title: '解锁成果：实操任务评分 4.5',
    body: '刚完成第一个 AI 教案本土化任务，拿到 4.5 分！从「凭什么是我」到「为什么不能是我」，迈出第一步了。',
    tags: ['成果分享', '实操任务'],
    kudosCount: 3,
    commentCount: 1,
    evidenceRef: 'ev_2',
    createdAt: isoPast(14),
  },
  {
    id: 'circle_2',
    authorId: 'demo_returner',
    authorName: '林知夏',
    authorStage: '产后回归',
    type: 'qa',
    title: '问：产后回归面试怎么解释空窗期？',
    body: '下周有个 AI 运营的面试，不知道怎么讲这两年的空窗期才不显得被动，想听听大家的经验。',
    tags: ['面试', '产后回归'],
    kudosCount: 5,
    commentCount: 2,
    createdAt: isoPast(6),
  },
  {
    id: 'circle_3',
    authorId: 'demo_returner',
    authorName: '林知夏',
    authorStage: '产后回归',
    type: 'cheer',
    title: '给正在犹豫的姐妹加油',
    body: '如果你也在犹豫要不要进 AI，别怕。我们不是从零开始，我们是把过去的能力换个战场。',
    tags: ['加油', '同行伙伴'],
    kudosCount: 7,
    commentCount: 0,
    createdAt: isoPast(2),
  },
];
