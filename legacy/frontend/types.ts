export type LifeStage = 
  | 'Postpartum Return'
  | 'Career Pivot'
  | 'In-School Exploration'
  | 'Part-Time Transition'
  | 'Deepen Before Life Transition';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatar?: string;
  roleType: 'Explorer' | 'Setter' | 'Mentor';
  lifeStage: LifeStage;
  availableHoursPerWeek: number;
  journeyStep: number; // 1 to 6
  backgroundSummary: string;
  confidenceSelfScores: {
    technicalSelfEfficacy: number; // 1-10
    aiToolReadiness: number;
    careerGapConfidence: number;
    adaptability: number;
    communicationValue: number;
    problemSolvingInAI: number;
  };
  remainingRedemptions: number; // 5-session package default 5
}

export interface TransferableSkill {
  id: string;
  name: string;
  evidence: string;
  aiRelevance: number; // 0-100
  narrative: string;
}

export interface ConfidenceCalibrationItem {
  dimension: string;
  selfScore: number; // 1-10
  aiScore: number; // 1-10
  evidenceRef: string;
}

export interface SkillsDiscoveryResult {
  uniqueValue: string;
  transferableSkills: TransferableSkill[];
  confidenceCalibration: ConfidenceCalibrationItem[];
}

export interface RoleMatch {
  id: string;
  title: string;
  matchScore: number; // 0-100
  description: string;
  whyFit: string;
  requiredSkills: string[];
  typicalWorkflows: string[];
  realWorldExamples: string[];
  tradeoffs: string;
  isWomenFriendly: boolean;
  category: 'AI Product' | 'AI Operations' | 'AI Education & Adoption' | 'Data & Governance' | 'AI Ethics & Alignment';
}

export interface HandsOnTask {
  id: string;
  targetRole: string;
  title: string;
  estimatedMinutes: number;
  scenario: string;
  suggestedPrompt: string;
  rubric: string[];
  userSubmission?: string;
  feedback?: {
    highlights: string[];
    actionableSuggestions: string[];
    skillGapAnalysis: string[];
    score: number; // 1 to 5
    evaluatedAt: string;
  };
}

export interface PlanTaskItem {
  id: string;
  title: string;
  estimatedHours: number;
  completed: boolean;
  type: 'learning' | 'practice' | 'milestone';
}

export interface PlanWeek {
  week: number;
  theme: string;
  weeklyHours: number;
  learningResources: string[];
  practiceTasks: PlanTaskItem[];
  jobSearchMilestones: string[];
  interruptible: boolean;
}

export interface ReturnPlan {
  lifeStage: LifeStage;
  recommendedWeeklyHours: number;
  totalWeeks: number;
  contingencyNote: string;
  weeks: PlanWeek[];
}

export type EvidenceType = 
  | 'assessment_result'
  | 'skill_progress'
  | 'task_outcome'
  | 'project_work'
  | 'mentor_endorsement'
  | 'community_kudos'
  | 'milestone';

export interface EvidenceItem {
  id: string;
  userId: string;
  type: EvidenceType;
  title: string;
  detail: string;
  source: 'auto' | 'manual';
  tags: string[];
  relatedId?: string;
  isPublic: boolean;
  createdAt: string;
}

export interface MentorSlot {
  id: string;
  mentorId: string;
  startAt: string; // ISO
  endAt: string;
  status: 'available' | 'booked';
}

export interface MentorProfile {
  id: string;
  name: string;
  avatar: string;
  title: string;
  company: string;
  school: string;
  isVerified: boolean;
  bio: string;
  topics: string[];
  sessionCount: number;
  rating: number;
  impactWomenCount: number;
  credentialDocName: string;
  availableSlots: MentorSlot[];
  reviews: {
    authorName: string;
    rating: number;
    comment: string;
    date: string;
  }[];
}

export type BookingStatus = 'held' | 'confirmed' | 'completed' | 'released' | 'rejected' | 'cancelled';

export interface Booking {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorTitle: string;
  mentorAvatar: string;
  coacheeId: string;
  coacheeName: string;
  slotId: string;
  scheduledTime: string;
  status: BookingStatus;
  meetingLink?: string; // Zoom / Meet (only visible when confirmed/completed/released)
  topic: string;
  userNotes?: string;
  review?: {
    rating: number;
    comment: string;
    createdAt: string;
  };
  endorsement?: string;
  createdAt: string;
}

export type PostType = 'qa' | 'opportunity' | 'win' | 'cheer';

export interface CirclePost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorStage: string;
  type: PostType;
  title: string;
  content: string;
  tags: string[];
  cheers: number;
  cheeredBy: string[]; // uids
  commentsCount: number;
  linkedEvidenceId?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
  microAction?: string;
}
