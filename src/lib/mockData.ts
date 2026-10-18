// HerRise prototype seed data (aligned with spec section 9)
// Note: this file is used for the front-end prototype; scripts/seed.ts plays the
// same role once the app is connected to Firestore.

import type {
  CirclePost,
  Mentor,
  MentorSlot,
  PlazaComment,
  PlazaPost,
  UserProfile,
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

// —— Community members (plaza helpers / commenters) ——
export const COMMUNITY_USERS: UserProfile[] = [
  {
    uid: 'user_zhou',
    name: 'Zhou Min',
    email: 'zhou.min@herrise.test',
    currentRole: 'Freelance Content Editor',
    targetRole: 'AI Operations',
    skills: ['Content Strategy', 'Data Organization', 'Community Operations'],
    goals: ['Flexible work', 'Build an AI portfolio'],
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
    backgroundSummary:
      'Mother of two, part-time content editor, self-learning AI prompting and content workflows.',
    createdAt: isoPast(30),
    updatedAt: isoPast(5),
  },
  {
    uid: 'user_li',
    name: 'Li Nan',
    email: 'li.nan@herrise.test',
    currentRole: 'Cross-border E-commerce Operations',
    targetRole: 'AI Education',
    skills: ['Cross-border Operations', 'Copywriting', 'User Growth'],
    goals: ['Transition into AI education', 'Find peer partners'],
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
    backgroundSummary:
      'Three years in cross-border e-commerce operations, hoping to transfer operations experience into AI education products.',
    createdAt: isoPast(45),
    updatedAt: isoPast(8),
  },
  {
    uid: 'user_su',
    name: 'Su Xiao',
    email: 'su.xiao@herrise.test',
    currentRole: 'HR Specialist',
    targetRole: 'AI Ethics',
    skills: ['Recruiting', 'Organizational Communication', 'Compliance Awareness'],
    goals: ['Move into AI ethics and governance'],
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
    backgroundSummary:
      'HR background, focused on AI hiring fairness and data compliance, hoping to move into AI ethics.',
    createdAt: isoPast(12),
    updatedAt: isoPast(1),
  },
];

// —— Three distinct women mentors (all seed_approved) ——
export const MENTORS: Mentor[] = [
  {
    id: 'mentor_1',
    userId: 'mentor_user_1',
    displayName: 'Lin Zhixia',
    avatarUrl:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    headline: 'Former Big-Tech AI Product Manager · Returning mother',
    bio: 'Led an AI assistant product line at a big tech company and re-planned her career after returning from a second maternity leave. She excels at helping postpartum women translate operations experience into the language of AI products.',
    companies: ['Global AI Platform', 'Tech Startup'],
    schools: ['National University of Singapore'],
    topicTags: ['AI Product', 'Returning to Work', 'Resume Rewriting', 'Interview Coaching'],
    priceSingle: 49,
    pricePackage5: 199,
    verified: true,
    verificationStatus: 'seed_approved',
    rating: 4.9,
    sessionsCount: 128,
    impactWomenCount: 96,
    reviews: [
      {
        id: 'r_1_1',
        authorName: 'Anonymous · Camellia',
        rating: 5,
        comment:
          'Zhixia helped me rewrite eight years of operations experience into the language of AI products, and two weeks later I landed an interview.',
        date: isoPast(14),
      },
      {
        id: 'r_1_2',
        authorName: 'Zhou Min',
        rating: 5,
        comment:
          'She really understands the worries of returning to work after maternity leave; she keeps a gentle pace and never adds pressure.',
        date: isoPast(6),
      },
    ],
    createdAt: isoPast(90),
  },
  {
    id: 'mentor_2',
    userId: 'mentor_user_2',
    displayName: 'Zhou Mingyuan',
    avatarUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    headline: 'Women-in-Tech Founder · AI education',
    bio: 'Serial entrepreneur focused on bringing AI education products to market, skilled at zero-to-one product validation and business model design.',
    companies: ['Mingyuan Tech (Founder)'],
    schools: ['University of Melbourne'],
    topicTags: ['Women in Tech', 'AI Education', 'Business Models', 'Fundraising'],
    priceSingle: 59,
    pricePackage5: 249,
    verified: true,
    verificationStatus: 'seed_approved',
    rating: 4.8,
    sessionsCount: 76,
    impactWomenCount: 58,
    reviews: [
      {
        id: 'r_2_1',
        authorName: 'Li Nan',
        rating: 5,
        comment:
          'Mingyuan helped me clarify the entry point for an AI education product; very practical.',
        date: isoPast(20),
      },
      {
        id: 'r_2_2',
        authorName: 'Anonymous · Ginkgo',
        rating: 4,
        comment:
          'Packed with information; preparing a list of questions in advance makes it even more effective.',
        date: isoPast(9),
      },
    ],
    createdAt: isoPast(120),
  },
  {
    id: 'mentor_3',
    userId: 'mentor_user_3',
    displayName: 'Su Ye',
    avatarUrl:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&auto=format&fit=crop&q=80',
    headline: 'AI Operations Expert · Early-career mentor',
    bio: 'Expert in AI content and operations, skilled at guiding women with no technical background through their first AI portfolio, patient and with a clear methodology.',
    companies: ['An AI SaaS company'],
    schools: ['University of Sydney'],
    topicTags: ['AI Operations', 'Portfolio', 'Beginner Onboarding', 'Prompting'],
    priceSingle: 39,
    pricePackage5: 179,
    verified: true,
    verificationStatus: 'seed_approved',
    rating: 4.9,
    sessionsCount: 203,
    impactWomenCount: 151,
    reviews: [
      {
        id: 'r_3_1',
        authorName: 'Su Xiao',
        rating: 5,
        comment:
          'Su Ye walked me through building my first AI operations project; the hands-on guidance was very reassuring.',
        date: isoPast(3),
      },
      {
        id: 'r_3_2',
        authorName: 'Anonymous · Dandelion',
        rating: 5,
        comment: 'Great value, ideal for women just getting started.',
        date: isoPast(11),
      },
    ],
    createdAt: isoPast(60),
  },
];

// —— User profiles for the mentor accounts (spec section 9) ——
export const MENTOR_USERS: UserProfile[] = MENTORS.map((m, i) => ({
  uid: m.userId,
  name: m.displayName,
  email: `mentor${i + 1}@herrise.test`,
  avatarUrl: m.avatarUrl,
  currentRole: m.headline,
  targetRole: 'AI Mentor',
  skills: m.topicTags,
  goals: ['Support women through career transitions'],
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

// —— Conversation plaza ——
export const SEED_PLAZA_POSTS: PlazaPost[] = [
  {
    id: 'post_help_1',
    authorId: 'user_zhou',
    anonymous: true,
    anonymousHandle: 'Anonymous · Camellia',
    images: [],
    title: 'Two years after maternity leave, I want to move into AI but fear falling behind',
    body: 'I have been out of the workforce for nearly two years, and seeing everyone talk about AI makes me anxious. I have worked in education and operations; I want to know which direction is the most realistic entry point, and I am afraid I cannot keep up with learning. Has anyone walked this path before?',
    tags: ['Returning after a break', 'AI Operations', 'Seeking direction'],
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
    anonymousHandle: 'Anonymous · Ginkgo',
    images: [],
    title: 'Without a technical background, is becoming an AI product manager really feasible?',
    body: 'I work in cross-border e-commerce operations and want to move into AI product. Every job posting asks for technical skills, which makes me hesitate. I would love to hear from people who have actually made the switch.',
    tags: ['AI Product', 'Non-technical background'],
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
    title: 'Moving from HR to AI ethics: what do I need to learn?',
    body: 'I have worked in recruiting for four years, focusing on AI hiring fairness and data compliance. I want to move into AI ethics but am not sure where to start learning.',
    tags: ['AI Ethics', 'Transition Path'],
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
    title: 'I used AI to cut our community weekly report from 3 hours to 40 minutes',
    body: 'Following the platform workflow approach, I split the report into a template plus human review, and the efficiency improved a lot. Turns out I can do this too!',
    tags: ['AI Operations', 'Portfolio'],
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
    title: 'I landed my first AI operations internship interview',
    body: 'After rewriting my operations experience into the language of AI, my resume finally got a response! Sharing this with anyone still hesitating.',
    tags: ['Good news', 'AI Operations'],
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
    title: 'Looking for a buddy to learn AI alongside me',
    body: 'I am looking for someone to check in with weekly, talk about progress, and keep each other accountable and encouraged. Is anyone else studying AI ethics or governance?',
    tags: ['Find a buddy', 'Weekly check-in'],
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
    text: 'I am in a very similar situation; last year I felt anxious too. I started with AI operations and put my content experience to use, and now I do part-time work. Take your time — you can do this.',
    createdAt: isoPast(8),
  },
  {
    id: 'pc_c2',
    postId: 'post_help_1',
    authorId: 'user_li',
    anonymous: true,
    anonymousHandle: 'Anonymous · Ginkgo',
    text: 'An education plus operations background is actually in high demand; both AI education and AI operations welcome that combination. Keep going!',
    createdAt: isoPast(7),
  },
  {
    id: 'pc_c3',
    postId: 'post_help_2',
    authorId: 'user_su',
    anonymous: false,
    text: 'AI product does not necessarily require writing code; understanding scenarios and collaboration matters more. Try building a small project to prove yourself.',
    createdAt: isoPast(3),
  },
  {
    id: 'pc_c4',
    postId: 'post_help_3',
    authorId: 'user_li',
    anonymous: false,
    text: 'You could start with two concrete scenarios — data compliance and AI hiring fairness — the materials are relatively easy to find.',
    createdAt: isoPast(1),
  },
  {
    id: 'pc_c5',
    postId: 'post_win_1',
    authorId: 'user_li',
    anonymous: false,
    text: 'Amazing! I use the same "template plus human review" approach, and the efficiency difference is real.',
    createdAt: isoPast(5),
  },
  {
    id: 'pc_c6',
    postId: 'post_win_2',
    authorId: 'user_zhou',
    anonymous: false,
    text: 'Congratulations! In the interview, remember to talk about how you translated your operations experience into the language of AI.',
    createdAt: isoPast(2),
  },
  {
    id: 'pc_c7',
    postId: 'post_win_2',
    authorId: 'user_su',
    anonymous: false,
    text: 'Sending you good luck! I need to start preparing my resume too.',
    createdAt: isoPast(1),
  },
];

// —— Circle posts ——
export const SEED_CIRCLE_POSTS: CirclePost[] = [
  {
    id: 'circle_1',
    authorId: 'user_zhou',
    authorName: 'Zhou Min',
    authorStage: 'Part-time transition',
    type: 'win',
    title: 'Milestone unlocked: a hands-on task scored 4.5',
    body: 'I just finished my first AI lesson-localization task and scored 4.5! From "why me?" to "why not me?" — I have taken the first step.',
    tags: ['Sharing results', 'Hands-on task'],
    kudosCount: 3,
    commentCount: 1,
    evidenceRef: 'ev_2',
    createdAt: isoPast(14),
  },
  {
    id: 'circle_2',
    authorId: 'user_zhou',
    authorName: 'Zhou Min',
    authorStage: 'Part-time transition',
    type: 'qa',
    title: 'Q: How do I explain a career gap in a return-to-work interview?',
    body: 'I have an AI operations interview next week and do not know how to talk about my two-year gap without sounding passive. I would love to hear others experiences.',
    tags: ['Interview', 'Returning after a break'],
    kudosCount: 5,
    commentCount: 2,
    createdAt: isoPast(6),
  },
  {
    id: 'circle_3',
    authorId: 'user_zhou',
    authorName: 'Zhou Min',
    authorStage: 'Part-time transition',
    type: 'cheer',
    title: 'A cheer for anyone still hesitating',
    body: 'If you are also hesitating about entering AI, do not be afraid. We are not starting from zero — we are bringing our past strengths to a new arena.',
    tags: ['Cheer', 'Peer buddy'],
    kudosCount: 7,
    commentCount: 0,
    createdAt: isoPast(2),
  },
];
