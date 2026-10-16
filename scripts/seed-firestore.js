// Import seed data into Firestore. Run this on Cloud Run
// (it may fail locally because of network restrictions).
// Usage: node scripts/seed-firestore.js

const admin = require('firebase-admin');
const fs = require('fs');

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '/Users/yujiejiang/gcp-keys/rebloom-backend.json';
const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'buildercup2026-511504';

const key = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(key),
  projectId: projectId,
});

const db = admin.firestore();

// Seed data (copied from mockData.ts with the TypeScript types removed)
const SEED_DATA = {
  users: [
    {
      uid: 'demo_returner',
      name: 'Lin Zhixia',
      email: 'demo.returner@rebloom.ai',
      currentRole: 'Internet Operations',
      targetRole: 'AI Operations',
      skills: ['Project Management', 'Content Strategy', 'Data Analysis'],
      goals: ['Return to work', 'Master AI tools'],
      constraints: {
        returnToWork: true,
        newIndustry: true,
        flexibility: true,
        weeklyHours: 6,
      },
      segment: 'setter',
      lifeStage: 'returning_parent',
      confidenceSelf: 5,
      journeyStep: 5,
      coffeeAvailability: [{ dayOfWeek: 2, timeRange: '20:00-21:00' }],
      communityAgreed: true,
      backgroundSummary: 'Returning after a career break; previously worked in operations at an internet company and wants to move into AI.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      uid: 'demo_explorer',
      name: 'Chen Siyuan',
      email: 'demo.explorer@rebloom.ai',
      currentRole: 'Recent Graduate',
      targetRole: 'AI Product',
      skills: ['Writing', 'Communication'],
      goals: ['Find a direction', 'Enter the AI industry'],
      constraints: {
        returnToWork: false,
        newIndustry: true,
        flexibility: true,
        weeklyHours: 10,
      },
      segment: 'explorer',
      lifeStage: 'student',
      confidenceSelf: 4,
      journeyStep: 2,
      coffeeAvailability: [{ dayOfWeek: 6, timeRange: '14:00-15:00' }],
      communityAgreed: true,
      backgroundSummary: 'About to graduate, interested in AI but not sure where to start.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  skillProfiles: [
    {
      uid: 'demo_returner',
      transferableSkills: [
        {
          id: 'ai_sk_1',
          name: 'Process Structuring and Breakdown',
          evidence: 'In your "internet operations" experience you already turned complex work into executable steps.',
          aiRelevance: 90,
          narrative: 'In your past work you already turned scattered information into actionable steps—this is the core skill AI workflow design needs.',
        },
        {
          id: 'ai_sk_2',
          name: 'Communication and Requirements Translation',
          evidence: 'You have long had to align information and expectations across different roles.',
          aiRelevance: 85,
          narrative: 'In collaboration you already translated what different people said into a shared language—a key AI skill.',
        },
      ],
      uniqueValue: 'You are currently in a "returning after a break" stage. Your unique value is translating real past experience into the language of AI workflows—this is not starting from zero, it is bringing your abilities to a new arena.',
      confidenceCalibration: [
        { dimension: 'Technical self-efficacy', selfScore: 5, aiScore: 9, evidenceRef: 'You already delivered systematic breakdown and execution in real projects.' },
        { dimension: 'AI tool readiness', selfScore: 6, aiScore: 8, evidenceRef: 'You are willing to start learning about AI tools—already a starting point for AI operations.' },
      ],
      createdAt: new Date().toISOString(),
    },
  ],
  opportunityReports: [
    {
      uid: 'demo_returner',
      roleMatches: [
        {
          id: 'ai_role_ops',
          title: 'AI Operations',
          matchScore: 90,
          description: 'Bring AI capabilities into concrete business processes: design prompt templates, build content and service workflows, monitor output quality and iterate.',
          whyFit: 'Your structuring and collaboration skills match closely, and no programming background is required.',
          requiredSkills: ['Prompt design', 'Workflow building', 'Cross-functional collaboration', 'Data review', 'Quality assessment'],
          typicalWorkflows: ['Map the scenario -> design a template -> small pilot -> collect feedback -> iterate and roll out'],
          realWorldExamples: ['An education company used AI operations to cut Q&A response time from 2 days to 2 hours.'],
          tradeoffs: 'Pros: low barrier, high demand, flexible. Cons: you must keep up with changing tools.',
          category: 'AI Operations',
        },
      ],
      womenFriendlyTracks: [
        { title: 'AI Operations', reason: 'Moderate barrier, high demand, supports flexible and remote work.' },
        { title: 'AI Education', reason: 'Values communication and teaching; a natural fit for education/content backgrounds.' },
      ],
      genderRiskHints: [
        { scenario: 'Worried about being questioned on a maternity/career gap', gentleAdvice: 'No need to hide it; frame the gap as capability built in another setting.' },
      ],
      createdAt: new Date().toISOString(),
    },
  ],
  returnPlans: [
    {
      uid: 'demo_returner',
      paceLabel: 'Returning after a break',
      weeklyHours: 6,
      totalWeeks: 4,
      interruptibleStages: [1, 2, 3, 4],
      returnPlaybook: 'If you need to pause, run the "8-week return plan": split the 4 weeks of tasks by priority into 8 weeks, keep only one core task per week—pausing is not eliminating.',
      weeks: [
        {
          week: 1,
          theme: 'Build basic familiarity with AI tools',
          weeklyHours: 6,
          learningResources: ['Week 1 topic materials and case list'],
          practiceTasks: [
            { id: 'ai_pt_1_1', week: 1, title: 'Use AI to organize materials once', category: 'practice', estimatedHours: 3, completed: false },
          ],
          jobSearchMilestones: ['Complete the week 1 review'],
          interruptible: true,
        },
      ],
      createdAt: new Date().toISOString(),
    },
  ],
  evidences: [
    {
      id: 'ev_seed_1',
      uid: 'demo_returner',
      type: 'task_outcome',
      title: 'Completed an AI task: competitor analysis',
      detail: 'Completed a full competitor analysis with AI and received a 4.8 score.',
      source: 'auto',
      tags: ['AI Operations', 'Competitor Analysis'],
      isPublic: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ev_seed_2',
      uid: 'demo_returner',
      type: 'mentor_endorsement',
      title: 'Mentor endorsement: structuring skills',
      detail: 'The mentor rated your structuring thinking and execution as outstanding.',
      source: 'auto',
      tags: ['Mentor', 'Structuring'],
      isPublic: true,
      createdAt: new Date().toISOString(),
    },
  ],
  plazaPosts: [
    {
      id: 'post_seed_1',
      authorId: 'demo_returner',
      anonymous: true,
      anonymousHandle: 'Camellia_ReturningParent',
      title: 'First day back, I used AI to organize an industry report',
      body: 'Today was my first day back at work. I used an AI tool to put together an industry report in 30 minutes, much faster than expected. I am still a bit rusty, but I feel myself slowly getting back on track.',
      images: [],
      tags: ['Returning after a break', 'AI Tools'],
      status: 'open',
      kudosCount: 5,
      commentCount: 3,
      willingToHelpCount: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

async function seed() {
  console.log('Starting to import seed data into Firestore...');

  for (const [collection, docs] of Object.entries(SEED_DATA)) {
    const batch = db.batch();
    let count = 0;

    for (const doc of docs) {
      const id = doc.id || doc.uid || doc.postId || `seed_${Date.now()}_${count}`;
      const ref = db.collection(collection).doc(id);
      batch.set(ref, doc, { merge: true });
      count++;
    }

    await batch.commit();
    console.log(`✅ ${collection}: ${count} records`);
  }

  console.log('Seed data import complete');
}

seed().then(() => process.exit(0)).catch((e) => {
  console.error('Import failed:', e.message);
  process.exit(1);
});
