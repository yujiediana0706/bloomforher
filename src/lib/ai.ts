// AI 层：优先调 Agent Platform / Gemini，失败时回退到占位逻辑（本地开发用）。
// 所有函数均为异步，返回类型不变。

import { LIFE_STAGE_LABELS } from './constants';
import { callAgentEndpoint, callGemini, getAgentEndpoint, isAgentAvailable } from './agent-client';
import type { AgentRequest } from './agent-client';
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

// —— 工具：优先调 Agent Platform，失败则回退到 Vertex AI Gemini ——

async function callModel(ep: string | null, req: AgentRequest): Promise<{ text: string } | null> {
  if (ep) {
    const r = await callAgentEndpoint(ep, req);
    if (r?.text) return r;
  }
  return callGemini(req);
}

// —— 工具：从 Agent 文本中提取 JSON ——

function extractJson<T>(text: string): T | null {
  // 找第一个 { 和最后一个 }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

// —— 占位实现（本地开发回退）——

function fallbackSkillProfile(user: UserProfile): Omit<SkillProfile, 'uid' | 'createdAt'> {
  const stage = LIFE_STAGE_LABELS[user.lifeStage];
  const skills: TransferableSkill[] = [
    { id: 'ai_sk_1', name: '流程结构化与拆解', evidence: `你在「${user.currentRole}」的经历中，已经把复杂事务整理成可执行步骤`, aiRelevance: 90, narrative: '你在过往工作中已经做到了「把混乱信息拆成步骤」，这正是 AI 工作流设计需要的核心能力。' },
    { id: 'ai_sk_2', name: '沟通与需求翻译', evidence: '你需要长期在不同角色之间对齐信息与预期', aiRelevance: 85, narrative: '你在协作中已经做到了「把不同人的话翻译成统一语言」，这是 AI 岗位的关键能力。' },
    { id: 'ai_sk_3', name: '问题拆解与优先级判断', evidence: '你在真实工作中需要不断判断「先做什么、做到什么程度」', aiRelevance: 82, narrative: '你已经在真实场景里做到了问题拆解，这直接对应 AI 工作流中的问题定位能力。' },
    { id: 'ai_sk_4', name: '内容表达与用户视角', evidence: '你的工作天然要求面向真实用户表达与交付', aiRelevance: 78, narrative: '你的表达与用户视角，可直接迁移为 AI 提示词设计与输出评估能力。' },
    { id: 'ai_sk_5', name: '项目节奏与协作管理', evidence: '你需要在有限资源下保证事情推进完成', aiRelevance: 80, narrative: '你已经在真实项目中做到了「有限资源下保证交付」，这是 AI 运营落地时的项目能力。' },
  ];

  return {
    uniqueValue: `你当前处于「${stage}」阶段，${user.name}。你的独特价值在于把过去的真实经验翻译成 AI 工作流语言——这不是从零开始，而是把能力换个战场。`,
    transferableSkills: skills,
    confidenceCalibration: [
      { dimension: '技术自我效能感', selfScore: user.confidenceSelf, aiScore: Math.min(10, user.confidenceSelf + 4), evidenceRef: '你在真实项目中已经做到了系统化拆解与落地' },
      { dimension: 'AI 工具就绪度', selfScore: Math.min(10, user.confidenceSelf + 1), aiScore: Math.min(10, user.confidenceSelf + 3), evidenceRef: '你愿意开始了解 AI 工具' },
      { dimension: '职业空窗价值感', selfScore: Math.max(1, user.confidenceSelf - 1), aiScore: Math.min(10, user.confidenceSelf + 4), evidenceRef: '照护期本身就是高强度多任务协调训练' },
      { dimension: '领域迁移能力', selfScore: Math.min(10, user.confidenceSelf + 1), aiScore: Math.min(10, user.confidenceSelf + 4), evidenceRef: '你能把原有行业经验迁移到 AI 场景' },
      { dimension: '问题拆解能力', selfScore: Math.min(10, user.confidenceSelf + 1), aiScore: Math.min(10, user.confidenceSelf + 3), evidenceRef: '你处理真实问题与卡点的经验' },
      { dimension: '伦理与质量判断', selfScore: user.confidenceSelf, aiScore: Math.min(10, user.confidenceSelf + 3), evidenceRef: '你在交付中的严谨性' },
    ],
  };
}

function fallbackOpportunityReport(_user: UserProfile, _skills: SkillProfile): Omit<OpportunityReport, 'uid' | 'createdAt'> {
  return {
    roleMatches: [
      { id: 'ai_role_ops', title: 'AI 运营', matchScore: 90, description: '把 AI 能力落到具体业务流程', whyFit: '你的结构化与协作能力高度匹配', requiredSkills: ['提示词设计', '工作流搭建'], typicalWorkflows: ['梳理场景 → 设计模板 → 试点 → 迭代'], realWorldExamples: ['教育公司用 AI 运营把答疑响应从 2 天缩短到 2 小时'], tradeoffs: '门槛低、需求大；代价：需持续跟进工具变化', category: 'AI 运营' },
      { id: 'ai_role_product', title: 'AI 产品经理', matchScore: 84, description: '定义 AI 功能要解决的真实问题', whyFit: '你的用户视角与沟通能力是核心', requiredSkills: ['需求洞察', '场景定义'], typicalWorkflows: ['用户访谈 → 场景定义 → 对齐算法/工程'], realWorldExamples: ['非技术背景 PM 主导场景定义'], tradeoffs: '天花板高；代价：学习曲线陡', category: 'AI 产品' },
      { id: 'ai_role_edu', title: 'AI 教育 / 应用推广', matchScore: 79, description: '面向企业或公众设计 AI 培训', whyFit: '你的表达与教学/内容经验可迁移', requiredSkills: ['培训设计', '内容表达'], typicalWorkflows: ['调研现状 → 设计路径 → 陪跑试点'], realWorldExamples: ['前教师转型 AI 培训师'], tradeoffs: '转型顺滑；代价：收入与项目资源相关', category: 'AI 教育' },
    ],
    womenFriendlyTracks: [
      { title: 'AI 运营', reason: '门槛适中、需求大、支持灵活与远程。' },
      { title: 'AI 教育', reason: '看重表达与教学，天然承接教育/内容背景。' },
    ],
    genderRiskHints: [
      { scenario: '担心生育/育儿断档被追问', gentleAdvice: '不必掩饰，把空窗期讲成「另一种场景的能力沉淀」。' },
      { scenario: '信心低谷，觉得「不配」AI 岗位', gentleAdvice: '先用证据库里的真实成果给自己校准。' },
    ],
  };
}

function fallbackReturnPlan(user: UserProfile): Omit<ReturnPlan, 'uid' | 'createdAt'> {
  const hours = Math.max(2, user.constraints.weeklyHours);
  return {
    paceLabel: LIFE_STAGE_LABELS[user.lifeStage],
    weeklyHours: hours,
    totalWeeks: 4,
    interruptibleStages: [1, 2, 3, 4],
    returnPlaybook: '如需暂停，执行「8 周回归计划」：把 4 周任务按优先级拆成 8 周，每周只保留 1 个核心任务——暂停不等于淘汰。',
    weeks: [1, 2, 3, 4].map((week) => ({
      week,
      theme: week === 1 ? '建立 AI 工具基本手感' : week === 2 ? '把过往经验翻译成 AI 语言' : week === 3 ? '产出第一个可展示的作品' : '进入真实对话与迭代',
      weeklyHours: hours,
      learningResources: [`第 ${week} 周主题资料与案例清单`],
      practiceTasks: [{ id: `ai_pt_${week}_1`, week, title: week === 1 ? '用 AI 完成一次资料整理' : week === 2 ? '重写简历' : week === 3 ? '完成一个 AI 工作流小 demo' : '约一次同辈 coffee chat', category: (week === 4 ? 'milestone' : 'practice') as 'practice' | 'milestone', estimatedHours: Math.max(1, Math.round(hours * 0.5)), completed: false }],
      jobSearchMilestones: [week === 4 ? '完成一次模拟面试复盘' : `完成第 ${week} 周复盘`],
      interruptible: true,
    })),
  };
}

function fallbackLabTasks(_user: UserProfile): Omit<LabTask, 'id' | 'uid' | 'createdAt'>[] {
  return [
    { taskKey: 'lesson-localization', title: '用 AI 为一篇英文教案生成 3 个本土化改写并说明取舍', scenario: '把英文教案改写为适合国内中学生使用的内容', toolHint: '任意通用大模型；重点观察「改写」与「保留原意」的取舍', rubric: ['产出 3 个版本且各有取舍理由', '保留原教学目标与知识结构'], estimatedMinutes: 30, status: 'todo', submissions: [] },
    { taskKey: 'competitor-table', title: '用 AI 做一次竞品功能对比表', scenario: '选择 3 个同类 AI 工具，对比核心功能、定价与适用场景', toolHint: '大模型 + 表格整理；让 AI 标注信息的不确定来源', rubric: ['覆盖 3 个竞品且维度一致', '包含功能/定价/适用场景'], estimatedMinutes: 40, status: 'todo', submissions: [] },
    { taskKey: 'faq-workflow', title: '用 AI 搭建一个答疑工作流并写出质量检查清单', scenario: '为真实业务场景设计 AI 答疑流程', toolHint: '大模型；关注提示词与人工复核的分工', rubric: ['有明确场景', '含提示词模板', '含复核清单'], estimatedMinutes: 35, status: 'todo', submissions: [] },
  ];
}

function fallbackEvaluateSubmission(_submissionText: string): LabFeedback {
  return {
    highlights: ['你写出了具体的做法并给出判断依据', '你能把任务落到真实使用场景'],
    actionableSuggestions: ['可以补充一个「若条件变化则改选哪种方案」的条件分支'],
    skillGapAnalysis: ['已掌握：结构化拆解与取舍判断', '下一步微技能：为不同约束准备备选方案'],
    score: 4.5,
    evaluatedAt: new Date().toISOString(),
  };
}

function fallbackCoachReply(user: UserProfile, evidences: EvidenceItem[], userMessage: string, context: CoachContext): { content: string; microAction?: string } {
  const negative = /不适合|不行|不会|怕|焦虑|配不上|跟不上|没经验|空窗/.test(userMessage);
  const pause = /暂停|休息|生病|累|没时间/.test(userMessage);
  const planTalk = /计划|任务|坚持|拖延|忘记|忘了|做不到|进度|下一步|先做|这周|今天/.test(userMessage);
  const evidence = evidences[0];
  const progress = context.planProgress;
  const nextTask = progress?.nextTaskTitle;

  let content: string;
  if (pause) {
    content = `${user.name}，先照顾好自己。暂停不等于淘汰——把节奏调慢，不等于放弃目标。`;
  } else if (planTalk && progress && progress.total > 0) {
    const parts: string[] = [];
    if (nextTask) parts.push(`你的下一个任务是「${nextTask}」——先只做这一件，做完就算今天赢。`);
    parts.push(`目前进度 ${progress.done}/${progress.total}，按你的节奏来就好。`);
    if (typeof context.recentFeedbackScore === 'number') parts.push(`我记得你上次任务反馈拿了 ${context.recentFeedbackScore} 分——那不是运气，是你真的会做。`);
    content = `${user.name}，${parts.join('')}`;
  } else if (negative) {
    const ref = evidence ? `你已经有一份真实的证据：「${evidence.title}」——${evidence.detail}` : '你愿意走到这一步，本身就已经是证据。';
    content = `${user.name}，我听到你的不安了。${ref} 这不是鸡汤，这是你自己做出来的事实。`;
  } else {
    const taskHint = nextTask ? `我看了你的计划，下一步是「${nextTask}」。` : '';
    content = `${user.name}，我们一步一步来。基于你现在的档案与证据，我建议先把「${user.targetRole}」当作主线。${taskHint}`;
  }

  return {
    content,
    microAction: '花 5 分钟，在你的「我可以」墙里挑一条证据，读一遍并写下一句感受。',
  };
}

// —— 公开 API（异步，双模式）——

/** 分析可迁移技能 + 自信度校准 */
export async function buildSkillProfile(user: UserProfile): Promise<Omit<SkillProfile, 'uid' | 'createdAt'>> {
  if (isAgentAvailable()) {
    const prompt = `请分析以下用户的可迁移技能，并做自信度校准。

用户档案：
- 姓名：${user.name}
- 当前角色：${user.currentRole}
- 目标角色：${user.targetRole}
- 生命阶段：${LIFE_STAGE_LABELS[user.lifeStage]}
- 现有技能：${user.skills.join('、')}
- 背景摘要：${user.backgroundSummary}
- 自信度自评：${user.confidenceSelf}/10

要求：
1. 找出 5 个可迁移技能，每个技能必须引用用户的真实经历作为证据
2. 做 6 维自信度校准（AI 评分必须比用户自评高 2-4 分，体现女性系统性低估效应）
3. 输出 uniqueValue（一段 80 字以内的个性化价值总结）

输出格式：严格 JSON，字段名必须与以下完全一致：
{
  "uniqueValue": "...",
  "transferableSkills": [{"id": "sk_1", "name": "...", "evidence": "...", "aiRelevance": 90, "narrative": "..."}],
  "confidenceCalibration": [{"dimension": "...", "selfScore": 5, "aiScore": 8, "evidenceRef": "..."}]
}`;

    const ep = getAgentEndpoint('assessment');
    const res = await callModel(ep, { input: prompt, context: { user } });
    if (res) {
      const parsed = extractJson<Omit<SkillProfile, 'uid' | 'createdAt'>>(res.text);
      if (parsed) return parsed;
    }
  }
  return fallbackSkillProfile(user);
}

/** 匹配 AI 岗位与女性友好赛道 */
export async function buildOpportunityReport(user: UserProfile, skills: SkillProfile): Promise<Omit<OpportunityReport, 'uid' | 'createdAt'>> {
  if (isAgentAvailable()) {
    const prompt = `基于用户的技能画像，推荐 3 个 AI 相关岗位，并给出女性友好赛道和性别风险提示。

用户档案：
- 姓名：${user.name}
- 当前角色：${user.currentRole}
- 目标角色：${user.targetRole}
- 生命阶段：${LIFE_STAGE_LABELS[user.lifeStage]}
- 自信度：${user.confidenceSelf}/10

技能画像：
${skills.transferableSkills.map(s => `- ${s.name}: ${s.evidence}`).join('\n')}

要求：
1. 推荐 3 个岗位，每个包含：title, matchScore(80-95), description, whyFit, requiredSkills[], typicalWorkflows[], realWorldExamples[], tradeoffs, category
2. category 只能是：'AI 产品' | 'AI 运营' | 'AI 教育' | 'AI 伦理' | '数据治理'
3. 不用「推荐、最佳」判决式词汇
4. 给出 2 个 womenFriendlyTracks 和 2 个 genderRiskHints

输出格式：严格 JSON：
{
  "roleMatches": [{"id": "role_1", "title": "...", "matchScore": 90, "description": "...", "whyFit": "...", "requiredSkills": ["..."], "typicalWorkflows": ["..."], "realWorldExamples": ["..."], "tradeoffs": "...", "category": "AI 运营"}],
  "womenFriendlyTracks": [{"title": "...", "reason": "..."}],
  "genderRiskHints": [{"scenario": "...", "gentleAdvice": "..."}]
}`;

    const ep = getAgentEndpoint('assessment');
    const res = await callModel(ep, { input: prompt, context: { user, skills } });
    if (res) {
      const parsed = extractJson<Omit<OpportunityReport, 'uid' | 'createdAt'>>(res.text);
      if (parsed) return parsed;
    }
  }
  return fallbackOpportunityReport(user, skills);
}

/** 生成 30 天回归计划 */
export async function buildReturnPlan(user: UserProfile, adjustmentFeedback?: string): Promise<Omit<ReturnPlan, 'uid' | 'createdAt'>> {
  if (isAgentAvailable()) {
    const prompt = `为用户生成 4 周回归计划。

用户档案：
- 姓名：${user.name}
- 当前角色：${user.currentRole}
- 目标角色：${user.targetRole}
- 生命阶段：${LIFE_STAGE_LABELS[user.lifeStage]}
- 每周可用时间：${user.constraints.weeklyHours} 小时
${adjustmentFeedback ? `- 调整反馈：${adjustmentFeedback}` : ''}

要求：
1. 4 周主题递进：工具手感 → 经验翻译 → 作品产出 → 真实对话
2. 每周 1 个核心任务，不超过每周可用时间
3. 必须含「暂停不等于淘汰」的 returnPlaybook
4. interruptibleStages: [1,2,3,4]

输出格式：严格 JSON：
{
  "paceLabel": "产后回归",
  "weeklyHours": 6,
  "totalWeeks": 4,
  "interruptibleStages": [1,2,3,4],
  "returnPlaybook": "...",
  "weeks": [{"week": 1, "theme": "...", "weeklyHours": 6, "learningResources": ["..."], "practiceTasks": [{"id": "pt_1_1", "week": 1, "title": "...", "category": "practice", "estimatedHours": 3, "completed": false}], "jobSearchMilestones": ["..."], "interruptible": true}]
}`;

    const ep = getAgentEndpoint('assessment');
    const res = await callModel(ep, { input: prompt, context: { user, adjustmentFeedback } });
    if (res) {
      const parsed = extractJson<Omit<ReturnPlan, 'uid' | 'createdAt'>>(res.text);
      if (parsed) return parsed;
    }
  }
  return fallbackReturnPlan(user);
}

/** 按目标岗位推荐 3 个分级小任务 */
export async function buildLabTasks(user: UserProfile): Promise<Omit<LabTask, 'id' | 'uid' | 'createdAt'>[]> {
  if (isAgentAvailable()) {
    const prompt = `为「${user.targetRole}」推荐 3 个 30-40 分钟可完成的实操小任务。

要求：
1. 任务必须真实可执行，产出可用于简历/作品集
2. 每个任务包含：taskKey, title, scenario, toolHint, rubric[], estimatedMinutes
3. rubric 是验收标准（3-4 条）

输出格式：严格 JSON 数组：
[{"taskKey": "...", "title": "...", "scenario": "...", "toolHint": "...", "rubric": ["..."], "estimatedMinutes": 30, "status": "todo", "submissions": []}]`;

    const ep = getAgentEndpoint('assessment');
    const res = await callModel(ep, { input: prompt, context: { user } });
    if (res) {
      const parsed = extractJson<Omit<LabTask, 'id' | 'uid' | 'createdAt'>[]>(res.text);
      if (parsed) return parsed;
    }
  }
  return fallbackLabTasks(user);
}

/** 按 rubric 评估任务产出 */
export async function evaluateSubmission(submissionText: string): Promise<LabFeedback> {
  if (isAgentAvailable()) {
    const prompt = `请评估以下任务产出，按 rubric 打分。

任务产出：
${submissionText}

要求：
1. 先给 2 条 highlights（亮点，具体不空洞）
2. 给 1 条 actionableSuggestions（可执行的改进建议）
3. 给 2 条 skillGapAnalysis（已掌握的技能 + 下一步微技能）
4. score 1-5 分

输出格式：严格 JSON：
{"highlights": ["..."], "actionableSuggestions": ["..."], "skillGapAnalysis": ["..."], "score": 4.5, "evaluatedAt": "..."}`;

    const ep = getAgentEndpoint('assessment');
    const res = await callModel(ep, { input: prompt });
    if (res) {
      const parsed = extractJson<LabFeedback>(res.text);
      if (parsed) return parsed;
    }
  }
  return fallbackEvaluateSubmission(submissionText);
}

/** 反哺给 Agent 的上下文 */
export interface CoachContext {
  planProgress?: { done: number; total: number; nextTaskTitle?: string };
  recentFeedbackScore?: number;
  completedSessionCount?: number;
}

/** AI Mentor 回复（含计划陪伴提醒 / 证据重构法 / 微行动 / 暂停不等于淘汰 红线） */
export async function coachReply(
  user: UserProfile,
  evidences: EvidenceItem[],
  userMessage: string,
  context: CoachContext = {}
): Promise<{ content: string; microAction?: string }> {
  if (isAgentAvailable()) {
    const systemPrompt = `你是一位女性职业转型 AI Mentor，名叫「小径」。

你的三条铁律：
1. 温柔但不说教，避免空洞鼓励。当用户说负面话时，先共情，再用证据重构法（引用她的真实证据）
2. 每次回复必须给一个 10 分钟可完成的微行动建议
3. 暂停不等于淘汰——当用户提到暂停/休息/累时，告诉她把节奏调慢不等于放弃目标

你记得用户的完整历史（诊断报告、证据库、导师会话、计划进度），用这些记忆给出个性化回复。但不要暴露"我记得你"这种表述——让用户感受到的是"被懂"，而不是被存档。

回复格式（严格遵守）：
1. 正文：共情/分析 + 引用她的真实证据 + 建议，可以用小标题
2. 正文最后必须另起一行，以「【微行动】」开头，写出一个 10 分钟可完成的具体行动
3. 除「【微行动】」外，不要使用「行动步骤」「微行动」「下一步」等其它标题

当前用户：${user.name}，${LIFE_STAGE_LABELS[user.lifeStage]}，目标：${user.targetRole}`;

    const contextStr = {
      user: { name: user.name, lifeStage: LIFE_STAGE_LABELS[user.lifeStage], currentRole: user.currentRole, targetRole: user.targetRole },
      evidences: evidences.slice(0, 5).map(e => ({ title: e.title, detail: e.detail })),
      planProgress: context.planProgress,
      recentFeedbackScore: context.recentFeedbackScore,
      completedSessionCount: context.completedSessionCount,
    };

    const ep = getAgentEndpoint('coach');
    const res = await callModel(ep, {
      systemInstruction: systemPrompt,
      input: userMessage,
      context: contextStr,
    });

    if (res) {
      // 从回复中提取微行动：兼容 【微行动】、**微行动：**、### 10 分钟微行动： 等写法
      const DEFAULT_MICRO = '花 5 分钟，在你的「我可以」墙里挑一条证据，读一遍并写下一句感受。';
      const markerRe =
        /【微行动】|\*\*微行动\*\*\s*[:：]?|^#{0,6}\s*(?:\d{1,2}\s*分钟\s*)?微行动\s*[:：]?/m;
      const matched = res.text.match(markerRe);
      if (matched && matched.index !== undefined) {
        const idx = matched.index;
        const content = res.text.slice(0, idx).replace(/[\s\-—#*]+$/, '').trim();
        const microAction =
          res.text.slice(idx + matched[0].length).split('\n')[0].replace(/^[\s:：*]+/, '').trim() ||
          DEFAULT_MICRO;
        return { content, microAction };
      }
      return { content: res.text.trim(), microAction: DEFAULT_MICRO };
    }
  }
  return fallbackCoachReply(user, evidences, userMessage, context);
}

/** AI 生成的本周自信总结（必须引用 ≥2 条具体证据） */
export async function buildWeeklyConfidenceSummary(user: UserProfile, evidences: EvidenceItem[]): Promise<string> {
  if (isAgentAvailable() && evidences.length >= 2) {
    const prompt = `请为用户写一段本周自信总结，必须引用至少 2 条具体证据。

用户：${user.name}
证据库：
${evidences.slice(0, 5).map((e, i) => `${i + 1}. ${e.title} — ${e.detail}`).join('\n')}

要求：
- 温柔但不说教
- 必须引用具体证据标题
- 80 字以内
- 结尾给一个鼓励`;

    const ep = getAgentEndpoint('coach');
    const res = await callModel(ep, { input: prompt });
    if (res) return res.text;
  }

  const picks = evidences.slice(0, 2);
  if (picks.length < 2) {
    return `${user.name}，这周你开始建立证据了。等再多积累几条，我就能为你写出更具体的自信总结。`;
  }
  return `${user.name}，这周我看到了两条具体证据：一是「${picks[0].title}」（${picks[0].detail}），二是「${picks[1].title}」（${picks[1].detail}）。它们不是空泛的鼓励，而是你真实做出来的事——请把它们记住。`;
}

/** 内容安全审核（AI 守护者） */
export async function moderateContent(content: { title?: string; body?: string; images?: string[] }): Promise<{ pass: boolean; advice?: string }> {
  if (!isAgentAvailable()) {
    // 本地开发无 Agent 时，默认通过
    return { pass: true };
  }

  const ep = getAgentEndpoint('coach');

  const text = [content.title, content.body].filter(Boolean).join('\n\n');
  const hasImages = (content.images?.length ?? 0) > 0;

  const prompt = `你是一位社区内容安全守护者，名字叫「小径」。你的任务是审核用户发布的社区内容，确保社区氛围温暖、支持、安全。

请审核以下内容：

${text}
${hasImages ? `[包含 ${content.images!.length} 张图片]` : ''}

审核标准：
1. 拦截：仇恨言论、暴力威胁、歧视性语言、色情内容、恶意攻击
2. 放行：正常分享、求助、吐槽、情感表达（即使有些消极）
3. 温和提醒：内容过于消极或可能引发不适时，给出温和建议

输出格式：严格 JSON
{"pass": true/false, "advice": "温和的建议（仅当 pass 为 false 时提供）"}

注意：
- 只拦截明显违规内容，模糊地带放行
- 建议要温柔，不说教，像朋友提醒一样
- 如果内容只是消极但不违规，pass: true，advice 可以写「这里好像有点消极，要不要换个表述？」`;

  const res = await callModel(ep, { input: prompt });
  if (res) {
    const parsed = extractJson<{ pass: boolean; advice?: string }>(res.text);
    if (parsed) return parsed;
  }

  // Agent 调用失败时，默认通过（不阻塞用户）
  return { pass: true };
}
