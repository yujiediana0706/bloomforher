// ReBloom AI domain types (aligned with spec §6 data model)

export type Segment = 'explorer' | 'setter' | 'mentor';

export type LifeStage =
  | 'student' // student explorer
  | 'early_career' // early career
  | 'growth' // deepening a career
  | 'pregnancy_planning' // planning a pregnancy
  | 'parental_leave' // parental leave
  | 'returning_parent' // returning parent
  | 'parttime_transition'; // part-time transition

export type JourneyStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface CoffeeAvailability {
  dayOfWeek: number; // 0=Sunday ... 6=Saturday
  timeRange: string; // e.g. "20:00-21:00"
}

export interface UserConstraints {
  returnToWork: boolean;
  newIndustry: boolean;
  flexibility: boolean;
  weeklyHours: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  avatarUrl?: string;
  currentRole: string;
  targetRole: string;
  skills: string[];
  resumePath?: string;
  /** Original file name of the uploaded resume. */
  resumeFileName?: string;
  /** Plain text extracted from the uploaded resume, used by the AI coach. */
  resumeText?: string;
  goals: string[];
  constraints: UserConstraints;
  segment: Segment;
  lifeStage: LifeStage;
  confidenceSelf: number; // 1-10 baseline self-assessment
  journeyStep: JourneyStep;
  coffeeAvailability: CoffeeAvailability[];
  communityAgreed: boolean;
  backgroundSummary: string;
  createdAt: string;
  updatedAt: string;
}

// —— Journey ② Skill discovery ——
export interface TransferableSkill {
  id: string;
  name: string;
  evidence: string; // must reference real experience
  aiRelevance: number; // 0-100
  narrative: string;
}

export interface ConfidenceCalibrationItem {
  dimension: string;
  selfScore: number; // 1-10 self-assessment
  aiScore: number; // 1-10 evidence-based objective score
  evidenceRef: string; // "In X you already did Y, which is exactly the Z an AI role needs"
}

export interface SkillProfile {
  uid: string;
  transferableSkills: TransferableSkill[];
  uniqueValue: string;
  confidenceCalibration: ConfidenceCalibrationItem[];
  createdAt: string;
}

// —— Journey ③ AI opportunities ——
export type RoleCategory =
  | 'AI Product'
  | 'AI Operations'
  | 'AI Education'
  | 'AI Ethics'
  | 'Data Governance';

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
  category: RoleCategory;
}

export interface WomenFriendlyTrack {
  title: string;
  reason: string;
}

export interface GenderRiskHint {
  scenario: string;
  gentleAdvice: string;
}

export interface OpportunityReport {
  uid: string;
  roleMatches: RoleMatch[];
  womenFriendlyTracks: WomenFriendlyTrack[];
  genderRiskHints: GenderRiskHint[];
  createdAt: string;
}

// —— Journey ④ Hands-on tasks ——
export interface LabFeedback {
  highlights: string[];
  actionableSuggestions: string[];
  skillGapAnalysis: string[];
  score: number; // 1-5
  evaluatedAt: string;
}

export interface LabSubmission {
  id: string;
  text: string;
  feedback: LabFeedback;
  submittedAt: string;
}

export interface LabTask {
  id: string;
  uid: string;
  taskKey: string;
  title: string;
  scenario: string;
  toolHint: string;
  rubric: string[];
  estimatedMinutes: number;
  status: 'todo' | 'in_progress' | 'done';
  submissions: LabSubmission[];
  createdAt: string;
}

// —— Journey ⑤ 30-day plan ——
export interface PlanTask {
  id: string;
  week: number;
  title: string;
  category: 'learning' | 'practice' | 'milestone';
  estimatedHours: number;
  completed: boolean;
  dueDate?: string;
}

export interface PlanWeek {
  week: number;
  theme: string;
  weeklyHours: number;
  learningResources: string[];
  practiceTasks: PlanTask[];
  jobSearchMilestones: string[];
  interruptible: boolean;
}

export interface ReturnPlan {
  uid: string;
  paceLabel: string; // planning a pregnancy / returning parent / part-time transition / student explorer / deepening a career
  weeklyHours: number;
  totalWeeks: number;
  interruptibleStages: number[];
  returnPlaybook: string; // career-break return playbook (e.g. an 8-week return plan)
  weeks: PlanWeek[];
  createdAt: string;
}

// —— Cross-cutting layer B: evidence library ——
export type EvidenceType =
  | 'assessment_result'
  | 'skill_progress'
  | 'task_outcome'
  | 'project_work'
  | 'mentor_endorsement'
  | 'community_kudos'
  | 'peer_appreciation'
  | 'milestone';

export interface EvidenceItem {
  id: string;
  uid: string;
  type: EvidenceType;
  title: string;
  detail: string;
  source: 'auto' | 'manual';
  tags: string[];
  relatedType?: string;
  relatedId?: string;
  isPublic: boolean;
  createdAt: string;
}

// —— Community plaza (free, public-interest, social feed, no categories) ——
export type PlazaPostStatus = 'open' | 'resolved' | 'hidden';

export interface PlazaPost {
  id: string;
  authorId: string; // anonymous posts still store the real uid; the list API hides it from non-authors
  anonymous: boolean;
  anonymousHandle?: string;
  title: string;
  body: string;
  images: string[]; // at most 3 (data URL or image link)
  tags: string[];
  status: PlazaPostStatus;
  kudosCount: number;
  commentCount: number;
  willingToHelpCount: number;
  evidenceRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlazaComment {
  id: string;
  postId: string;
  authorId: string;
  anonymous: boolean;
  anonymousHandle?: string;
  text: string;
  createdAt: string;
}

export interface WillingToHelp {
  helperUid: string;
  helperName: string;
  helperBio: string;
  helperSkills: string[];
  helperLifeStage: string;
  helperAvatarUrl?: string;
  status: 'offered' | 'booked' | 'consumed';
  createdAt: string;
}

// —— Peer coffee chat bookings (free) ——
export type PeerChatStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled';

export interface PeerChat {
  id: string;
  requesterId: string;
  requesterName: string;
  helperId: string;
  helperName: string;
  postId: string;
  status: PeerChatStatus;
  proposedTime: string;
  confirmedTime?: string;
  chatLink?: string;
  appreciation?: string;
  createdAt: string;
  updatedAt: string;
}

// —— Professional mentor marketplace (paid, escrowed) ——
export interface MentorReview {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Mentor {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  headline: string;
  bio: string;
  companies: string[];
  schools: string[];
  topicTags: string[];
  priceSingle: number;
  pricePackage5: number;
  verified: boolean;
  verificationStatus: 'seed_approved' | 'pending' | 'rejected';
  rating: number;
  sessionsCount: number;
  impactWomenCount: number;
  reviews: MentorReview[];
  createdAt: string;
}

export interface MentorSlot {
  id: string;
  mentorId: string;
  startAt: string; // ISO
  endAt: string;
  status: 'available' | 'booked';
}

export type BookingKind = 'single' | 'package';
export type BookingStatus =
  | 'held'
  | 'confirmed'
  | 'completed'
  | 'released'
  | 'rejected'
  | 'cancelled';

export interface Booking {
  id: string;
  coacheeId: string;
  coacheeName: string;
  mentorId: string;
  mentorName: string;
  slotId: string;
  kind: BookingKind;
  status: BookingStatus;
  amount: number;
  snapshotMentorName: string;
  snapshotPrice: number;
  scheduledTime: string;
  meetingLink?: string; // only confirmed/completed/released, and visible only to the coachee
  packageOrderId?: string;
  topic: string;
  review?: { rating: number; comment: string; createdAt: string };
  endorsement?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PackageOrder {
  id: string;
  coacheeId: string;
  mentorId: string;
  totalSessions: 5;
  remainingRedemptions: number;
  amount: number;
  status: 'active' | 'consumed' | 'refunded';
  createdAt: string;
}

// —— Circles (general) ——
export type CirclePostType = 'qa' | 'opportunity' | 'win' | 'cheer';

export interface CirclePost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorStage: string;
  type: CirclePostType;
  title: string;
  body: string;
  tags: string[];
  kudosCount: number;
  commentCount: number;
  evidenceRef?: string;
  createdAt: string;
}

export interface CircleComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface ReportItem {
  id: string;
  reporterId: string;
  targetType: 'plaza_post' | 'circle_post' | 'comment' | 'user';
  targetId: string;
  reason: string;
  createdAt: string;
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'coach';
  content: string;
  microAction?: string;
  createdAt: string;
}
