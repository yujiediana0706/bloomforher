import { 
  UserProfile, 
  SkillsDiscoveryResult, 
  RoleMatch, 
  HandsOnTask, 
  ReturnPlan, 
  EvidenceItem, 
  MentorProfile, 
  Booking, 
  CirclePost 
} from '../types';

export const DEMO_RETURNER: UserProfile = {
  uid: 'demo_returner_32',
  name: 'Elena Rostova',
  email: 'demo.returner@Bloom.test',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  roleType: 'Setter',
  lifeStage: 'Postpartum Return',
  availableHoursPerWeek: 6,
  journeyStep: 5,
  backgroundSummary: '8 years experience as Senior Operations Lead and Project Coordinator in education & media. 18-month career pause for maternity & childcare. Skilled in stakeholder management, complex curriculum planning, cross-functional sprints, and workflow optimization.',
  confidenceSelfScores: {
    technicalSelfEfficacy: 3,
    aiToolReadiness: 4,
    careerGapConfidence: 2,
    adaptability: 7,
    communicationValue: 8,
    problemSolvingInAI: 4
  },
  remainingRedemptions: 4
};

export const DEMO_EXPLORER: UserProfile = {
  uid: 'demo_explorer_22',
  name: 'Maya Chen',
  email: 'demo.explorer@Bloom.test',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  roleType: 'Explorer',
  lifeStage: 'In-School Exploration',
  availableHoursPerWeek: 12,
  journeyStep: 1,
  backgroundSummary: 'Senior undergraduate in Communications & Psychology. Passionate about ethical technology and human-AI interaction, eager to launch into AI product workflows.',
  confidenceSelfScores: {
    technicalSelfEfficacy: 2,
    aiToolReadiness: 5,
    careerGapConfidence: 4,
    adaptability: 6,
    communicationValue: 7,
    problemSolvingInAI: 3
  },
  remainingRedemptions: 5
};

export const SEED_SKILLS_RESULT: SkillsDiscoveryResult = {
  uniqueValue: 'Elena transforms complex human workflows into scalable, high-accuracy AI operational pipelines. Her deep curriculum design, empathy-driven stakeholder coordination, and agile sprint instincts position her ideally for AI Operations & Prompt Engineering Strategy.',
  transferableSkills: [
    {
      id: 'skill-1',
      name: 'Systemic Workflow & SOP Architecting',
      evidence: 'Spearheaded 40-member cross-regional educational curriculum rollouts across 12 schools under tight quarterly deadlines.',
      aiRelevance: 96,
      narrative: 'AI systems rely heavily on structured human feedback (RLHF) and unambiguous workflow chaining. Your process discipline is precisely what enterprise AI deployment teams require.'
    },
    {
      id: 'skill-2',
      name: 'Structured Communication & Prompt Clarity',
      evidence: 'Authored 100+ pages of instructional guidelines reducing operational onboarding errors by 42%.',
      aiRelevance: 94,
      narrative: 'Prompt engineering is fundamentally pedagogical specification. Your clarity translates directly into high-fidelity AI agent instructions.'
    },
    {
      id: 'skill-3',
      name: 'Maternal Multitasking & Crisis Management',
      evidence: 'Successfully coordinated multi-stakeholder school board approvals while navigating family relocation and parental care.',
      aiRelevance: 91,
      narrative: 'Resilience under cognitive load and edge-case dispute resolution are directly mirrored in AI output validation and exception handling.'
    },
    {
      id: 'skill-4',
      name: 'Data-Informed Continuous Quality Iteration',
      evidence: 'Monitored customer feedback loops, weekly retention cohorts, and metric anomaly detection.',
      aiRelevance: 88,
      narrative: 'AI evaluation loops (Evals) require continuous quality curation and qualitative error triage.'
    }
  ],
  confidenceCalibration: [
    {
      dimension: 'Technical Self-Efficacy',
      selfScore: 3,
      aiScore: 8,
      evidenceRef: 'In project curriculum rollouts you already architected multi-tiered data schemas, which is exactly the systems-thinking capability AI roles need.'
    },
    {
      dimension: 'AI Tool Readiness',
      selfScore: 4,
      aiScore: 8,
      evidenceRef: 'You already formulate structured prompts and markdown checklists that mirror prompt template production workflows.'
    },
    {
      dimension: 'Career Gap Value',
      selfScore: 2,
      aiScore: 9,
      evidenceRef: 'Your 18-month maternal gap cultivated hyper-focused prioritization, high emotional intelligence, and calm crisis mitigation.'
    },
    {
      dimension: 'Domain Translation',
      selfScore: 5,
      aiScore: 9,
      evidenceRef: 'Bridging non-technical users to digital tools is 80% of enterprise generative AI change management.'
    },
    {
      dimension: 'Problem Decomposition',
      selfScore: 4,
      aiScore: 8,
      evidenceRef: 'You broke 6-month accreditation programs into weekly atomic deliverables, identical to AI agent tool-call chaining.'
    },
    {
      dimension: 'Ethical Quality Triage',
      selfScore: 5,
      aiScore: 9,
      evidenceRef: 'Evaluating safe, child-friendly learning materials mirrors AI bias and safety alignment red-teaming.'
    }
  ]
};

export const SEED_ROLE_MATCHES: RoleMatch[] = [
  {
    id: 'role-ai-ops',
    title: 'AI Operations & Prompt Flow Specialist',
    matchScore: 94,
    description: 'Bridges executive teams and foundation models by designing reliable prompt pipelines, evaluating model outputs, and coordinating human-in-the-loop validation.',
    whyFit: 'Directly leverages your proven 8-year track record in SOP authoring, instructional design, and quality assurance.',
    requiredSkills: ['Prompt Crafting', 'Human-in-the-Loop Evals', 'SOP Documentation', 'Exception Handling'],
    typicalWorkflows: [
      'Translating business requirements into repeatable system prompts',
      'Auditing model hallucination rate with structured rubric datasets',
      'Training non-technical staff to interact effectively with generative copilots'
    ],
    realWorldExamples: [
      'Building customer support triage flows at an EdTech or FinTech company',
      'Creating prompt libraries for automated regulatory report summaries'
    ],
    tradeoffs: 'Rapidly evolving tooling requires weekly curiosity, though coding is strictly optional.',
    isWomenFriendly: true,
    category: 'AI Operations'
  },
  {
    id: 'role-ai-product',
    title: 'Associate AI Product Strategist (Adoption)',
    matchScore: 89,
    description: 'Designs intuitive workflows where AI assists knowledge workers without increasing cognitive fatigue.',
    whyFit: 'Your high empathy for end-users prevents over-engineered tech-centric solutions.',
    requiredSkills: ['User Journey Mapping', 'AI Feasibility Scoping', 'Cross-functional Sprint Slicing'],
    typicalWorkflows: [
      'Interviewing subject-matter experts to locate repetitive friction points',
      'Prototyping zero-shot task mockups before requesting engineering hours',
      'Tracking user trust and AI recommendation adoption rates'
    ],
    realWorldExamples: [
      'Redesigning teacher onboarding using conversational assistant scaffolding',
      'Implementing automated summary widgets in healthcare admin portals'
    ],
    tradeoffs: 'Requires aligning multiple skeptical stakeholders with differing AI expectations.',
    isWomenFriendly: true,
    category: 'AI Product'
  },
  {
    id: 'role-ai-ethics',
    title: 'AI Ethics, Safety & Content Evaluation Lead',
    matchScore: 86,
    description: 'Audits generative model responses for safety, tone appropriateness, gender neutrality, and factual fidelity.',
    whyFit: 'Experience in educational compliance provides innate sensitivity to biased or hazardous model behaviors.',
    requiredSkills: ['Red Teaming', 'Policy Translation', 'Edge-case Detection', 'Taxonomy Tagging'],
    typicalWorkflows: [
      'Executing adversarial prompt testing against internal safety benchmarks',
      'Classifying borderline generative completions for fine-tuning sets',
      'Compiling weekly trust & safety risk memos for management'
    ],
    realWorldExamples: [
      'Auditing candidate screening AI prompts to eliminate gender bias filters',
      'Reviewing automated counseling chatbots for clinical boundary enforcement'
    ],
    tradeoffs: 'Emotionally demanding when reviewing toxic edge cases, but offers massive societal impact.',
    isWomenFriendly: true,
    category: 'AI Ethics & Alignment'
  }
];

export const SEED_TASKS: HandsOnTask[] = [
  {
    id: 'task-1',
    targetRole: 'AI Operations & Prompt Flow Specialist',
    title: 'AI-Assisted Educational Lesson Adaptation & Prompt Audit',
    estimatedMinutes: 25,
    scenario: 'A regional school network needs to localize a 5th-grade environmental science lesson on clean water for 3 distinct student reading levels (Remedial, On-Grade, Accelerated). You must write an AI prompt to generate these 3 variations and articulate your rubric trade-offs.',
    suggestedPrompt: 'Act as a Senior Curriculum Specialist. Given this base lesson text: [paste topic], generate 3 localized versions with distinct lexicons. Ensure emotional encouragement and clear real-world examples without factual dilution.',
    rubric: [
      'Clear system role & target audience constraints',
      'Explicit output structure with age-appropriate vocabulary limits',
      'Reasoned rationale for trade-offs regarding cognitive accessibility'
    ],
    userSubmission: 'Prompt Used:\n"You are an expert elementary pedagogical designer. Take this lesson: \'The Water Cycle & Urban Watersheds\'. Produce three distinct modules: 1) Level A (Scaffolded with visual analogies for English learners), 2) Level B (Core standard with guided reflection questions), 3) Level C (Advanced inquiry project). Keep tone encouraging, avoid clinical jargon, and format with markdown headings."\n\nTrade-off Analysis:\nI prioritized conversational relatability over exhaustive technical terminology. For Level A, I forced the model to replace terms like \'precipitation\' with \'rain and snowfall (precipitation)\' to balance standard vocabulary retention with immediate comprehension.',
    feedback: {
      highlights: [
        'Specifically quoted: "replace terms like \'precipitation\' with \'rain and snowfall\'" demonstrates outstanding pedagogical precision and audience empathy.',
        'Structured modular constraints (Level A, B, C) ensure reproducible output consistency.'
      ],
      actionableSuggestions: [
        'Consider appending a strict token count constraint or reading-flesch-kincaid index check into the prompt to guarantee automated verification.'
      ],
      skillGapAnalysis: [
        'Mastered: Structured Instruction Prompting',
        'Next step: Automated JSON Schema Output Validation'
      ],
      score: 5,
      evaluatedAt: '2025-02-14'
    }
  },
  {
    id: 'task-2',
    targetRole: 'Associate AI Product Strategist',
    title: 'Competitor Feature-Comparison Matrix via Generative Synthesis',
    estimatedMinutes: 30,
    scenario: 'Synthesize three leading AI productivity assistants for working mothers returning to office schedules. Build a 4-column structured matrix highlighting privacy guards, asynchronous scheduling, and time-to-value.',
    suggestedPrompt: 'Compare Notion AI, ChatGPT Team, and Claude Pro specifically for a working mother returning to corporate project management with only 10 hours of weekly synchronous bandwidth. Output markdown table and 3 key trade-off recommendations.',
    rubric: [
      'Targeted evaluation parameters relevant to flexible schedules',
      'Objective synthesis without vendor cheerleading',
      'Concrete action advice for returning professionals'
    ],
    userSubmission: 'Synthesized 3 tools across: 1. Asynch meeting extraction, 2. Cognitive load reduction, 3. Enterprise data security. Recommended Claude for deep contextual document synthesis of missed company memos, and Notion AI for automated daily task triage.',
    feedback: {
      highlights: [
        'Directly addressed the working mother returning context with zero fluff.',
        'High business acuity in distinguishing asynchronous synthesis from live assistant capabilities.'
      ],
      actionableSuggestions: [
        'Add a column assessing monthly cost-benefit ratio for independent budget justification.'
      ],
      skillGapAnalysis: [
        'Mastered: Product Feature Synthesis',
        'Next step: ROI Metric Quantification'
      ],
      score: 4.8,
      evaluatedAt: '2025-02-16'
    }
  },
  {
    id: 'task-3',
    targetRole: 'AI Ethics, Safety & Content Evaluation Lead',
    title: 'Bias Audit of Automated Candidate Resumes Review Prompt',
    estimatedMinutes: 35,
    scenario: 'Examine a standard recruiting prompt: "Score candidate suitability 1-10 based on continuous career tenure." Identify 3 implicit gender biases against maternity leave and propose an audited, inclusive replacement prompt.',
    suggestedPrompt: 'Audit the following recruiter prompt for maternal penalty and career-gap penalization. Redesign the prompt with objective outcome-based evaluation criteria.',
    rubric: [
      'Identification of structural maternity gap bias',
      'Concrete replacement prompt emphasizing cumulative impact over continuous tenure',
      'Explainable scoring guidelines'
    ]
  }
];

export const SEED_RETURN_PLAN: ReturnPlan = {
  lifeStage: 'Postpartum Return',
  recommendedWeeklyHours: 6,
  totalWeeks: 4,
  contingencyNote: 'Gentle reminder: Life with childcare is inherently unpredictable. Pausing is not elimination — your accumulated evidence is permanently locked in.',
  weeks: [
    {
      week: 1,
      theme: 'Uncovering Transferable Superpowers & Foundational AI Fluency',
      weeklyHours: 5,
      learningResources: [
        'Google GenAI Foundation Models & Prompt Design Micro-Course (45 mins)',
        'Understanding Temperature, Hallucination & System Instructions (30 mins)'
      ],
      practiceTasks: [
        { id: 'p-1', title: 'Complete Skills Discovery & calibration check', estimatedHours: 1, completed: true, type: 'milestone' },
        { id: 'p-2', title: 'Run 5 comparative prompts across reasoning tiers', estimatedHours: 2, completed: true, type: 'practice' },
        { id: 'p-3', title: 'Curate 3 personal career stories using STAR+AI framework', estimatedHours: 2, completed: true, type: 'learning' }
      ],
      jobSearchMilestones: ['Update LinkedIn headline with: AI Operations & Workflow Strategist'],
      interruptible: true
    },
    {
      week: 2,
      theme: 'Hands-on Execution & Building First Evidence Artifacts',
      weeklyHours: 6,
      learningResources: [
        'Human-in-the-Loop SOP Documentation Framework (45 mins)',
        'Designing Fail-Safe Prompts for Non-Technical Users (30 mins)'
      ],
      practiceTasks: [
        { id: 'p-4', title: 'Complete Hands-on Task 1: Educational Lesson Adaptation', estimatedHours: 2.5, completed: true, type: 'practice' },
        { id: 'p-5', title: 'Complete Hands-on Task 2: Competitor Synthesis Matrix', estimatedHours: 2.5, completed: true, type: 'practice' },
        { id: 'p-6', title: 'Log 2 task outcome entries into Evidence Bank', estimatedHours: 1, completed: true, type: 'milestone' }
      ],
      jobSearchMilestones: ['Bookmark 5 remote AI Operations openings for market pulse'],
      interruptible: true
    },
    {
      week: 3,
      theme: 'Community Mentorship & Real-World Calibration',
      weeklyHours: 5.5,
      learningResources: [
        'How to Ask Impactful Questions in a 30-min Mentor Session',
        'Navigating Career Gap Explanations with Quiet Confidence'
      ],
      practiceTasks: [
        { id: 'p-7', title: 'Book 1:1 Free Mentoring session with Clara Lin', estimatedHours: 1, completed: true, type: 'practice' },
        { id: 'p-8', title: 'Attend session & receive Mentor Endorsement evidence', estimatedHours: 1.5, completed: true, type: 'milestone' },
        { id: 'p-9', title: 'Share 1 Win artifact to the Peer Circle', estimatedHours: 1, completed: false, type: 'learning' }
      ],
      jobSearchMilestones: ['Request peer referral review from Circle accountability partner'],
      interruptible: true
    },
    {
      week: 4,
      theme: 'Targeted Outreach & Interview Readiness',
      weeklyHours: 6,
      learningResources: [
        'Portfolio Presentation: Demonstrating AI Operations in 3 Slides',
        'Negotiating Flexible & Asynchronous Working Hours'
      ],
      practiceTasks: [
        { id: 'p-10', title: 'Export Evidence Bank portfolio showcase', estimatedHours: 2, completed: false, type: 'milestone' },
        { id: 'p-11', title: 'Practice 3 behavioral scenario questions with AI Coach', estimatedHours: 2, completed: false, type: 'practice' },
        { id: 'p-12', title: 'Submit 2 tailored applications with project evidence links', estimatedHours: 2, completed: false, type: 'practice' }
      ],
      jobSearchMilestones: ['Celebrate month completion on Peer Circle wall'],
      interruptible: true
    }
  ]
};

export const SEED_EVIDENCES: EvidenceItem[] = [
  {
    id: 'ev-1',
    userId: 'demo_returner_32',
    type: 'assessment_result',
    title: 'Skills Calibration: 6-Dimension AI Readiness Confirmed',
    detail: 'Gemini calibrated your technical self-efficacy from self-assessed 3 to evidence-backed 8, highlighting your 8-year system design rigor.',
    source: 'auto',
    tags: ['Skills Discovery', 'Calibration', 'AI Operations'],
    isPublic: true,
    createdAt: '2025-02-10T09:00:00Z'
  },
  {
    id: 'ev-2',
    userId: 'demo_returner_32',
    type: 'task_outcome',
    title: 'Hands-on Lab: Educational Prompt Architecture (Score: 5/5)',
    detail: 'Designed 3-tiered localized lesson adaptation prompt with clear cognitive trade-offs and zero factual loss.',
    source: 'auto',
    tags: ['Prompt Engineering', 'Hands-on Lab', 'Quality SOP'],
    isPublic: true,
    createdAt: '2025-02-14T14:30:00Z'
  },
  {
    id: 'ev-3',
    userId: 'demo_returner_32',
    type: 'task_outcome',
    title: 'Hands-on Lab: AI Tool Synthesis Matrix (Score: 4.8/5)',
    detail: 'Evaluated Notion AI, ChatGPT Team, and Claude Pro with actionable focus on flexible asynchronous bandwidth.',
    source: 'auto',
    tags: ['Product Strategy', 'Matrix Analysis'],
    isPublic: false,
    createdAt: '2025-02-16T11:15:00Z'
  },
  {
    id: 'ev-4',
    userId: 'demo_returner_32',
    type: 'mentor_endorsement',
    title: 'Clara Lin (Ex-Big Tech AI PM, Mom of 2) Endorsement',
    detail: '"Elena possesses exceptional clarity in decomposing chaotic enterprise requirements into neat, verified prompt workflows. Any AI team would benefit from her operational maturity."',
    source: 'auto',
    tags: ['Mentor Endorsement', 'Clara Lin', 'Verified'],
    isPublic: true,
    createdAt: '2025-02-18T16:00:00Z'
  },
  {
    id: 'ev-5',
    userId: 'demo_returner_32',
    type: 'skill_progress',
    title: 'Plan Sprint: Completed 100% of Week 1 & 2 Milestones',
    detail: 'Checked off 6 tasks within the 6-hour weekly boundary, proving sustainable postpartum return rhythm.',
    source: 'auto',
    tags: ['Return Plan', 'Milestone', 'Discipline'],
    isPublic: false,
    createdAt: '2025-02-19T10:00:00Z'
  },
  {
    id: 'ev-6',
    userId: 'demo_returner_32',
    type: 'community_kudos',
    title: 'Community Kudos: 3+ Cheers on "Why Career Gaps Build AI Resilience"',
    detail: 'Your authentic sharing received enthusiastic applause and heartfelt comments from 3 fellow mothers navigating return transitions.',
    source: 'auto',
    tags: ['Peer Circle', 'Community Kudos', 'Empathy'],
    isPublic: true,
    createdAt: '2025-02-20T18:20:00Z'
  },
  {
    id: 'ev-7',
    userId: 'demo_returner_32',
    type: 'project_work',
    title: 'Real-world Artifact: Enterprise AI Onboarding Checklist',
    detail: 'A 4-page SOP template for guiding customer operations agents to safely adopt generative summaries with fallback escalation rules.',
    source: 'manual',
    tags: ['Portfolio', 'SOP Template', 'Enterprise'],
    isPublic: true,
    createdAt: '2025-02-21T08:45:00Z'
  },
  {
    id: 'ev-8',
    userId: 'demo_returner_32',
    type: 'milestone',
    title: 'Unlocked: Level 1 AI Enablement Certification',
    detail: 'Successfully demonstrated competencies across Discovery, Prompt Audits, and Peer Support.',
    source: 'auto',
    tags: ['Milestone', 'Certification'],
    isPublic: true,
    createdAt: '2025-02-22T12:00:00Z'
  }
];

export const SEED_MENTORS: MentorProfile[] = [
  {
    id: 'mentor-1',
    name: 'Clara Lin',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    title: 'Former Staff AI Product Manager @ Meta, Mom of Two',
    company: 'Meta (Alum) & AI Advisory',
    school: 'Stanford University B.S. CS',
    isVerified: true,
    bio: 'Returned to high-tempo AI product leadership twice following 12-month maternal leaves. Deeply passionate about helping women turn parental emotional resilience into unfair advantages in AI orchestration.',
    topics: ['AI Product Strategy', 'Postpartum Return', 'Navigating Career Gaps', 'Stakeholder Framing'],
    sessionCount: 68,
    rating: 5.0,
    impactWomenCount: 52,
    credentialDocName: 'clara_lin_verified_credentials.pdf',
    availableSlots: [
      { id: 'slot-1-1', mentorId: 'mentor-1', startAt: 'Tomorrow, 10:00 AM EST', endAt: 'Tomorrow, 10:45 AM EST', status: 'available' },
      { id: 'slot-1-2', mentorId: 'mentor-1', startAt: 'Thursday, 2:00 PM EST', endAt: 'Thursday, 2:45 PM EST', status: 'available' },
      { id: 'slot-1-3', mentorId: 'mentor-1', startAt: 'Friday, 11:30 AM EST', endAt: 'Friday, 12:15 PM EST', status: 'available' },
      { id: 'slot-1-4', mentorId: 'mentor-1', startAt: 'Next Monday, 4:00 PM EST', endAt: 'Next Monday, 4:45 PM EST', status: 'available' },
      { id: 'slot-1-5', mentorId: 'mentor-1', startAt: 'Next Wednesday, 1:00 PM EST', endAt: 'Next Wednesday, 1:45 PM EST', status: 'available' }
    ],
    reviews: [
      {
        authorName: 'Elena R.',
        rating: 5,
        comment: 'Clara completely eliminated my fear of the 18-month resume gap. She showed me how to frame my operations background in AI language. Truly transformative.',
        date: '2025-02-18'
      },
      {
        authorName: 'Sarah K.',
        rating: 5,
        comment: 'Practical, warm, and zero technical arrogance. She helped me land my first AI Operations offer.',
        date: '2025-01-28'
      }
    ]
  },
  {
    id: 'mentor-2',
    name: 'Maya Zhou',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&auto=format&fit=crop&q=80',
    title: 'Founder & CEO @ FairBloom AI, Angel Investor',
    company: 'FairBloom AI (YC Alum)',
    school: 'MIT Media Lab M.S.',
    isVerified: true,
    bio: 'Founder building trustworthy synthetic evaluation benchmarks. Dedicated to expanding female equity in technical venture capital and AI architecture.',
    topics: ['AI Entrepreneurship', 'Ethics & Bias Audits', 'Portfolio Reviews', 'Fundraising as a Woman in Tech'],
    sessionCount: 45,
    rating: 4.9,
    impactWomenCount: 39,
    credentialDocName: 'maya_zhou_credentials.pdf',
    availableSlots: [
      { id: 'slot-2-1', mentorId: 'mentor-2', startAt: 'Tomorrow, 3:00 PM EST', endAt: 'Tomorrow, 3:45 PM EST', status: 'available' },
      { id: 'slot-2-2', mentorId: 'mentor-2', startAt: 'Thursday, 10:00 AM EST', endAt: 'Thursday, 10:45 AM EST', status: 'available' },
      { id: 'slot-2-3', mentorId: 'mentor-2', startAt: 'Next Tuesday, 5:00 PM EST', endAt: 'Next Tuesday, 5:45 PM EST', status: 'available' },
      { id: 'slot-2-4', mentorId: 'mentor-2', startAt: 'Next Thursday, 2:30 PM EST', endAt: 'Next Thursday, 3:15 PM EST', status: 'available' },
      { id: 'slot-2-5', mentorId: 'mentor-2', startAt: 'Next Friday, 11:00 AM EST', endAt: 'Next Friday, 11:45 AM EST', status: 'available' }
    ],
    reviews: [
      {
        authorName: 'Chloe T.',
        rating: 5,
        comment: 'Maya helped me restructure my AI ethics prompt rubric. Her feedback gave me the confidence to pitch to venture studios.',
        date: '2025-02-05'
      }
    ]
  },
  {
    id: 'mentor-3',
    name: 'Iris Su',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&auto=format&fit=crop&q=80',
    title: 'Head of AI Operations & Human-in-the-Loop',
    company: 'Synthetix Cloud',
    school: 'UC Berkeley B.A. CogSci',
    isVerified: true,
    bio: 'Pioneered AI evaluation data loops for Fortune 500 rollouts. Self-taught practitioner who transitioned from humanities to leading a 25-person AI operations department.',
    topics: ['Non-Technical AI Transition', 'Prompt Crafting Mastery', 'Interview Coaching', 'Early-Career Navigation'],
    sessionCount: 82,
    rating: 5.0,
    impactWomenCount: 71,
    credentialDocName: 'iris_su_credentials.pdf',
    availableSlots: [
      { id: 'slot-3-1', mentorId: 'mentor-3', startAt: 'Wednesday, 9:00 AM EST', endAt: 'Wednesday, 9:45 AM EST', status: 'available' },
      { id: 'slot-3-2', mentorId: 'mentor-3', startAt: 'Thursday, 4:00 PM EST', endAt: 'Thursday, 4:45 PM EST', status: 'available' },
      { id: 'slot-3-3', mentorId: 'mentor-3', startAt: 'Friday, 1:00 PM EST', endAt: 'Friday, 1:45 PM EST', status: 'available' },
      { id: 'slot-3-4', mentorId: 'mentor-3', startAt: 'Next Monday, 11:00 AM EST', endAt: 'Next Monday, 11:45 AM EST', status: 'available' },
      { id: 'slot-3-5', mentorId: 'mentor-3', startAt: 'Next Wednesday, 3:30 PM EST', endAt: 'Next Wednesday, 4:15 PM EST', status: 'available' }
    ],
    reviews: [
      {
        authorName: 'Danielle M.',
        rating: 5,
        comment: 'Iris proved to me that not writing code is NOT a barrier to high-value AI roles. She reviewed my task outputs line by line!',
        date: '2025-02-12'
      }
    ]
  }
];

export const SEED_BOOKINGS: Booking[] = [
  {
    id: 'book-1',
    mentorId: 'mentor-1',
    mentorName: 'Clara Lin',
    mentorTitle: 'Former Staff AI Product Manager @ Meta, Mom of Two',
    mentorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    coacheeId: 'demo_returner_32',
    coacheeName: 'Elena Rostova',
    slotId: 'slot-historic-1',
    scheduledTime: 'Feb 18, 2025 · 10:00 AM EST',
    status: 'released',
    meetingLink: 'https://meet.google.com/abc-bloom-herpath',
    topic: 'Overcoming the 18-month maternity gap narrative & framing AI SOP experience',
    userNotes: 'Looking to translate education operations into AI Ops workflows.',
    review: {
      rating: 5,
      comment: 'Clara completely eliminated my fear of the 18-month resume gap. She showed me how to frame my operations background in AI language. Truly transformative.',
      createdAt: '2025-02-18T12:30:00Z'
    },
    endorsement: 'Elena possesses exceptional clarity in decomposing chaotic enterprise requirements into neat, verified prompt workflows. Any AI team would benefit from her operational maturity.',
    createdAt: '2025-02-15T08:00:00Z'
  },
  {
    id: 'book-2',
    mentorId: 'mentor-3',
    mentorName: 'Iris Su',
    mentorTitle: 'Head of AI Operations & Human-in-the-Loop',
    mentorAvatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&auto=format&fit=crop&q=80',
    coacheeId: 'demo_returner_32',
    coacheeName: 'Elena Rostova',
    slotId: 'slot-historic-2',
    scheduledTime: 'Feb 12, 2025 · 2:00 PM EST',
    status: 'released',
    meetingLink: 'https://meet.google.com/xyz-bloom-herpath',
    topic: 'Hands-on task review: Educational Prompt Rubric trade-offs',
    userNotes: 'Wanted feedback on my first task submission.',
    review: {
      rating: 5,
      comment: 'Super sharp guidance on avoiding over-complicated prompt chains. Iris is wonderful!',
      createdAt: '2025-02-12T16:00:00Z'
    },
    endorsement: 'Elena demonstrated innate capability in balancing high-standard pedagogical output with clear edge-case handling.',
    createdAt: '2025-02-10T11:00:00Z'
  }
];

export const SEED_POSTS: CirclePost[] = [
  {
    id: 'post-1',
    authorId: 'demo_returner_32',
    authorName: 'Elena Rostova',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    authorStage: 'Postpartum Return',
    type: 'win',
    title: 'From "Why me" to "Why not me": Completed my first AI Prompt Audit!',
    content: 'After 18 months solely focusing on my baby, opening a technical lab was terrifying. But as soon as I treated prompt engineering as pedagogical curriculum design, everything clicked. In project X we already did Y, which is exactly the Z capability AI roles need. Just unlocked my first evidence badge!',
    tags: ['Win Sharing', 'Postpartum Return', 'Evidence Unlocked', 'AI Operations'],
    cheers: 4,
    cheeredBy: ['user-a', 'user-b', 'user-c', 'mentor-1'],
    commentsCount: 3,
    linkedEvidenceId: 'ev-2',
    createdAt: '2025-02-20T14:10:00Z'
  },
  {
    id: 'post-2',
    authorId: 'user-hannah',
    authorName: 'Hannah Vance',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    authorStage: 'Career Pivot',
    type: 'qa',
    title: 'How do you structure study hours when your toddler refuses naps?',
    content: 'Enrolled in the 30-day Return Plan with 6 hours/week. Yesterday was rough and I couldn\'t finish task 3. The Coach reminded me that "Pausing is not elimination", but would love to hear practical micro-sprint tips from moms who made it through!',
    tags: ['Mutual-Help Q&A', 'Time Management', 'Gentle Pacing'],
    cheers: 8,
    cheeredBy: ['demo_returner_32'],
    commentsCount: 6,
    createdAt: '2025-02-22T09:30:00Z'
  },
  {
    id: 'post-3',
    authorId: 'mentor-1',
    authorName: 'Clara Lin (Mentor)',
    authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    authorStage: 'Alum & Mentor',
    type: 'opportunity',
    title: 'Remote AI Quality Evaluator & Prompt Lead opening @ partner EdTech',
    content: 'Our alumni network is hiring 2 part-time (15-20 hrs/week) AI Workflow leads. Highly friendly to returners with strong background in humanities or education. No coding interview. Comment below or connect with me during our free 1:1 sessions!',
    tags: ['Opportunity Referral', 'Remote AI', 'Returner Friendly'],
    cheers: 15,
    cheeredBy: ['demo_returner_32', 'user-hannah'],
    commentsCount: 9,
    createdAt: '2025-02-21T18:00:00Z'
  }
];
