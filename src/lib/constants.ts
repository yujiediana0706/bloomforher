import type { EvidenceType, LifeStage } from './types';

// —— 生活阶段文案（规范 §5.5 节奏标签）——
export const LIFE_STAGE_LABELS: Record<LifeStage, string> = {
  student: '在校探索',
  early_career: '职场新人',
  growth: '职场深耕',
  pregnancy_planning: '孕前深耕',
  parental_leave: '育儿期',
  returning_parent: '产后回归',
  parttime_transition: '兼职过渡',
};

export const LIFE_STAGE_DESCRIPTIONS: Record<LifeStage, string> = {
  student: '在校大学生 / 研究生，正在探索 AI 职业方向',
  early_career: '初入职场 1-3 年，希望尽早切入 AI',
  growth: '已在职场深耕，寻求向 AI 岗位跃迁',
  pregnancy_planning: '处于备孕阶段，希望提前布局 AI 能力',
  parental_leave: '正在育儿/休假中，需要可中断的学习节奏',
  returning_parent: '产后回归，1-3 年职业空窗后重返职场',
  parttime_transition: '需要兼顾照护，寻求灵活/兼职的 AI 过渡',
};

// —— 证据类型文案与自信度权重（规范 §5.8）——
export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  assessment_result: '测评结果',
  skill_progress: '学习进展',
  task_outcome: '任务成果',
  project_work: '实操作品',
  mentor_endorsement: '导师背书',
  community_kudos: '同辈认可',
  peer_appreciation: '同辈感谢',
  milestone: '里程碑',
};

export const EVIDENCE_TYPE_WEIGHTS: Record<EvidenceType, number> = {
  mentor_endorsement: 8,
  peer_appreciation: 6,
  assessment_result: 6,
  project_work: 6,
  milestone: 5,
  task_outcome: 3,
  skill_progress: 3,
  community_kudos: 2,
};

export const CONFIDENCE_BASE = 40;
export const CONFIDENCE_MAX = 100;

/** 根据证据列表计算自信度分数（起始 40，上限 100） */
export function computeConfidenceScore(
  evidences: { type: EvidenceType }[]
): number {
  let score = CONFIDENCE_BASE;
  for (const ev of evidences) {
    score += EVIDENCE_TYPE_WEIGHTS[ev.type] ?? 0;
  }
  return Math.min(CONFIDENCE_MAX, score);
}

// —— 匿名花名池 ——
export const ANONYMOUS_HANDLES = [
  '山茶花',
  '银杏叶',
  '木棉',
  '蒲公英',
  '紫藤',
  '玉兰',
  '腊梅',
  '芍药',
  '铃兰',
  '鸢尾',
  '海棠',
  '栀子',
];

/** 稳定地根据 (uid + postId) 生成同一花名 */
export function pickAnonymousHandle(uid: string, salt: string): string {
  let hash = 0;
  const input = `${uid}::${salt}`;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) % 100000;
  }
  return `匿名·${ANONYMOUS_HANDLES[hash % ANONYMOUS_HANDLES.length]}`;
}

// —— 旅程步骤定义 ——
export const JOURNEY_STEPS = [
  { step: 1, label: '注册与目标', href: '/onboarding' },
  { step: 2, label: '技能发现', href: '/skills' },
  { step: 3, label: 'AI 机会', href: '/opportunities' },
  { step: 4, label: '实操任务', href: '/tasks-lab' },
  { step: 5, label: '回归计划', href: '/plan' },
  { step: 6, label: '加入社区', href: '/plaza' },
] as const;

// —— 主导航（AI Mentor 是核心工作台；技能/机会/计划为诊断详情，从 Mentor 看板进入）——
export const NAV_ITEMS = [
  { href: '/', label: '首页', extra: false },
  { href: '/coach', label: 'AI Mentor', extra: false },
  { href: '/plaza', label: '对话广场', extra: false },
  { href: '/skills', label: '技能画像', extra: true },
  { href: '/opportunities', label: 'AI 机会', extra: true },
  { href: '/plan', label: '回归计划', extra: true },
  { href: '/tasks-lab', label: '实操任务', extra: true },
  { href: '/community', label: '导师社区', extra: true },
  { href: '/my-sessions', label: '我的预约', extra: true },
  { href: '/dashboard', label: '个人中心', extra: false },
] as const;
