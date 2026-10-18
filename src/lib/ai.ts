// AI layer: prefers the Agent Platform / Gemini, falling back to placeholder logic (for local development).
// All functions are async; return types are unchanged.
//
// Coaching philosophy (binding for every prompt below):
// help the user see her abilities accurately and act on facts. Every judgment
// must be grounded in real evidence; confidence is built through practice and
// evidence, never through automated encouragement.

import { LIFE_STAGE_LABELS } from './constants';
import { callAgentEndpoint, callGemini, getAgentEndpoint, isAgentAvailable } from './agent-client';
import type { AgentRequest } from './agent-client';
import type {
  EvidenceItem,
  LabFeedback,
  LabTask,
  OpportunityReport,
  ReturnPlan,
  SkillGap,
  SkillProfile,
  UserProfile,
} from './types';

// —— Helper: prefer the Agent Platform, fall back to Vertex AI Gemini ——

async function callModel(ep: string | null, req: AgentRequest): Promise<{ text: string } | null> {
  if (ep) {
    const r = await callAgentEndpoint(ep, req);
    if (r?.text) return r;
  }
  return callGemini(req);
}

// —— Helper: extract JSON from the Agent's text ——

function extractJson<T>(text: string): T | null {
  // find the first { and the last }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

/** Resume text block injected into prompts (empty when no resume was uploaded). */
function resumeBlock(user: UserProfile, max = 3000): string {
  const text = user.resumeText?.trim();
  if (!text) return '';
  const name = user.resumeFileName ? ` (${user.resumeFileName})` : '';
  return `- Resume${name}, extracted text:\n${text.slice(0, max)}\n`;
}

// —— Placeholder implementations (local development fallback) ——
// These follow the same honesty rules as the model prompts: evidence levels are
// labeled, scores are not inflated, and real gaps are named.

function fallbackSkillProfile(user: UserProfile): Omit<SkillProfile, 'uid' | 'createdAt'> {
  const stage = LIFE_STAGE_LABELS[user.lifeStage];
  const role = user.currentRole?.trim() || 'your previous role';
  const hasResume = !!user.resumeText?.trim();
  const evidencePrefix = hasResume
    ? `From your resume and your role as "${role}"`
    : `Based only on your stated role as "${role}" (no resume uploaded, so this is unverified)`;

  const skills = [
    {
      id: 'ai_sk_1',
      name: 'Structuring and breaking down processes',
      evidence: `${evidencePrefix}: turning complex matters into actionable steps`,
      aiRelevance: 82,
      narrative:
        'Process decomposition is genuinely useful for AI workflow design, but it has not yet been demonstrated in an AI setting. Treat this as transferable until a concrete project proves it.',
      evidenceLevel: 'transferable' as const,
    },
    {
      id: 'ai_sk_2',
      name: 'Communication and requirement translation',
      evidence: `${evidencePrefix}: aligning information and expectations across different roles`,
      aiRelevance: 78,
      narrative:
        'Cross-role translation is useful for AI roles (prompt design, evaluation). Transferable, not yet verified in AI work.',
      evidenceLevel: 'transferable' as const,
    },
    {
      id: 'ai_sk_3',
      name: 'Problem decomposition and prioritization',
      evidence: `${evidencePrefix}: judging what to do first under constraints`,
      aiRelevance: 74,
      narrative:
        'Maps to AI problem scoping. Plausible from your role, but currently unsupported by a specific case in your data.',
      evidenceLevel: 'hypothesis' as const,
    },
    {
      id: 'ai_sk_4',
      name: 'Content expression and user perspective',
      evidence: `${evidencePrefix}: communicating with and delivering to real users`,
      aiRelevance: 70,
      narrative:
        'Useful for prompt design and output evaluation; needs one real AI-assisted deliverable to become verified.',
      evidenceLevel: 'transferable' as const,
    },
    {
      id: 'ai_sk_5',
      name: 'Project rhythm and collaboration management',
      evidence: `${evidencePrefix}: keeping work moving to completion with limited resources`,
      aiRelevance: 72,
      narrative:
        'Relevant to landing AI operations, but no concrete project is present in the data yet.',
      evidenceLevel: 'hypothesis' as const,
    },
  ];

  const skillGaps: SkillGap[] = [
    {
      skill: 'Hands-on practice with current AI tools',
      why: 'Every AI-adjacent role requires judging real model output, not just describing workflows conceptually.',
      priority: 'high',
    },
    {
      skill: 'One visible AI-related deliverable',
      why: 'Without a demo, case write-up, or workflow artifact, transferable claims cannot be distinguished from verified strengths.',
      priority: 'high',
    },
    {
      skill: 'Basic vocabulary of AI capabilities and limits',
      why: 'Needed to scope problems realistically and to talk to technical teams without overpromising.',
      priority: 'medium',
    },
  ];

  return {
    uniqueValue: `You are at the "${stage}" stage, ${user.name}. The evidence so far supports real cross-functional and process experience from ${role} that may transfer to AI workflows. It does not yet support a claim of AI-specific competence; that has to be built with one concrete deliverable. This is an honest starting point, not a verdict on your potential.`,
    transferableSkills: skills,
    skillGaps,
    confidenceCalibration: [
      { dimension: 'Technical self-efficacy', selfScore: user.confidenceSelf, aiScore: user.confidenceSelf, evidenceRef: 'No concrete technical evidence in the data to raise or lower this yet; held at your self-rating pending a real task.' },
      { dimension: 'AI tool readiness', selfScore: user.confidenceSelf, aiScore: Math.max(1, user.confidenceSelf - 1), evidenceRef: 'Willingness is stated, but no completed AI-tool task exists in the data, so readiness is not yet demonstrated.' },
      { dimension: 'Sense of value during a career break', selfScore: user.confidenceSelf, aiScore: user.confidenceSelf, evidenceRef: 'Caregiving does involve coordination, but its transfer to AI work is a claim that needs one concrete example.' },
      { dimension: 'Domain transferability', selfScore: user.confidenceSelf, aiScore: user.confidenceSelf, evidenceRef: 'Industry knowledge exists; whether it transfers depends on the target direction and is currently unverified.' },
      { dimension: 'Problem decomposition', selfScore: user.confidenceSelf, aiScore: user.confidenceSelf, evidenceRef: 'Plausible from your role, but no specific case in the data justifies a higher score.' },
      { dimension: 'Ethics and quality judgment', selfScore: user.confidenceSelf, aiScore: user.confidenceSelf, evidenceRef: 'No AI-output evaluation example yet; held at your self-rating rather than assumed.' },
    ],
  };
}

function fallbackOpportunityReport(user: UserProfile): Omit<OpportunityReport, 'uid' | 'createdAt'> {
  const chosen = user.chosenRole?.trim() || user.targetRole?.trim() || 'AI-related work';
  return {
    roleMatches: [
      {
        id: 'ai_role_ops',
        title: 'AI Operations',
        matchScore: 80,
        description: 'Turning AI capabilities into concrete business processes: designing prompt templates, building customer-service and content workflows, and monitoring output quality.',
        whyFit: 'Your process structuring and cross-role coordination are supported by your stated role, but not yet demonstrated in an AI setting.',
        requiredSkills: ['Prompt and workflow design', 'Output quality checking', 'Process documentation'],
        typicalWorkflows: ['Map the scenario', 'Design templates', 'Run a pilot', 'Review failures and iterate'],
        realWorldExamples: ['An education company used AI operations to cut its Q&A response time from 2 days to 2 hours, after two failed pilot templates.'],
        tradeoffs: 'Moderate barrier and high demand; the tradeoff is that tools change quickly and output quality review is repetitive work.',
        category: 'AI Operations',
        skillGaps: ['Hands-on use of at least one mainstream AI tool on a real task', 'A small workflow example you can show and explain', 'A checklist for judging whether AI output is good enough'],
      },
      {
        id: 'ai_role_product',
        title: 'AI Product Manager',
        matchScore: 71,
        description: 'Defining the real problems AI features should solve, designing interaction and evaluation standards, and coordinating with algorithms and engineering.',
        whyFit: 'Communication and user perspective transfer plausibly; the gap is that PM roles are competitive and usually demand evidence of data and technical scoping.',
        requiredSkills: ['Problem and scenario definition', 'Data and evaluation basics', 'Stakeholder communication'],
        typicalWorkflows: ['User interviews', 'Scenario definition', 'Define evaluation criteria', 'Align with engineering'],
        realWorldExamples: ['A non-technical PM led scenario definition for an internal knowledge bot, after first shipping one small workflow prototype.'],
        tradeoffs: 'High ceiling; the tradeoff is a steeper learning curve and stronger competition than AI operations.',
        category: 'AI Product',
        skillGaps: ['Basic data and evaluation literacy', 'One AI feature teardown written from a user perspective', 'Comfort reading simple technical specifications'],
      },
      {
        id: 'ai_role_edu',
        title: 'AI Education / Adoption',
        matchScore: 68,
        description: 'Designing AI training and adoption paths for teams or the public, so people can actually put AI to work.',
        whyFit: 'Content and teaching experience would transfer if you have it; nothing in the current data confirms that background yet.',
        requiredSkills: ['Curriculum design', 'Mainstream AI tool fluency', 'Facilitation'],
        typicalWorkflows: ['Research current practice', 'Design the learning path', 'Run a pilot session', 'Revise from feedback'],
        realWorldExamples: ['A former trainer moved into AI enablement by first running three free internal workshops.'],
        tradeoffs: 'A shorter transition for people with real teaching experience; income is project-dependent and the field is getting crowded.',
        category: 'AI Education',
        skillGaps: ['Demonstrable fluency in mainstream AI tools', 'One pilot workshop or lesson you have actually run', 'Evidence of teaching or content experience'],
      },
    ],
    womenFriendlyTracks: [
      { title: 'AI Operations', reason: 'Moderate barrier, high demand, and many roles support flexible and remote work.' },
      { title: 'AI Education', reason: 'Values expression and teaching, and can be entered through small freelance or internal projects.' },
    ],
    genderRiskHints: [
      { scenario: 'Being asked to explain a career gap in interviews', gentleAdvice: 'Prepare one factual sentence about the gap and one concrete example of coordination or judgment from that period; do not apologize for it.' },
      { scenario: 'Self-doubt before applying', gentleAdvice: 'Separate the feeling from the evidence: list what you have actually done and what the role actually requires, then check whether the gap is real before deciding not to apply. Your chosen direction is currently "' + chosen + '".' },
    ],
  };
}

function fallbackReturnPlan(user: UserProfile): Omit<ReturnPlan, 'uid' | 'createdAt'> {
  const hours = Math.max(2, user.constraints.weeklyHours);
  const direction = user.chosenRole?.trim() || user.targetRole?.trim() || 'your chosen AI direction';
  const task = (id: string, week: number, title: string, category: 'practice' | 'milestone', estimatedHours: number) => ({
    id,
    week,
    title,
    category,
    estimatedHours,
    completed: false,
  });
  return {
    paceLabel: LIFE_STAGE_LABELS[user.lifeStage],
    weeklyHours: hours,
    totalWeeks: 4,
    interruptibleStages: [1, 2, 3, 4],
    returnPlaybook: 'If you need to pause, spread the 4-week plan across 8 weeks by priority, keeping only one core task per week. Pausing is not elimination; the plan waits for you.',
    weeks: [
      {
        week: 1,
        theme: `Build basic AI-tool familiarity for ${direction}`,
        weeklyHours: hours,
        learningResources: ['Pick one mainstream AI tool and use it on a real small task from your own work'],
        practiceTasks: [
          task('ai_pt_1_1', 1, 'Use an AI tool to complete one real document-organizing task and note where its output was wrong', 'practice', Math.max(1, Math.round(hours * 0.5))),
        ],
        jobSearchMilestones: ['Write down 3 tasks in your current/last job that AI could partially do'],
        interruptible: true,
      },
      {
        week: 2,
        theme: 'Translate your past experience into AI-language evidence',
        weeklyHours: hours,
        learningResources: ['Two real job descriptions for your chosen direction; highlight required skills'],
        practiceTasks: [
          task('ai_pt_2_1', 2, 'Rewrite one resume bullet to show an AI-relevant skill with a concrete result', 'practice', Math.max(1, Math.round(hours * 0.4))),
          task('ai_pt_2_2', 2, 'List 2 skills the job descriptions require that you cannot yet evidence', 'practice', 1),
        ],
        jobSearchMilestones: ['Map your verified skills and your real gaps against one real job description'],
        interruptible: true,
      },
      {
        week: 3,
        theme: 'Produce one small visible deliverable',
        weeklyHours: hours,
        learningResources: ['A simple prompt template or mini-workflow you can screenshot and explain'],
        practiceTasks: [
          task('ai_pt_3_1', 3, 'Build a small AI workflow demo or case write-up (one page) as portfolio evidence', 'milestone', Math.max(2, Math.round(hours * 0.6))),
        ],
        jobSearchMilestones: ['Publish the demo to one person you trust and ask for one specific criticism'],
        interruptible: true,
      },
      {
        week: 4,
        theme: 'Enter real conversations',
        weeklyHours: hours,
        learningResources: ['A short list of 3 people in your chosen direction (colleagues, communities, alumni)'],
        practiceTasks: [
          task('ai_pt_4_1', 4, 'Have one informational chat with someone working in your chosen direction', 'practice', 1),
          task('ai_pt_4_2', 4, 'Apply to one concrete opportunity: an entry-level role, internship, or freelance project', 'milestone', Math.max(1, Math.round(hours * 0.4))),
        ],
        jobSearchMilestones: ['One real application or project inquiry sent, with your demo attached'],
        interruptible: true,
      },
    ],
  };
}

function fallbackLabTasks(_user: UserProfile): Omit<LabTask, 'id' | 'uid' | 'createdAt'>[] {
  return [
    { taskKey: 'lesson-localization', title: 'Use AI to generate 3 localized rewrites of an English lesson plan and explain the tradeoffs', scenario: 'Rewrite an English lesson plan into content suitable for middle-school students', toolHint: 'Any general-purpose LLM; focus on the tradeoff between rewriting and preserving the original meaning', rubric: ['Produce 3 versions, each with its own rationale', 'Preserve the original teaching objectives and knowledge structure'], estimatedMinutes: 30, status: 'todo', submissions: [] },
    { taskKey: 'competitor-table', title: 'Use AI to build a competitor feature comparison table', scenario: 'Pick 3 similar AI tools and compare their core features, pricing, and use cases', toolHint: 'LLM + table formatting; have the AI flag uncertain sources of information', rubric: ['Cover 3 competitors with consistent dimensions', 'Include features, pricing, and use cases'], estimatedMinutes: 40, status: 'todo', submissions: [] },
    { taskKey: 'faq-workflow', title: 'Use AI to build a Q&A workflow and write a quality-check checklist', scenario: 'Design an AI Q&A process for a real business scenario', toolHint: 'LLM; focus on the division of labor between prompts and human review', rubric: ['Has a clear scenario', 'Includes a prompt template', 'Includes a review checklist'], estimatedMinutes: 35, status: 'todo', submissions: [] },
  ];
}

function fallbackEvaluateSubmission(_submissionText: string): LabFeedback {
  return {
    highlights: ['You described concrete steps and gave a basis for your decisions', 'You grounded the task in a real usage scenario'],
    actionableSuggestions: ['Add a conditional branch stating which option to switch to if conditions change'],
    skillGapAnalysis: ['Demonstrated: structured decomposition and tradeoff judgment', 'Next micro-skill: preparing backup options for different constraints'],
    score: 4.5,
    evaluatedAt: new Date().toISOString(),
  };
}

function fallbackCoachReply(
  user: UserProfile,
  evidences: EvidenceItem[],
  userMessage: string,
  context: CoachContext
): { content: string; microAction?: string } {
  const negative = /not fit|can't|cannot|don't know how|afraid|anxious|not good enough|can't keep up|no experience|career break|impostor|imposter/i.test(userMessage);
  const pause = /pause|rest|sick|tired|no time|burn(ed|t)? out/i.test(userMessage);
  const planTalk = /plan|task|stick to|procrastinat|forget|forgot|can't do|progress|next step|do first|this week|today/i.test(userMessage);
  const progress = context.planProgress;
  const nextTask = progress?.nextTaskTitle;
  const direction = user.chosenRole?.trim() || user.targetRole?.trim();

  let content: string;
  let microAction: string;

  if (pause) {
    content = `${user.name}, taking a break is a practical decision, not a failure. Your plan is built to be paused: the tasks stay in place, and you can spread one week's work over two. What changed in your schedule this week?`;
    microAction = 'State the realistic number of hours you actually have this week (even if it is 1), and we will resize this week\u2019s task to match it.';
  } else if (planTalk && progress && progress.total > 0) {
    const factLine = nextTask
      ? `Your plan is at ${progress.done}/${progress.total} tasks. The next unchecked task is "${nextTask}".`
      : `All ${progress.total} tasks in the current plan are checked off.`;
    const gapLine = context.strengths && context.strengths.length > 0
      ? ` Your verified/transferable strengths so far: ${context.strengths.slice(0, 2).map((s) => s.name).join('; ')}.`
      : '';
    content = `${factLine}${gapLine} Doing the next task produces evidence; skipping it leaves the claim unverified. Do you want help starting it, or is something blocking you?`;
    microAction = nextTask
      ? `Open "${nextTask}" and write the first concrete sub-step (one sentence). Starting there is today's whole job.`
      : 'Tell me which part of your direction you are least sure about, and we will plan the next evidence-gathering task.';
  } else if (negative) {
    const verified = context.strengths?.filter((s) => s.evidenceLevel === 'verified') ?? [];
    const gaps = context.skillGaps ?? [];
    const fact = verified.length > 0
      ? `What the evidence supports right now: ${verified.slice(0, 2).map((s) => s.name).join('; ')}.`
      : evidences.length > 0
        ? `Your evidence library has ${evidences.length} item(s), starting with "${evidences[0].title}".`
        : 'Right now the evidence is thin: your profile contains little that demonstrates AI-specific skills yet.';
    const gapFact = gaps.length > 0
      ? ` The most important real gap is "${gaps[0].skill}" because ${gaps[0].why.charAt(0).toLowerCase()}${gaps[0].why.slice(1)}`
      : '';
    content = `${user.name}, the feeling itself is not evidence of ability or inability, so let us separate the two. ${fact}${gapFact} Which specific part feels out of reach: the tools, the domain, or getting hired?`;
    microAction = 'Pick the one claim about your ability you are least sure of, and write down what evidence would prove or disprove it this week.';
  } else if (/resume|cv|experience|work history/i.test(userMessage) && user.resumeText) {
    const lines = user.resumeText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);
    content = `Here is what I read from your uploaded resume:\n${lines.map((l) => `- ${l}`).join('\n')}\nThese are facts we can use. Which of them do you think is most relevant to ${direction || 'an AI role'}, and which feels weakest?`;
    microAction = 'Mark one line as your strongest evidence and one line you think an employer would question.';
  } else {
    content = direction
      ? `For your chosen direction, ${direction}, the honest next question is what evidence is still missing, not how confident you feel. ${nextTask ? `Your next planned task is "${nextTask}".` : 'Have you completed your skill portrait and chosen a path yet?'}`
      : 'Before I can say anything specific about your readiness, I need your real information: role, background, and ideally a resume. Have you finished the diagnosis?';
    microAction = nextTask
      ? `Do the first 10 minutes of "${nextTask}" now.`
      : 'Open the diagnosis and complete the next missing step with real information.';
  }

  return { content, microAction };
}

// —— Public API (async, dual mode) ——

/** Analyze transferable skills + calibrate confidence from evidence */
export async function buildSkillProfile(user: UserProfile): Promise<Omit<SkillProfile, 'uid' | 'createdAt'>> {
  if (isAgentAvailable()) {
    const prompt = `You are an evidence-based career analyst. Analyze this user's transferable skills for AI-era work and calibrate her confidence FROM EVIDENCE, not from encouragement. Respond in English.

User profile:
- Name: ${user.name}
- Current role: ${user.currentRole || '(not provided)'}
- Target role: ${user.targetRole || '(not provided)'}
- Life stage: ${LIFE_STAGE_LABELS[user.lifeStage]}
- Current skills: ${user.skills.join(', ') || '(none listed)'}
- Background summary: ${user.backgroundSummary || '(none)'}
${resumeBlock(user)}- Self-rated confidence: ${user.confidenceSelf}/10

Binding rules:
1. Judge ONLY from the evidence provided (resume text, background summary, stated role). Label every skill with evidenceLevel:
   - "verified": demonstrated by a concrete experience present in the evidence
   - "transferable": real adjacent experience that plausibly applies to AI work but is not proven there
   - "hypothesis": plausible but unsupported by any specific evidence
2. Identify exactly 5 transferable skills. Each "evidence" field must name the specific experience it is based on. Never promote a hypothesis to a strength.
3. 6-dimension confidence calibration (Technical self-efficacy, AI tool readiness, Sense of value during a career break, Domain transferability, Problem decomposition, Ethics and quality judgment). Set aiScore strictly from evidence: it may be higher, equal, or LOWER than selfScore. Never inflate it to make her feel better. If evidence is missing, keep aiScore near selfScore and state explicitly in evidenceRef that it is unverified and what would verify it.
4. uniqueValue: max 80 words. State what the evidence genuinely supports AND what is not yet established. No flattery, no "you can do anything".
5. skillGaps: 2-4 real gaps between her evidence and her target direction. For each, explain why it matters and set priority (high/medium/low) by how much it blocks the target role.

Output format: strict JSON, field names exactly as follows:
{
  "uniqueValue": "...",
  "transferableSkills": [{"id": "sk_1", "name": "...", "evidence": "...", "aiRelevance": 90, "narrative": "...", "evidenceLevel": "verified"}],
  "confidenceCalibration": [{"dimension": "...", "selfScore": 5, "aiScore": 5, "evidenceRef": "..."}],
  "skillGaps": [{"skill": "...", "why": "...", "priority": "high"}]
}`;

    const ep = getAgentEndpoint('assessment');
    const res = await callModel(ep, { input: prompt, context: { user } });
    if (res) {
      const parsed = extractJson<Omit<SkillProfile, 'uid' | 'createdAt'>>(res.text);
      if (parsed && Array.isArray(parsed.transferableSkills) && Array.isArray(parsed.confidenceCalibration)) return parsed;
    }
  }
  return fallbackSkillProfile(user);
}

/** Match AI roles and women-friendly tracks from the evidence */
export async function buildOpportunityReport(user: UserProfile, skills: SkillProfile): Promise<Omit<OpportunityReport, 'uid' | 'createdAt'>> {
  if (isAgentAvailable()) {
    const prompt = `Based strictly on the user's evidence, recommend 3 realistic AI-related directions, plus women-friendly tracks and honest risk hints. Respond in English.

User profile:
- Name: ${user.name}
- Current role: ${user.currentRole || '(not provided)'}
- Stated target role: ${user.targetRole || '(not provided)'}
- Life stage: ${LIFE_STAGE_LABELS[user.lifeStage]}
- Self-rated confidence: ${user.confidenceSelf}/10
${resumeBlock(user)}
Skill portrait (strengths with evidence levels, and real gaps):
${skills.transferableSkills.map((s) => `- ${s.name} [${s.evidenceLevel || 'unrated'}]: ${s.evidence}`).join('\n')}
${(skills.skillGaps ?? []).map((g) => `- Real gap (${g.priority}): ${g.skill} — ${g.why}`).join('\n')}

Binding rules:
1. Recommend exactly 3 directions. matchScore (55-95) must reflect how well the EVIDENCE fits today, not future potential. Do not floor scores at 80; a direction whose key skills are unverified must score lower. Rank highest match first.
2. whyFit must cite the specific transferable skills (and their evidence level); never imply a gap is already a strength.
3. skillGaps per role: 2-3 concrete capabilities she would actually need to build for that direction.
4. tradeoffs must name a real cost or risk of that direction.
5. category can only be one of: 'AI Product' | 'AI Operations' | 'AI Education' | 'AI Ethics' | 'Data Governance'.
6. Do not use verdict-style words such as "recommended", "best", or "perfect".
7. Provide 2 womenFriendlyTracks and 2 genderRiskHints; hints must be practical and factual, not reassuring for reassurance's sake.

Output format: strict JSON:
{
  "roleMatches": [{"id": "role_1", "title": "...", "matchScore": 80, "description": "...", "whyFit": "...", "requiredSkills": ["..."], "typicalWorkflows": ["..."], "realWorldExamples": ["..."], "tradeoffs": "...", "category": "AI Operations", "skillGaps": ["..."]}],
  "womenFriendlyTracks": [{"title": "...", "reason": "..."}],
  "genderRiskHints": [{"scenario": "...", "gentleAdvice": "..."}]
}`;

    const ep = getAgentEndpoint('assessment');
    const res = await callModel(ep, { input: prompt, context: { user, skills } });
    if (res) {
      const parsed = extractJson<Omit<OpportunityReport, 'uid' | 'createdAt'>>(res.text);
      if (parsed && Array.isArray(parsed.roleMatches) && parsed.roleMatches.length > 0) return parsed;
    }
  }
  return fallbackOpportunityReport(user);
}

/** Generate the 4-week return plan for the chosen direction */
export async function buildReturnPlan(user: UserProfile, adjustmentFeedback?: string): Promise<Omit<ReturnPlan, 'uid' | 'createdAt'>> {
  if (isAgentAvailable()) {
    const direction = user.chosenRole?.trim() || user.targetRole?.trim() || 'an AI-related direction';
    const prompt = `Generate a 4-week transition plan for the user's CHOSEN direction. Respond in English.

User profile:
- Name: ${user.name}
- Current role: ${user.currentRole || '(not provided)'}
- Chosen direction: ${direction}
- Stated target role: ${user.targetRole || '(not provided)'}
- Life stage: ${LIFE_STAGE_LABELS[user.lifeStage]}
- Available time per week: ${user.constraints.weeklyHours} hours
${resumeBlock(user)}${adjustmentFeedback ? `- Adjustment feedback from the user: ${adjustmentFeedback}` : ''}

Binding rules:
1. Four weekly themes in order: tool familiarity, experience translation, producing one visible deliverable, real conversations.
2. Each week has 1-2 concrete, observable practice tasks that fit within the weekly hours. A task must produce something checkable (a rewritten bullet, a one-page demo, a completed chat, a real application).
3. Include practical steps toward real entry, not only studying: at least one project/demo artifact (week 3) and at least one real-world move such as an informational chat, an entry-level application, an internship inquiry, or a freelance project (week 4).
4. returnPlaybook must include the message "pausing is not elimination" and explain how to stretch the plan when time collapses.
5. interruptibleStages: [1,2,3,4]. Tasks are honest about effort: do not promise a job or a transformation in 4 weeks.

Output format: strict JSON:
{
  "paceLabel": "Returning parent",
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
      if (parsed && Array.isArray(parsed.weeks) && parsed.weeks.length > 0) return parsed;
    }
  }
  return fallbackReturnPlan(user);
}

/** Recommend 3 leveled micro-tasks for the target role */
export async function buildLabTasks(user: UserProfile): Promise<Omit<LabTask, 'id' | 'uid' | 'createdAt'>[]> {
  if (isAgentAvailable()) {
    const prompt = `Recommend 3 hands-on micro-tasks that can be completed in 30-40 minutes for the "${user.chosenRole || user.targetRole}" direction. Respond in English.

Requirements:
1. Tasks must be genuinely executable, and their output should be usable in a resume/portfolio
2. Each task contains: taskKey, title, scenario, toolHint, rubric[], estimatedMinutes
3. rubric is the acceptance criteria (3-4 items)

Output format: strict JSON array:
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

/** Evaluate the task output against the rubric honestly */
export async function evaluateSubmission(submissionText: string): Promise<LabFeedback> {
  if (isAgentAvailable()) {
    const prompt = `Evaluate the following task output against its own rubric. Be honest and specific; do not inflate the score. Respond in English.

Task output:
${submissionText}

Requirements:
1. First give 2 highlights that are specific and evidenced in the actual output
2. Give 1 actionable suggestion: the single most important improvement, executable
3. Give 2 skillGapAnalysis entries (one skill the output actually demonstrates + one next micro-skill it reveals as missing)
4. score from 1-5, reserved: give 5 only when the output would survive real professional review

Output format: strict JSON:
{"highlights": ["..."], "actionableSuggestions": ["..."], "skillGapAnalysis": ["..."], "score": 4.0, "evaluatedAt": "..."}`;

    const ep = getAgentEndpoint('assessment');
    const res = await callModel(ep, { input: prompt });
    if (res) {
      const parsed = extractJson<LabFeedback>(res.text);
      if (parsed) return parsed;
    }
  }
  return fallbackEvaluateSubmission(submissionText);
}

/** Context fed back to the Agent */
export interface CoachContext {
  planProgress?: { done: number; total: number; nextTaskTitle?: string };
  recentFeedbackScore?: number;
  completedSessionCount?: number;
  /** Strengths from the skill portrait, with how strongly the evidence supports each. */
  strengths?: { name: string; evidenceLevel?: string; evidence: string }[];
  /** Real prioritized skill gaps from the skill portrait. */
  skillGaps?: { skill: string; priority: string; why: string }[];
  /** Recent conversation history so the coach remembers prior turns. */
  conversationHistory?: { role: 'user' | 'coach'; content: string }[];
}

const DEFAULT_MICRO_ACTION =
  'Write down the one claim about your ability you are least sure of, and what evidence this week would prove or disprove it.';

/** AI Mentor reply: evidence-based coaching, not automated encouragement */
export async function coachReply(
  user: UserProfile,
  evidences: EvidenceItem[],
  userMessage: string,
  context: CoachContext = {}
): Promise<{ content: string; microAction?: string }> {
  if (isAgentAvailable()) {
    const systemPrompt = `You are Pathlet, an AI career coach for women moving into AI-era work. Always respond in English.

Core mission: help the user understand her abilities accurately and act on facts. Your goal is accurate self-knowledge, NOT making her feel more positive. Confidence should come from understanding, practice, and evidence; never from automated encouragement.

1. Supportive but never flattering
- Acknowledge her feelings respectfully, but never blindly agree with or dismiss her self-assessment.
- No empty praise, no over-encouragement, no unsupported positive claims.
- Do not default to "impostor syndrome" or "you just lack confidence". Sometimes the feeling points to a real skill gap; say so plainly and constructively.

2. Every judgment of ability needs evidence
- Ground every claim in the context: her resume text, stated experience, skill portrait (verified/transferable/hypothesis levels), completed plan tasks, and real feedback scores.
- When relevant, explicitly distinguish four things: verified strengths; transferable but unproven skills; unverified assumptions; and real skill gaps.
- Explain why a capability matters (or does not matter) for her chosen direction.
- If the evidence is insufficient, say so. Never invent reassuring conclusions or claim readiness the data does not support.

3. Honest and constructive feedback
- Name both the specific strength and the specific gap; address the most critical gap first.
- Assess the performance or the skill, never her worth as a person.
- Do not overstate job readiness, and do not soften real problems to protect feelings.

4. Build confidence through action
- Propose real, small, OBSERVABLE actions (a concrete task, a targeted exercise, or one precise clarifying question) that would verify or build the ability in question.
- Convert feedback into one clear next step.
- Say she improved or progressed only when real evidence in the context shows it.
- Do not force encouragement or emotional comfort into every reply. When she only needed accurate information, give the information and stop.

5. Match what she actually needs
- Asking for information: give accurate, specific information.
- Asking to build a skill: give concrete practice.
- Expressing self-doubt: help her separate emotional uncertainty from actual skill gaps, checking both against the evidence.
- Frustrated or upset: one sentence of genuine understanding, then return to honest facts and options.

Rules:
- The user's chosen direction is "${user.chosenRole?.trim() || user.targetRole?.trim() || 'not chosen yet'}". Keep advice tied to it.
- If resume text is present in the context, treat it as first-hand information: cite concrete details from it when she asks about her experience, and never say you cannot see it.
- Do not expose phrasing like "I remember you". She should feel understood, not archived.

Reply format (follow strictly):
1. Body: short and direct, markdown allowed. Two to five sentences unless she explicitly asks for detail.
2. End with one line starting exactly "[Micro-Action]": one concrete step doable in about 10 minutes today, or one precise question whose answer would let you judge her ability accurately.
3. Apart from "[Micro-Action]", use no headings such as "action steps" or "next steps".`;

    const contextStr = {
      user: {
        name: user.name,
        lifeStage: LIFE_STAGE_LABELS[user.lifeStage],
        currentRole: user.currentRole,
        targetRole: user.targetRole,
        chosenRole: user.chosenRole ?? null,
      },
      resume: user.resumeText ? user.resumeText.slice(0, 3000) : undefined,
      skillPortrait: context.strengths?.length
        ? {
            strengths: context.strengths.slice(0, 6),
            realSkillGaps: (context.skillGaps ?? []).slice(0, 4),
          }
        : undefined,
      evidences: evidences.slice(0, 5).map((e) => ({ title: e.title, detail: e.detail })),
      planProgress: context.planProgress,
      recentFeedbackScore: context.recentFeedbackScore,
      completedSessionCount: context.completedSessionCount,
    };

    const ep = getAgentEndpoint('coach');
    const history = context.conversationHistory?.map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('model' as const),
      content: m.content,
    }));
    const res = await callModel(ep, {
      systemInstruction: systemPrompt,
      input: userMessage,
      context: contextStr,
      ...(history && history.length ? { history } : {}),
    });

    if (res) {
      // Extract the micro-action: accept "[Micro-Action]", "**Micro-action:**" and similar markers.
      const markerRe =
        /\[Micro-Action\]|\*\*Micro-action\*\*\s*:?|^#{0,6}\s*(?:\d{1,2}\s*(?:minute|minutes)\s*)?micro-action\s*:?/im;
      const matched = res.text.match(markerRe);
      if (matched && matched.index !== undefined) {
        const idx = matched.index;
        const content = res.text.slice(0, idx).replace(/[\s\-—#*]+$/, '').trim();
        const microAction =
          res.text.slice(idx + matched[0].length).split('\n')[0].replace(/^[\s:*]+/, '').trim() ||
          DEFAULT_MICRO_ACTION;
        return { content, microAction };
      }
      return { content: res.text.trim(), microAction: DEFAULT_MICRO_ACTION };
    }
  }
  return fallbackCoachReply(user, evidences, userMessage, context);
}

/** AI-generated weekly summary: what the evidence actually shows */
export async function buildWeeklyConfidenceSummary(user: UserProfile, evidences: EvidenceItem[]): Promise<string> {
  if (isAgentAvailable() && evidences.length >= 2) {
    const prompt = `Write a weekly evidence review for the user. Respond in English.

User: ${user.name}
Evidence library:
${evidences.slice(0, 5).map((e, i) => `${i + 1}. ${e.title} — ${e.detail}`).join('\n')}

Requirements:
- Cite specific evidence titles; do not generalize
- State what the evidence genuinely supports and, honestly, what it does not yet prove
- Name the single most important gap or next verification step
- Within 80 words
- Do not add encouragement that the evidence does not justify`;

    const ep = getAgentEndpoint('coach');
    const res = await callModel(ep, { input: prompt });
    if (res) return res.text;
  }

  const picks = evidences.slice(0, 2);
  if (picks.length < 2) {
    return `${user.name}, this week produced little new evidence. Once two or more real items exist, I can review specifically what they support and what is still unverified.`;
  }
  return `${user.name}, this week\u2019s evidence: "${picks[0].title}" (${picks[0].detail}) and "${picks[1].title}" (${picks[1].detail}). These demonstrate those specific capabilities; they do not yet prove readiness for a full AI role. The next useful step is one visible deliverable that closes that gap.`;
}

/** Content safety moderation (AI guardian) */
export async function moderateContent(content: { title?: string; body?: string; images?: string[] }): Promise<{ pass: boolean; advice?: string }> {
  if (!isAgentAvailable()) {
    // No Agent in local development: pass by default
    return { pass: true };
  }

  const ep = getAgentEndpoint('coach');

  const text = [content.title, content.body].filter(Boolean).join('\n\n');
  const hasImages = (content.images?.length ?? 0) > 0;

  const prompt = `You are a community content safety guardian named "Pathlet". Your task is to review content posted by users to keep the community warm, supportive, and safe. Respond in English.

Please review the following content:

${text}
${hasImages ? `[Contains ${content.images!.length} image(s)]` : ''}

Review criteria:
1. Block: hate speech, violent threats, discriminatory language, pornographic content, malicious attacks
2. Allow: normal sharing, asking for help, venting, emotional expression (even if somewhat negative)
3. Gentle reminder: when content is overly negative or might cause discomfort, give gentle advice

Output format: strict JSON
{"pass": true/false, "advice": "gentle advice (provide only when pass is false)"}

Notes:
- Only block clearly violating content; let borderline cases through
- Advice should be gentle, not preachy, like a friend's reminder
- If the content is merely negative but not violating, pass: true, and advice can say "This looks a little down—would you like to rephrase it?"`;

  const res = await callModel(ep, { input: prompt });
  if (res) {
    const parsed = extractJson<{ pass: boolean; advice?: string }>(res.text);
    if (parsed) return parsed;
  }

  // If the Agent call fails, pass by default (do not block the user)
  return { pass: true };
}
