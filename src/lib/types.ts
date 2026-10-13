// 「ReBloom AI · 她径」领域类型定义（对齐规范 §6 数据模型）

export type Segment = 'explorer' | 'setter' | 'mentor';

export type LifeStage =
  | 'student' // 在校探索
  | 'early_career' // 职场新人
  | 'growth' // 职场深耕
  | 'pregnancy_planning' // 孕前深耕
  | 'parental_leave' // 育儿期
  | 'returning_parent' // 产后回归
  | 'parttime_transition'; // 兼职过渡

export type JourneyStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface CoffeeAvailability {
  dayOfWeek: number; // 0=周日 ... 6=周六
  timeRange: string; // 如 "20:00-21:00"
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
  goals: string[];
  constraints: UserConstraints;
  segment: Segment;
  lifeStage: LifeStage;
  confidenceSelf: number; // 1-10 基线自评
  journeyStep: JourneyStep;
  coffeeAvailability: CoffeeAvailability[];
  communityAgreed: boolean;
  backgroundSummary: string;
  createdAt: string;
  updatedAt: string;
}

// —— 旅程 ② 技能发现 ——
export interface TransferableSkill {
  id: string;
  name: string;
  evidence: string; // 必须引用真实经历
  aiRelevance: number; // 0-100
  narrative: string;
}

export interface ConfidenceCalibrationItem {
  dimension: string;
  selfScore: number; // 1-10 自评
  aiScore: number; // 1-10 基于证据的客观评分
  evidenceRef: string; // "你在 X 中已经做到了 Y，这正是 AI 岗位需要的 Z 能力"
}

export interface SkillProfile {
  uid: string;
  transferableSkills: TransferableSkill[];
  uniqueValue: string;
  confidenceCalibration: ConfidenceCalibrationItem[];
  createdAt: string;
}

// —— 旅程 ③ AI 机会 ——
export type RoleCategory =
  | 'AI 产品'
  | 'AI 运营'
  | 'AI 教育'
  | 'AI 伦理'
  | '数据治理';

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

// —— 旅程 ④ 实操任务 ——
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

// —— 旅程 ⑤ 30 天计划 ——
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
  paceLabel: string; // 孕前深耕 / 产后回归 / 兼职过渡 / 在校探索 / 职场深耕
  weeklyHours: number;
  totalWeeks: number;
  interruptibleStages: number[];
  returnPlaybook: string; // 断档回归预案（如 8 周回归计划）
  weeks: PlanWeek[];
  createdAt: string;
}

// —— 贯穿层 B 证据库 ——
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

// —— 对话广场（公益·免费，小红书式图文社区，不分类）——
export type PlazaPostStatus = 'open' | 'resolved' | 'hidden';

export interface PlazaPost {
  id: string;
  authorId: string; // 匿名帖仍存真实 uid，列表接口不返回给非本人
  anonymous: boolean;
  anonymousHandle?: string;
  title: string;
  body: string;
  images: string[]; // 最多 3 张（data URL 或图片链接）
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

// —— Peer Coffee Chat 预约（免费）——
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

// —— 专业导师市场（付费·担保交易）——
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
  meetingLink?: string; // 仅 confirmed/completed/released 且仅学员本人可见
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

// —— 圈子通用 ——
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
