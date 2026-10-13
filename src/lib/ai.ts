// 占位 AI 层（原型阶段：Agent 暂未接入）。
// 将来在 agent platform 搭好 AI Coach 后，仅需替换本文件内的实现，即可接入真实模型。

import { LIFE_STAGE_LABELS } from './constants';
import type {
  EvidenceItem,
  GenderRiskHint,
  LabFeedback,
  LabTask,
  OpportunityReport,
  ReturnPlan,
  RoleMatch,
  SkillProfile,
  TransferableSkill,
  UserProfile,
  WomenFriendlyTrack,
} from './types';

/** 占位：分析可迁移技能 + 自信度校准 */
export function buildSkillProfile(user: UserProfile): Omit<SkillProfile, 'uid' | 'createdAt'> {
  const stage = LIFE_STAGE_LABELS[user.lifeStage];
  const skills: TransferableSkill[] = [
    {
      id: 'ai_sk_1',
      name: '流程结构化与拆解',
      evidence: `你在「${user.currentRole}」的经历中，已经把复杂事务整理成可执行步骤`,
      aiRelevance: 90,
      narrative: `你在过往工作中已经做到了「把混乱信息拆成步骤」，这正是 AI 工作流设计需要的核心能力。`,
    },
    {
      id: 'ai_sk_2',
      name: '沟通与需求翻译',
      evidence: '你需要长期在不同角色之间对齐信息与预期',
      aiRelevance: 85,
      narrative: '你在协作中已经做到了「把不同人的话翻译成统一语言」，这是 AI 岗位的关键能力。',
    },
    {
      id: 'ai_sk_3',
      name: '问题拆解与优先级判断',
      evidence: '你在真实工作中需要不断判断「先做什么、做到什么程度」',
      aiRelevance: 82,
      narrative: '你已经在真实场景里做到了问题拆解，这直接对应 AI 工作流中的问题定位能力。',
    },
    {
      id: 'ai_sk_4',
      name: '内容表达与用户视角',
      evidence: '你的工作天然要求面向真实用户表达与交付',
      aiRelevance: 78,
      narrative: '你的表达与用户视角，可直接迁移为 AI 提示词设计与输出评估能力。',
    },
    {
      id: 'ai_sk_5',
      name: '项目节奏与协作管理',
      evidence: '你需要在有限资源下保证事情推进完成',
      aiRelevance: 80,
      narrative: '你已经在真实项目中做到了「有限资源下保证交付」，这是 AI 运营落地时的项目能力。',
    },
  ];

  return {
    uniqueValue: `你当前处于「${stage}」阶段，${user.name}。你的独特价值在于把过去的真实经验翻译成 AI 工作流语言——这不是从零开始，而是把能力换个战场。你的结构化、沟通与用户视角，正是 AI 岗位最稀缺的桥梁型能力。`,
    transferableSkills: skills,
    confidenceCalibration: [
      {
        dimension: '技术自我效能感',
        selfScore: user.confidenceSelf,
        aiScore: Math.min(10, user.confidenceSelf + 4),
        evidenceRef:
          '你在真实项目中已经做到了系统化拆解与落地，这正是 AI 岗位需要的结构化能力——你把它低估成了「普通工作」。',
      },
      {
        dimension: 'AI 工具就绪度',
        selfScore: Math.min(10, user.confidenceSelf + 1),
        aiScore: Math.min(10, user.confidenceSelf + 3),
        evidenceRef: '你愿意开始了解 AI 工具，这已经是 AI 运营的起点能力。',
      },
      {
        dimension: '职业空窗价值感',
        selfScore: Math.max(1, user.confidenceSelf - 1),
        aiScore: Math.min(10, user.confidenceSelf + 4),
        evidenceRef:
          '照护期本身就是高强度多任务协调训练——空窗期不是空白，是另一种场景的能力沉淀。',
      },
      {
        dimension: '领域迁移能力',
        selfScore: Math.min(10, user.confidenceSelf + 1),
        aiScore: Math.min(10, user.confidenceSelf + 4),
        evidenceRef: '你能把原有行业经验迁移到 AI 场景，这是跨领域迁移能力的有力证据。',
      },
      {
        dimension: '问题拆解能力',
        selfScore: Math.min(10, user.confidenceSelf + 1),
        aiScore: Math.min(10, user.confidenceSelf + 3),
        evidenceRef: '你处理真实问题与卡点的经验，正是 AI 工作流中问题定位与拆解的能力。',
      },
      {
        dimension: '伦理与质量判断',
        selfScore: user.confidenceSelf,
        aiScore: Math.min(10, user.confidenceSelf + 3),
        evidenceRef: '你在交付中的严谨性，可直接迁移为 AI 输出质量的评估与核查能力。',
      },
    ],
  };
}

/** 占位：匹配 AI 岗位与女性友好赛道 */
export function buildOpportunityReport(
  user: UserProfile,
  _skills: SkillProfile
): Omit<OpportunityReport, 'uid' | 'createdAt'> {
  const roleMatches: RoleMatch[] = [
    {
      id: 'ai_role_ops',
      title: 'AI 运营（AI Operations）',
      matchScore: 90,
      description:
        '把 AI 能力落到具体业务流程：设计提示词模板、搭建内容与服务工作流、监控输出质量并迭代。',
      whyFit: '你的结构化与协作能力高度匹配，且不需要编程基础。',
      requiredSkills: ['提示词设计', '工作流搭建', '跨部门协作', '数据复盘', '质量评估'],
      typicalWorkflows: ['梳理场景 → 设计模板 → 小范围试点 → 收集反馈 → 迭代推广'],
      realWorldExamples: [
        '教育公司用 AI 运营把答疑响应从 2 天缩短到 2 小时',
        '电商团队由运营同学搭建 AI 文案工作流，效率提升 3 倍',
      ],
      tradeoffs: '优势：门槛低、需求大、可灵活；代价：需持续跟进工具变化。',
      category: 'AI 运营',
    },
    {
      id: 'ai_role_product',
      title: 'AI 产品经理（AI Product）',
      matchScore: 84,
      description: '定义 AI 功能要解决的真实问题，设计交互与评估标准，协调算法与工程落地。',
      whyFit: '你的用户视角与沟通能力是 AI 产品经理的核心能力。',
      requiredSkills: ['需求洞察', '场景定义', '评估指标设计', '跨团队协作'],
      typicalWorkflows: ['用户访谈 → 场景定义 → 对齐算法/工程 → 设计评估标准 → 上线迭代'],
      realWorldExamples: ['非技术背景 PM 主导场景定义，产品留存翻倍'],
      tradeoffs: '优势：天花板高；代价：前期学习曲线更陡。',
      category: 'AI 产品',
    },
    {
      id: 'ai_role_edu',
      title: 'AI 教育 / 应用推广（AI Adoption）',
      matchScore: 79,
      description: '面向企业或公众设计 AI 培训与落地路径，帮助团队真正用起来。',
      whyFit: '你的表达与教学/内容经验，可迁移为 AI 培训设计能力。',
      requiredSkills: ['培训设计', '内容表达', '落地陪跑', '效果评估'],
      typicalWorkflows: ['调研现状 → 设计培训路径 → 陪跑试点 → 评估效果'],
      realWorldExamples: ['前教师转型 AI 培训师，半年带动 200+ 员工上手'],
      tradeoffs: '优势：转型顺滑、可兼职；代价：收入与项目资源强相关。',
      category: 'AI 教育',
    },
  ];

  const womenFriendlyTracks: WomenFriendlyTrack[] = [
    { title: 'AI 运营', reason: '门槛适中、需求大、支持灵活与远程。' },
    { title: 'AI 产品', reason: '重视共情与沟通，非技术背景有优势。' },
    { title: 'AI 教育', reason: '看重表达与教学，天然承接教育/内容背景。' },
    { title: 'AI 伦理', reason: '重视价值判断与合规视角。' },
    { title: '数据治理', reason: '强调细致规范，节奏可控。' },
  ];

  const genderRiskHints: GenderRiskHint[] = [
    {
      scenario: '担心生育/育儿断档被追问',
      gentleAdvice:
        '不必掩饰，把空窗期讲成「另一种场景的能力沉淀」，并准备 1-2 个 AI 小作品作为证据。',
    },
    {
      scenario: '信心低谷，觉得「不配」AI 岗位',
      gentleAdvice:
        '先用证据库里的真实成果给自己校准——女性普遍系统性低估自身与技术的相关性，这不是能力问题。',
    },
  ];

  return { roleMatches, womenFriendlyTracks, genderRiskHints };
}

/** 占位：生成 30 天回归计划 */
export function buildReturnPlan(
  user: UserProfile,
  adjustmentFeedback?: string
): Omit<ReturnPlan, 'uid' | 'createdAt'> {
  const hours = Math.max(2, user.constraints.weeklyHours);

  const weeks = [1, 2, 3, 4].map((week) => ({
    week,
    theme:
      week === 1
        ? '建立 AI 工具基本手感'
        : week === 2
          ? '把过往经验翻译成 AI 语言'
          : week === 3
            ? '产出第一个可展示的作品'
            : '进入真实对话与迭代',
    weeklyHours: hours,
    learningResources: [`第 ${week} 周主题资料与案例清单`],
    practiceTasks: [
      {
        id: `ai_pt_${week}_1`,
        week,
        title:
          week === 1
            ? '用 AI 完成一次资料整理'
            : week === 2
              ? '重写简历，突出可迁移能力'
              : week === 3
                ? '完成一个 AI 工作流小 demo'
                : '约一次同辈 coffee chat 做沟通练习',
        category: (week === 4 ? 'milestone' : 'practice') as
          | 'practice'
          | 'milestone',
        estimatedHours: Math.max(1, Math.round(hours * 0.5)),
        completed: false,
      },
    ],
    jobSearchMilestones: [
      week === 4 ? '完成一次模拟面试复盘' : `完成第 ${week} 周复盘`,
    ],
    interruptible: true,
  }));

  return {
    paceLabel: LIFE_STAGE_LABELS[user.lifeStage],
    weeklyHours: hours,
    totalWeeks: 4,
    interruptibleStages: [1, 2, 3, 4],
    returnPlaybook:
      '如需暂停，执行「8 周回归计划」：把 4 周任务按优先级拆成 8 周，每周只保留 1 个核心任务，其余顺延——暂停不等于淘汰。',
    weeks,
  };
}

/** 占位：按目标岗位推荐 3 个分级小任务 */
export function buildLabTasks(user: UserProfile): Omit<LabTask, 'id' | 'uid' | 'createdAt'>[] {
  return [
    {
      taskKey: 'lesson-localization',
      title: '用 AI 为一篇英文教案生成 3 个本土化改写并说明取舍',
      scenario:
        '把一篇面向欧美学生的英文教案，改写为适合国内中学生使用的内容，保持教学目标不变。',
      toolHint: '任意通用大模型；重点观察「改写」与「保留原意」的取舍。',
      rubric: [
        '产出 3 个版本且各有取舍理由',
        '保留原教学目标与知识结构',
        '本土化到位（案例/语言/文化）',
        '说明哪一版最优及原因',
      ],
      estimatedMinutes: 30,
      status: 'todo',
      submissions: [],
    },
    {
      taskKey: 'competitor-table',
      title: '用 AI 做一次竞品功能对比表',
      scenario:
        '选择 3 个同类 AI 工具，对比核心功能、定价与适用场景，输出一张可用于汇报的对比表。',
      toolHint: '大模型 + 表格整理；让 AI 标注信息的不确定来源。',
      rubric: ['覆盖 3 个竞品且维度一致', '包含功能/定价/适用场景', '标注信息来源', '给出 1 条业务结论'],
      estimatedMinutes: 40,
      status: 'todo',
      submissions: [],
    },
    {
      taskKey: 'faq-workflow',
      title: '用 AI 搭建一个答疑工作流并写出质量检查清单',
      scenario:
        '为某个真实业务场景设计 AI 答疑流程，包含提示词模板与人工复核规则。',
      toolHint: '大模型；关注提示词与人工复核的分工。',
      rubric: ['有明确场景', '含提示词模板', '含复核清单', '说明如何衡量效果'],
      estimatedMinutes: 35,
      status: 'todo',
      submissions: [],
    },
  ];
}

/** 占位：按 rubric 评估任务产出（迭代重做时也走这里） */
export function evaluateSubmission(submissionText: string): LabFeedback {
  const hasStructure = /版本|对比|清单|步骤|1|一/.test(submissionText);
  const score = hasStructure ? 4.6 : 4.0;
  return {
    highlights: [
      '你写出了具体的做法并给出判断依据，这是「结构化判断」的有力证据。',
      '你能把任务落到真实使用场景，体现了对业务的理解。',
    ],
    actionableSuggestions: [
      '可以补充一个「若条件变化则改选哪种方案」的条件分支，让取舍更完整。',
    ],
    skillGapAnalysis: [
      '已掌握：结构化拆解与取舍判断',
      '下一步微技能：为不同约束准备备选方案',
    ],
    score,
    evaluatedAt: new Date().toISOString(),
  };
}

/** 反哺给 Agent 的上下文（真人沟通与任务反馈的沉淀） */
export interface CoachContext {
  /** 计划进度：已完成 / 总数 + 下一个待办任务标题 */
  planProgress?: { done: number; total: number; nextTaskTitle?: string };
  /** 最近一次实操任务反馈得分（任务反馈反哺） */
  recentFeedbackScore?: number;
  /** 已完成的导师会话次数（付费教练沟通反哺） */
  completedSessionCount?: number;
}

/** 占位：AI Mentor 回复（含计划陪伴提醒 / 证据重构法 / 微行动 / 暂停不等于淘汰 红线） */
export function coachReply(
  user: UserProfile,
  evidences: EvidenceItem[],
  userMessage: string,
  context: CoachContext = {}
): { content: string; microAction?: string } {
  const negative = /不适合|不行|不会|怕|焦虑|配不上|跟不上|没经验|空窗/.test(userMessage);
  const pause = /暂停|休息|生病|累|没时间/.test(userMessage);
  const planTalk = /计划|任务|坚持|拖延|忘记|忘了|做不到|进度|下一步|先做|这周|今天/.test(
    userMessage
  );
  const evidence = evidences[0];
  const progress = context.planProgress;
  const nextTask = progress?.nextTaskTitle;

  let content: string;
  if (pause) {
    content = `${user.name}，先照顾好自己。暂停不等于淘汰——把节奏调慢，不等于放弃目标。你的计划是可中断的，这周少做一点也没关系。`;
  } else if (planTalk && progress && progress.total > 0) {
    // 计划陪伴提醒：引用计划进度 + 反哺上下文
    const parts: string[] = [];
    if (nextTask) {
      parts.push(`你的下一个任务是「${nextTask}」——先只做这一件，做完就算今天赢。`);
    }
    parts.push(`目前进度 ${progress.done}/${progress.total}，按你的节奏来就好。`);
    if (typeof context.recentFeedbackScore === 'number') {
      parts.push(
        `我记得你上次任务反馈拿了 ${context.recentFeedbackScore} 分——那不是运气，是你真的会做。`
      );
    }
    if (typeof context.completedSessionCount === 'number' && context.completedSessionCount > 0) {
      parts.push(
        `你和导师那 ${context.completedSessionCount} 次对话我也记着，里面提到的方向可以揉进下一步。`
      );
    }
    content = `${user.name}，${parts.join('')}`;
  } else if (negative) {
    const ref = evidence
      ? `你已经有一份真实的证据：「${evidence.title}」——${evidence.detail}`
      : '你愿意走到这一步，本身就已经是证据。';
    content = `${user.name}，我听到你的不安了。${ref} 这不是鸡汤，这是你自己做出来的事实。从「凭什么是我」到「为什么不能是我」，你缺的不是能力，而是被看见。`;
  } else {
    const taskHint = nextTask ? `我看了你的计划，下一步是「${nextTask}」。` : '';
    content = `${user.name}，我们一步一步来。基于你现在的档案与证据，我建议先把「${user.targetRole}」当作主线，用一个小作品验证方向，再决定要不要深入。${taskHint}`;
  }

  if (negative && !content.includes('广场')) {
    content += '\n你也可以去对话广场看看其他姐妹的经历，或把自己的困惑发出来——你不是一个人。';
  }

  return {
    content,
    microAction: '花 5 分钟，在你的「我可以」墙里挑一条证据，读一遍并写下一句感受。',
  };
}

/** 占位：AI 生成的本周自信总结（必须引用 ≥2 条具体证据） */
export function buildWeeklyConfidenceSummary(
  user: UserProfile,
  evidences: EvidenceItem[]
): string {
  const picks = evidences.slice(0, 2);
  if (picks.length < 2) {
    return `${user.name}，这周你开始建立证据了。等再多积累几条，我就能为你写出更具体的自信总结。`;
  }
  return `${user.name}，这周我看到了两条具体证据：一是「${picks[0].title}」（${picks[0].detail}），二是「${picks[1].title}」（${picks[1].detail}）。它们不是空泛的鼓励，而是你真实做出来的事——请把它们记住。`;
}
