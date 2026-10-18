import type { EvidenceType, LifeStage } from './types';

// —— Brand ——
export const COACH_AVATAR_URL =
  'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Warm%20professional%20female%20career%20coach%20avatar%2C%203D%20stylized%20Pixar-like%20render%2C%20mid-30s%20Asian%20woman%2C%20gentle%20confident%20smile%2C%20soft%20studio%20lighting%2C%20clean%20cream%20background%2C%20head-and-shoulders%20portrait%2C%20modern%20minimal&image_size=square';

// —— Life stage labels (spec §5.5 rhythm tags) ——
export const LIFE_STAGE_LABELS: Record<LifeStage, string> = {
  student: 'Student explorer',
  early_career: 'Early career',
  growth: 'Deepening a career',
  pregnancy_planning: 'Planning a pregnancy',
  parental_leave: 'Parental leave',
  returning_parent: 'Returning parent',
  parttime_transition: 'Part-time transition',
};

export const LIFE_STAGE_DESCRIPTIONS: Record<LifeStage, string> = {
  student: 'University or graduate student exploring AI career paths',
  early_career: '1-3 years into work, hoping to move into AI early',
  growth: 'Established in a career, seeking a leap into an AI role',
  pregnancy_planning: 'Planning a pregnancy, building AI skills in advance',
  parental_leave: 'On leave or caregiving, needs an interruptible pace',
  returning_parent: 'Returning after a 1-3 year career break',
  parttime_transition: 'Balancing caregiving, looking for a flexible AI path',
};

// —— Evidence type labels and confidence weights (spec §5.8) ——
export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  assessment_result: 'Assessment result',
  skill_progress: 'Skill progress',
  task_outcome: 'Task outcome',
  project_work: 'Project work',
  mentor_endorsement: 'Mentor endorsement',
  community_kudos: 'Peer kudos',
  peer_appreciation: 'Peer appreciation',
  milestone: 'Milestone',
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

/** Compute the confidence score from a list of evidence items (starts at 40, capped at 100). */
export function computeConfidenceScore(
  evidences: { type: EvidenceType }[]
): number {
  let score = CONFIDENCE_BASE;
  for (const ev of evidences) {
    score += EVIDENCE_TYPE_WEIGHTS[ev.type] ?? 0;
  }
  return Math.min(CONFIDENCE_MAX, score);
}

// —— Anonymous handle pool ——
export const ANONYMOUS_HANDLES = [
  'Camellia',
  'Ginkgo',
  'Kapok',
  'Dandelion',
  'Wisteria',
  'Magnolia',
  'Winter Plum',
  'Peony',
  'Lily of the Valley',
  'Iris',
  'Crabapple',
  'Gardenia',
];

/** Deterministically pick the same handle from (uid + salt). */
export function pickAnonymousHandle(uid: string, salt: string): string {
  let hash = 0;
  const input = `${uid}::${salt}`;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) % 100000;
  }
  return `Anonymous · ${ANONYMOUS_HANDLES[hash % ANONYMOUS_HANDLES.length]}`;
}

// —— Journey steps ——
export const JOURNEY_STEPS = [
  { step: 1, label: 'Sign up & goals', href: '/onboarding' },
  { step: 2, label: 'Skill discovery', href: '/skills' },
  { step: 3, label: 'Pick your path', href: '/opportunities' },
  { step: 4, label: 'AI Mentor', href: '/coach' },
] as const;

// —— Main navigation (the product is three surfaces: Home, AI Mentor, Community) ——
export const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/coach', label: 'AI Mentor' },
  { href: '/plaza', label: 'Community' },
] as const;
