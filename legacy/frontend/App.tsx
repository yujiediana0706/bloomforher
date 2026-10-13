import React, { useState, useEffect } from 'react';
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
} from './types';
import { 
  DEMO_RETURNER, 
  DEMO_EXPLORER, 
  SEED_SKILLS_RESULT, 
  SEED_ROLE_MATCHES, 
  SEED_TASKS, 
  SEED_RETURN_PLAN, 
  SEED_EVIDENCES, 
  SEED_MENTORS, 
  SEED_BOOKINGS, 
  SEED_POSTS 
} from './services/mockSeedData';
import { ensureAuthenticated } from './services/firebase';
import { Navbar } from './components/Navbar';
import { JourneyProgressBanner } from './components/JourneyProgressBanner';
import { Dashboard } from './components/Dashboard';
import { Onboarding } from './components/Onboarding';
import { SkillsDiscovery } from './components/SkillsDiscovery';
import { AIOpportunities } from './components/AIOpportunities';
import { HandsOnLab } from './components/HandsOnLab';
import { ReturnPlan as ReturnPlanComponent } from './components/ReturnPlan';
import { Community } from './components/Community';
import { MySessions } from './components/MySessions';
import { EvidenceBank } from './components/EvidenceBank';
import { AICoachDrawer } from './components/AICoachDrawer';
import { ReadmeModal } from './components/ReadmeModal';
import { analyzeTransferableSkills, matchAIOpportunities } from './services/geminiService';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_RETURNER);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  
  // Core state items
  const [skillsResult, setSkillsResult] = useState<SkillsDiscoveryResult>(SEED_SKILLS_RESULT);
  const [roleMatches, setRoleMatches] = useState<RoleMatch[]>(SEED_ROLE_MATCHES);
  const [tasks, setTasks] = useState<HandsOnTask[]>(SEED_TASKS);
  const [plan, setPlan] = useState<ReturnPlan>(SEED_RETURN_PLAN);
  const [evidences, setEvidences] = useState<EvidenceItem[]>(SEED_EVIDENCES);
  const [mentors, setMentors] = useState<MentorProfile[]>(SEED_MENTORS);
  const [bookings, setBookings] = useState<Booking[]>(SEED_BOOKINGS);
  const [posts, setPosts] = useState<CirclePost[]>(SEED_POSTS);

  // Modals & drawers
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [coachInitialPrompt, setCoachInitialPrompt] = useState<string | undefined>();
  const [isReadmeOpen, setIsReadmeOpen] = useState(false);

  // Initialize Firebase Auth session automatically
  useEffect(() => {
    ensureAuthenticated().catch((err) => {
      console.warn('Firebase anonymous auth init:', err);
    });
  }, []);

  // Demo user switcher
  const handleSwitchUser = (type: 'returner' | 'explorer') => {
    if (type === 'returner') {
      setCurrentUser(DEMO_RETURNER);
      setSkillsResult(SEED_SKILLS_RESULT);
      setRoleMatches(SEED_ROLE_MATCHES);
      setTasks(SEED_TASKS);
      setPlan(SEED_RETURN_PLAN);
      setEvidences(SEED_EVIDENCES);
      setBookings(SEED_BOOKINGS);
      setCurrentTab('dashboard');
    } else {
      setCurrentUser(DEMO_EXPLORER);
      setEvidences([]);
      setBookings([]);
      setCurrentTab('onboarding');
    }
  };

  // Step selector from banner
  const handleSelectJourneyStep = (stepNumber: number) => {
    const tabMap: Record<number, string> = {
      1: 'onboarding',
      2: 'skills',
      3: 'opportunities',
      4: 'tasks',
      5: 'plan',
      6: 'community'
    };
    setCurrentTab(tabMap[stepNumber] || 'dashboard');
  };

  // Complete Onboarding -> Trigger AI analysis
  const handleOnboardingComplete = async (updatedFields: Partial<UserProfile>) => {
    const updatedUser = { ...currentUser, ...updatedFields, journeyStep: 2 };
    setCurrentUser(updatedUser);

    try {
      const skills = await analyzeTransferableSkills(
        updatedUser.backgroundSummary,
        updatedUser.lifeStage,
        updatedUser.confidenceSelfScores
      );
      setSkillsResult(skills);

      // Auto-generate first evidence
      const initialEvidence: EvidenceItem = {
        id: `ev-onboard-${Date.now()}`,
        userId: updatedUser.uid,
        type: 'assessment_result',
        title: 'Initial Skills Calibration: 6-Dimension AI Readiness Confirmed',
        detail: `Gemini verified your high-transferability competencies for the ${updatedUser.lifeStage} track.`,
        source: 'auto',
        tags: ['Skills Discovery', 'Calibration'],
        isPublic: true,
        createdAt: new Date().toISOString()
      };
      setEvidences(prev => [initialEvidence, ...prev]);

      const opps = await matchAIOpportunities(skills, updatedUser.lifeStage, updatedUser.availableHoursPerWeek);
      setRoleMatches(opps);
    } catch (err) {
      console.error('AI analysis after onboarding failed:', err);
    }

    setCurrentTab('skills');
  };

  // Task completed handler
  const handleTaskCompleted = (updatedTask: HandsOnTask, newEvidence: EvidenceItem) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    setEvidences(prev => [newEvidence, ...prev]);
    if (currentUser.journeyStep < 5) {
      setCurrentUser(prev => ({ ...prev, journeyStep: 5 }));
    }
  };

  // Plan task toggle
  const handlePlanTaskCheck = (taskId: string, completed: boolean, newEvidence?: EvidenceItem) => {
    setPlan(prev => ({
      ...prev,
      weeks: prev.weeks.map(w => ({
        ...w,
        practiceTasks: w.practiceTasks.map(t => t.id === taskId ? { ...t, completed } : t)
      }))
    }));

    if (newEvidence) {
      setEvidences(prev => [newEvidence, ...prev]);
    }
  };

  // Book slot with concurrency check & 5-session package consumption
  const handleBookSlot = (mentor: MentorProfile, slot: any, topic: string) => {
    // Check if slot is already booked (simulating Firestore 409 conflict check)
    if (slot.status === 'booked') {
      alert('Slot conflict (409): This slot was just booked by another coachee. Please choose another time.');
      return;
    }

    // Mark slot as booked
    setMentors(prev => prev.map(m => {
      if (m.id === mentor.id) {
        return {
          ...m,
          availableSlots: m.availableSlots.map(s => s.id === slot.id ? { ...s, status: 'booked' } : s)
        };
      }
      return m;
    }));

    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      mentorId: mentor.id,
      mentorName: mentor.name,
      mentorTitle: mentor.title,
      mentorAvatar: mentor.avatar,
      coacheeId: currentUser.uid,
      coacheeName: currentUser.name,
      slotId: slot.id,
      scheduledTime: slot.startAt,
      status: 'held',
      topic,
      createdAt: new Date().toISOString()
    };

    setBookings(prev => [newBooking, ...prev]);
    setCurrentUser(prev => ({
      ...prev,
      remainingRedemptions: Math.max(0, prev.remainingRedemptions - 1),
      journeyStep: 6
    }));

    alert(`Slot successfully held! Mentor will confirm shortly. Remaining package redemptions: ${currentUser.remainingRedemptions - 1}`);
    setCurrentTab('sessions');
  };

  // Mentor confirms booking
  const handleMentorConfirm = (bookingId: string) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: 'confirmed',
          meetingLink: 'https://meet.google.com/bloom-free-session'
        };
      }
      return b;
    }));
  };

  // Coachee confirms session completed -> releases
  const handleConfirmRelease = (bookingId: string) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: 'released',
          endorsement: `Elena demonstrated innate clarity in organizing complex prompts into enterprise SOPs.`
        };
      }
      return b;
    }));

    // Auto generate mentor endorsement evidence
    const endorsementEvidence: EvidenceItem = {
      id: `ev-endorse-${Date.now()}`,
      userId: currentUser.uid,
      type: 'mentor_endorsement',
      title: 'Mentor Endorsement Received',
      detail: '"Elena demonstrated innate clarity in organizing complex prompts into enterprise SOPs."',
      source: 'auto',
      tags: ['Mentor Endorsement', 'Verified'],
      isPublic: true,
      createdAt: new Date().toISOString()
    };
    setEvidences(prev => [endorsementEvidence, ...prev]);
  };

  // Coachee submits review
  const handleSubmitReview = (bookingId: string, rating: number, comment: string) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          review: {
            rating,
            comment,
            createdAt: new Date().toISOString()
          }
        };
      }
      return b;
    }));
  };

  // Circle Cheer post (at 3 cheers, trigger community_kudos evidence)
  const handleCheerPost = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const nextCheers = p.cheers + 1;
        if (nextCheers === 3 && p.authorId === currentUser.uid) {
          const kudosEvidence: EvidenceItem = {
            id: `ev-kudos-${Date.now()}`,
            userId: currentUser.uid,
            type: 'community_kudos',
            title: `Community Kudos: 3+ Cheers on "${p.title}"`,
            detail: 'Your authentic sharing inspired fellow returners in the Peer Circle!',
            source: 'auto',
            tags: ['Peer Circle', 'Community Kudos'],
            isPublic: true,
            createdAt: new Date().toISOString()
          };
          setEvidences(ePrev => [kudosEvidence, ...ePrev]);
        }
        return { ...p, cheers: nextCheers };
      }
      return p;
    }));
  };

  // Create circle post
  const handleCreatePost = (newPostData: any) => {
    const post: CirclePost = {
      id: `post-${Date.now()}`,
      ...newPostData,
      cheers: 0,
      cheeredBy: [],
      commentsCount: 0,
      createdAt: new Date().toISOString()
    };
    setPosts(prev => [post, ...prev]);
  };

  // Report content
  const handleReportContent = (targetId: string, reason: string) => {
    alert(`Thank you for keeping our community safe. Content report logged: "${reason}"`);
  };

  return (
    <div className="min-h-screen bg-[#EEF0F4] flex flex-col font-sans">
      {/* Global Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        evidenceCount={evidences.length}
        onOpenCoach={() => {
          setCoachInitialPrompt(undefined);
          setIsCoachOpen(true);
        }}
        onOpenReadme={() => setIsReadmeOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Horizontal 6-Step Journey Banner */}
        <JourneyProgressBanner
          currentStep={currentUser.journeyStep}
          onSelectStep={handleSelectJourneyStep}
        />

        {/* Tab Switcher */}
        {currentTab === 'dashboard' && (
          <Dashboard
            user={currentUser}
            evidences={evidences}
            onNavigate={setCurrentTab}
            onOpenCoach={() => {
              setCoachInitialPrompt(undefined);
              setIsCoachOpen(true);
            }}
          />
        )}

        {currentTab === 'onboarding' && (
          <Onboarding
            initialUser={currentUser}
            onComplete={handleOnboardingComplete}
          />
        )}

        {currentTab === 'skills' && (
          <SkillsDiscovery
            skillsResult={skillsResult}
            user={currentUser}
            onJumpToCoach={(prompt) => {
              setCoachInitialPrompt(prompt);
              setIsCoachOpen(true);
            }}
            onAdvanceToOpportunities={() => setCurrentTab('opportunities')}
          />
        )}

        {currentTab === 'opportunities' && (
          <AIOpportunities
            roles={roleMatches}
            onSelectRoleForTask={(roleTitle) => {
              setCurrentTab('tasks');
            }}
            onAskCoachAboutRole={(roleTitle) => {
              setCoachInitialPrompt(`How can I position my operations background for the "${roleTitle}" role?`);
              setIsCoachOpen(true);
            }}
          />
        )}

        {currentTab === 'tasks' && (
          <HandsOnLab
            tasks={tasks}
            onTaskCompleted={handleTaskCompleted}
          />
        )}

        {currentTab === 'plan' && (
          <ReturnPlanComponent
            plan={plan}
            user={currentUser}
            onTaskCheck={handlePlanTaskCheck}
            onUpdatePlan={setPlan}
          />
        )}

        {currentTab === 'community' && (
          <Community
            mentors={mentors}
            posts={posts}
            user={currentUser}
            onBookSlot={handleBookSlot}
            onCheerPost={handleCheerPost}
            onCreatePost={handleCreatePost}
            onReportContent={handleReportContent}
          />
        )}

        {currentTab === 'sessions' && (
          <MySessions
            bookings={bookings}
            onConfirmRelease={handleConfirmRelease}
            onSubmitReview={handleSubmitReview}
            onMentorConfirm={handleMentorConfirm}
          />
        )}

        {currentTab === 'evidence' && (
          <EvidenceBank
            evidences={evidences}
            user={currentUser}
            onAddManualEvidence={(item) => {
              const newEv: EvidenceItem = {
                id: `ev-manual-${Date.now()}`,
                ...item,
                createdAt: new Date().toISOString()
              };
              setEvidences(prev => [newEv, ...prev]);
            }}
            onShareToCircle={(evidence) => {
              handleCreatePost({
                authorId: currentUser.uid,
                authorName: currentUser.name,
                authorAvatar: currentUser.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
                authorStage: currentUser.lifeStage,
                type: 'win',
                title: `Unlocked Artifact: ${evidence.title}`,
                content: `Just generated verified evidence in Bloom AI: "${evidence.detail}". Moving from "Why me" to "Why not me"!`,
                tags: ['Evidence Wall', 'Win Sharing']
              });
              alert('Evidence shared to Peer Circle!');
              setCurrentTab('community');
            }}
          />
        )}
      </main>

      {/* Global AI Coach Drawer */}
      <AICoachDrawer
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
        user={currentUser}
        evidences={evidences}
        prefilledPrompt={coachInitialPrompt}
      />

      {/* Readme & Architecture Specs Modal */}
      <ReadmeModal
        isOpen={isReadmeOpen}
        onClose={() => setIsReadmeOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-12 border-t border-silver-300 bg-white py-6 text-center text-xs text-silver-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Bloom AI · Her Path — Google AI Builder Cup Submission (Sustainability & Social Impact)</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsReadmeOpen(true)}
              className="text-coral-500 font-bold hover:underline"
            >
              Architecture & 30s Voiceover
            </button>
            <span>•</span>
            <span className="font-semibold text-slateblue-900">100% Free · Community-supported</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
