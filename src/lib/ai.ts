// AI layer: prefers the Agent Platform / Gemini, falling back to placeholder logic (for local development).
// All functions are async; return types are unchanged.

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

// —— Placeholder implementations (local development fallback) ——

function fallbackSkillProfile(user: UserProfile): Omit<SkillProfile, 'uid' | 'createdAt'> {
  const stage = LIFE_STAGE_LABELS[user.lifeStage];
  const skills: TransferableSkill[] = [
    { id: 'ai_sk_1', name: 'Structuring and breaking down processes', evidence: `In your experience as "${user.currentRole}", you have already turned complex matters into actionable steps`, aiRelevance: 90, narrative: 'In past work you have already broken messy information into steps—exactly the core capability that AI workflow design needs.' },
    { id: 'ai_sk_2', name: 'Communication and requirement translation', evidence: 'You have long had to align information and expectations across different roles', aiRelevance: 85, narrative: 'In collaboration you have already translated different people\u2019s words into a shared language—a key capability for AI roles.' },
    { id: 'ai_sk_3', name: 'Problem decomposition and prioritization', evidence: 'In real work you constantly have to judge what to do first and to what extent', aiRelevance: 82, narrative: 'You have already decomposed problems in real settings, which maps directly to problem scoping in AI workflows.' },
    { id: 'ai_sk_4', name: 'Content expression and user perspective', evidence: 'Your work naturally requires communicating with and delivering to real users', aiRelevance: 78, narrative: 'Your expression and user perspective transfer directly into AI prompt design and output evaluation.' },
    { id: 'ai_sk_5', name: 'Project rhythm and collaboration management', evidence: 'You have to keep things moving to completion under limited resources', aiRelevance: 80, narrative: 'You have already guaranteed delivery under limited resources in real projects—the project capability needed to land AI operations.' },
  ];

  return {
    uniqueValue: `You are currently at the "${stage}" stage, ${user.name}. Your unique value lies in translating your real past experience into the language of AI workflows—this is not starting from zero, but moving your capabilities to a new arena.`,
    transferableSkills: skills,
    confidenceCalibration: [
      { dimension: 'Technical self-efficacy', selfScore: user.confidenceSelf, aiScore: Math.min(10, user.confidenceSelf + 4), evidenceRef: 'You have already achieved systematic decomposition and delivery in real projects' },
      { dimension: 'AI tool readiness', selfScore: Math.min(10, user.confidenceSelf + 1), aiScore: Math.min(10, user.confidenceSelf + 3), evidenceRef: 'You are willing to start learning about AI tools' },
      { dimension: 'Sense of value during a career break', selfScore: Math.max(1, user.confidenceSelf - 1), aiScore: Math.min(10, user.confidenceSelf + 4), evidenceRef: 'The caregiving period itself is high-intensity multitasking coordination training' },
      { dimension: 'Domain transferability', selfScore: Math.min(10, user.confidenceSelf + 1), aiScore: Math.min(10, user.confidenceSelf + 4), evidenceRef: 'You can transfer your original industry experience into AI contexts' },
      { dimension: 'Problem decomposition', selfScore: Math.min(10, user.confidenceSelf + 1), aiScore: Math.min(10, user.confidenceSelf + 3), evidenceRef: 'Your experience handling real problems and blockers' },
      { dimension: 'Ethics and quality judgment', selfScore: user.confidenceSelf, aiScore: Math.min(10, user.confidenceSelf + 3), evidenceRef: 'Your rigor in delivery' },
    ],
  };
}

function fallbackOpportunityReport(_user: UserProfile, _skills: SkillProfile): Omit<OpportunityReport, 'uid' | 'createdAt'> {
  return {
    roleMatches: [
      { id: 'ai_role_ops', title: 'AI Operations', matchScore: 90, description: 'Turning AI capabilities into concrete business processes', whyFit: 'Your structuring and collaboration skills are a strong match', requiredSkills: ['Prompt design', 'Workflow building'], typicalWorkflows: ['Map the scenario \u2192 design templates \u2192 pilot \u2192 iterate'], realWorldExamples: ['An education company used AI operations to cut its Q&A response time from 2 days to 2 hours'], tradeoffs: 'Low barrier, high demand; tradeoff: you must keep up with changing tools', category: 'AI Operations' },
      { id: 'ai_role_product', title: 'AI Product Manager', matchScore: 84, description: 'Defining the real problems AI features should solve', whyFit: 'Your user perspective and communication skills are core', requiredSkills: ['Requirement insight', 'Scenario definition'], typicalWorkflows: ['User interviews \u2192 scenario definition \u2192 align with algorithms/engineering'], realWorldExamples: ['A non-technical PM led scenario definition'], tradeoffs: 'High ceiling; tradeoff: steep learning curve', category: 'AI Product' },
      { id: 'ai_role_edu', title: 'AI Education / Adoption', matchScore: 79, description: 'Designing AI training for enterprises or the public', whyFit: 'Your expression and teaching/content experience transfer well', requiredSkills: ['Training design', 'Content expression'], typicalWorkflows: ['Research the current state \u2192 design the path \u2192 accompany the pilot'], realWorldExamples: ['A former teacher transitioned into an AI trainer'], tradeoffs: 'Smooth transition; tradeoff: income depends on projects and resources', category: 'AI Education' },
    ],
    womenFriendlyTracks: [
      { title: 'AI Operations', reason: 'Moderate barrier, high demand, and supports flexible and remote work.' },
      { title: 'AI Education', reason: 'Values expression and teaching, naturally building on education/content backgrounds.' },
    ],
    genderRiskHints: [
      { scenario: 'Worrying about being questioned about fertility or a career gap', gentleAdvice: 'No need to hide it—frame the gap as capability built in another setting.' },
      { scenario: 'Low confidence, feeling unworthy of AI roles', gentleAdvice: 'Calibrate yourself first with the real achievements in your evidence library.' },
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
    returnPlaybook: 'If you need to pause, run the "8-week return plan": split the 4-week tasks by priority into 8 weeks, keeping only one core task each week—pausing is not elimination.',
    weeks: [1, 2, 3, 4].map((week) => ({
      week,
      theme: week === 1 ? 'Build basic familiarity with AI tools' : week === 2 ? 'Translate past experience into the language of AI' : week === 3 ? 'Produce your first showcaseable piece of work' : 'Enter real conversations and iterate',
      weeklyHours: hours,
      learningResources: [`Topic materials and case list for week ${week}`],
      practiceTasks: [{ id: `ai_pt_${week}_1`, week, title: week === 1 ? 'Complete one document-organizing task with AI' : week === 2 ? 'Rewrite your resume' : week === 3 ? 'Build a small AI workflow demo' : 'Book one peer coffee chat', category: (week === 4 ? 'milestone' : 'practice') as 'practice' | 'milestone', estimatedHours: Math.max(1, Math.round(hours * 0.5)), completed: false }],
      jobSearchMilestones: [week === 4 ? 'Complete one mock-interview review' : `Complete the review for week ${week}`],
      interruptible: true,
    })),
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
    actionableSuggestions: ['You could add a conditional branch for which option to switch to if conditions change'],
    skillGapAnalysis: ['Mastered: structured decomposition and tradeoff judgment', 'Next micro-skill: preparing backup options for different constraints'],
    score: 4.5,
    evaluatedAt: new Date().toISOString(),
  };
}

function fallbackCoachReply(user: UserProfile, evidences: EvidenceItem[], userMessage: string, context: CoachContext): { content: string; microAction?: string } {
  const negative = /not fit|can't|don't know how|afraid|anxious|not good enough|can't keep up|no experience|career break/i.test(userMessage);
  const pause = /pause|rest|sick|tired|no time/i.test(userMessage);
  const planTalk = /plan|task|stick to|procrastinat|forget|forgot|can't do|progress|next step|do first|this week|today/i.test(userMessage);
  const evidence = evidences[0];
  const progress = context.planProgress;
  const nextTask = progress?.nextTaskTitle;

  let content: string;
  if (pause) {
    content = `${user.name}, take care of yourself first. Pausing is not elimination—slowing the pace down is not giving up on your goal.`;
  } else if (planTalk && progress && progress.total > 0) {
    const parts: string[] = [];
    if (nextTask) parts.push(`Your next task is "${nextTask}"—just do this one first; finishing it means today is a win. `);
    parts.push(`You are at ${progress.done}/${progress.total} right now—just follow your own pace. `);
    if (typeof context.recentFeedbackScore === 'number') parts.push(`I remember your last task feedback scored ${context.recentFeedbackScore}—that was not luck, you really can do it. `);
    content = `${user.name}, ${parts.join('')}`;
  } else if (negative) {
    const ref = evidence ? `You already have one piece of real evidence: "${evidence.title}"—${evidence.detail}.` : 'The fact that you are willing to get this far is itself evidence.';
    content = `${user.name}, I hear your unease. ${ref} This is not a platitude—it is a fact you created yourself.`;
  } else {
    const taskHint = nextTask ? `I looked at your plan; the next step is "${nextTask}".` : '';
    content = `${user.name}, let us take it one step at a time. Based on your current profile and evidence, I suggest treating "${user.targetRole}" as your main line for now. ${taskHint}`;
  }

  return {
    content,
    microAction: 'Take 5 minutes, pick one piece of evidence from your "I can" wall, read it, and write down one feeling.',
  };
}

// —— Public API (async, dual mode) ——

/** Analyze transferable skills + calibrate confidence */
export async function buildSkillProfile(user: UserProfile): Promise<Omit<SkillProfile, 'uid' | 'createdAt'>> {
  if (isAgentAvailable()) {
    const prompt = `Analyze the following user's transferable skills and calibrate their confidence. Respond in English.

User profile:
- Name: ${user.name}
- Current role: ${user.currentRole}
- Target role: ${user.targetRole}
- Life stage: ${LIFE_STAGE_LABELS[user.lifeStage]}
- Current skills: ${user.skills.join(', ')}
- Background summary: ${user.backgroundSummary}
- Self-rated confidence: ${user.confidenceSelf}/10

Requirements:
1. Identify 5 transferable skills; each skill must cite the user's real experience as evidence
2. Perform a 6-dimension confidence calibration (the AI score must be 2-4 points higher than the user's self-rating, reflecting the systematic underrating effect among women)
3. Output uniqueValue (a personalized value statement of no more than 80 words)

Output format: strict JSON, with field names exactly as follows:
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

/** Match AI roles and women-friendly tracks */
export async function buildOpportunityReport(user: UserProfile, skills: SkillProfile): Promise<Omit<OpportunityReport, 'uid' | 'createdAt'>> {
  if (isAgentAvailable()) {
    const prompt = `Based on the user's skill profile, recommend 3 AI-related roles, along with women-friendly tracks and gender-risk hints. Respond in English.

User profile:
- Name: ${user.name}
- Current role: ${user.currentRole}
- Target role: ${user.targetRole}
- Life stage: ${LIFE_STAGE_LABELS[user.lifeStage]}
- Confidence: ${user.confidenceSelf}/10

Skill profile:
${skills.transferableSkills.map(s => `- ${s.name}: ${s.evidence}`).join('\n')}

Requirements:
1. Recommend 3 roles, each containing: title, matchScore(80-95), description, whyFit, requiredSkills[], typicalWorkflows[], realWorldExamples[], tradeoffs, category
2. category can only be one of: 'AI Product' | 'AI Operations' | 'AI Education' | 'AI Ethics' | 'Data Governance'
3. Do not use verdict-style words such as "recommended" or "best"
4. Provide 2 womenFriendlyTracks and 2 genderRiskHints

Output format: strict JSON:
{
  "roleMatches": [{"id": "role_1", "title": "...", "matchScore": 90, "description": "...", "whyFit": "...", "requiredSkills": ["..."], "typicalWorkflows": ["..."], "realWorldExamples": ["..."], "tradeoffs": "...", "category": "AI Operations"}],
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

/** Generate the 30-day return plan */
export async function buildReturnPlan(user: UserProfile, adjustmentFeedback?: string): Promise<Omit<ReturnPlan, 'uid' | 'createdAt'>> {
  if (isAgentAvailable()) {
    const prompt = `Generate a 4-week return plan for the user. Respond in English.

User profile:
- Name: ${user.name}
- Current role: ${user.currentRole}
- Target role: ${user.targetRole}
- Life stage: ${LIFE_STAGE_LABELS[user.lifeStage]}
- Available time per week: ${user.constraints.weeklyHours} hours
${adjustmentFeedback ? `- Adjustment feedback: ${adjustmentFeedback}` : ''}

Requirements:
1. A 4-week progression of themes: tool familiarity \u2192 experience translation \u2192 producing work \u2192 real conversations
2. One core task per week, not exceeding the available weekly time
3. Must include a returnPlaybook with the message "pausing is not elimination"
4. interruptibleStages: [1,2,3,4]

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
      if (parsed) return parsed;
    }
  }
  return fallbackReturnPlan(user);
}

/** Recommend 3 leveled micro-tasks for the target role */
export async function buildLabTasks(user: UserProfile): Promise<Omit<LabTask, 'id' | 'uid' | 'createdAt'>[]> {
  if (isAgentAvailable()) {
    const prompt = `Recommend 3 hands-on micro-tasks that can be completed in 30-40 minutes for the "${user.targetRole}" role. Respond in English.

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

/** Evaluate the task output against the rubric */
export async function evaluateSubmission(submissionText: string): Promise<LabFeedback> {
  if (isAgentAvailable()) {
    const prompt = `Evaluate the following task output and score it against the rubric. Respond in English.

Task output:
${submissionText}

Requirements:
1. First give 2 highlights (specific, not generic)
2. Give 1 actionableSuggestions (an executable improvement suggestion)
3. Give 2 skillGapAnalysis entries (a skill already mastered + a next micro-skill)
4. score from 1-5

Output format: strict JSON:
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

/** Context fed back to the Agent */
export interface CoachContext {
  planProgress?: { done: number; total: number; nextTaskTitle?: string };
  recentFeedbackScore?: number;
  completedSessionCount?: number;
}

/** AI Mentor reply (with plan companionship reminders / evidence reframing / micro-actions / "pausing is not elimination" red line) */
export async function coachReply(
  user: UserProfile,
  evidences: EvidenceItem[],
  userMessage: string,
  context: CoachContext = {}
): Promise<{ content: string; microAction?: string }> {
  if (isAgentAvailable()) {
    const systemPrompt = `You are a career-transition AI Mentor for women, named "Pathlet". Always respond in English.

Your three iron rules:
1. Be gentle but not preachy, and avoid empty encouragement. When the user says something negative, empathize first, then use evidence reframing (cite her real evidence)
2. Every reply must give one micro-action suggestion completable in 10 minutes
3. Pausing is not elimination—when the user mentions pausing/resting/being tired, tell her that slowing the pace down is not giving up on her goal

You remember the user's full history (assessment report, evidence library, mentor sessions, plan progress) and use these memories to give personalized replies. But do not expose phrasing like "I remember you"—what the user should feel is being understood, not being archived.

Reply format (follow strictly):
1. Body: empathy/analysis + cite her real evidence + suggestions; subheadings are allowed
2. The last line of the body must start on its own line with "[Micro-Action]" and describe one concrete action completable in 10 minutes
3. Apart from "[Micro-Action]", do not use any other headings such as "action steps", "micro-action", or "next steps"

Current user: ${user.name}, ${LIFE_STAGE_LABELS[user.lifeStage]}, goal: ${user.targetRole}`;

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
      // Extract the micro-action from the reply: accept "[Micro-Action]", "**Micro-action:**", "### 10-minute micro-action:" and similar
      const DEFAULT_MICRO = 'Take 5 minutes, pick one piece of evidence from your "I can" wall, read it, and write down one feeling.';
      const markerRe =
        /\[Micro-Action\]|\*\*Micro-action\*\*\s*:?|^#{0,6}\s*(?:\d{1,2}\s*(?:minute|minutes)\s*)?micro-action\s*:?/im;
      const matched = res.text.match(markerRe);
      if (matched && matched.index !== undefined) {
        const idx = matched.index;
        const content = res.text.slice(0, idx).replace(/[\s\-—#*]+$/, '').trim();
        const microAction =
          res.text.slice(idx + matched[0].length).split('\n')[0].replace(/^[\s:*]+/, '').trim() ||
          DEFAULT_MICRO;
        return { content, microAction };
      }
      return { content: res.text.trim(), microAction: DEFAULT_MICRO };
    }
  }
  return fallbackCoachReply(user, evidences, userMessage, context);
}

/** AI-generated weekly confidence summary (must cite at least 2 specific pieces of evidence) */
export async function buildWeeklyConfidenceSummary(user: UserProfile, evidences: EvidenceItem[]): Promise<string> {
  if (isAgentAvailable() && evidences.length >= 2) {
    const prompt = `Write a weekly confidence summary for the user, citing at least 2 specific pieces of evidence. Respond in English.

User: ${user.name}
Evidence library:
${evidences.slice(0, 5).map((e, i) => `${i + 1}. ${e.title} — ${e.detail}`).join('\n')}

Requirements:
- Gentle but not preachy
- Must cite specific evidence titles
- Within 80 words
- End with an encouragement`;

    const ep = getAgentEndpoint('coach');
    const res = await callModel(ep, { input: prompt });
    if (res) return res.text;
  }

  const picks = evidences.slice(0, 2);
  if (picks.length < 2) {
    return `${user.name}, this week you started building evidence. Once you have a few more entries, I can write a more specific confidence summary for you.`;
  }
  return `${user.name}, this week I saw two specific pieces of evidence: first, "${picks[0].title}" (${picks[0].detail}); second, "${picks[1].title}" (${picks[1].detail}). These are not empty encouragement—they are things you actually did. Please hold on to them.`;
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
