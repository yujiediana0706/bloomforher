import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  TrendingUp, 
  ShieldCheck, 
  Users, 
  Award, 
  Calendar, 
  Clock, 
  HeartHandshake,
  Bot
} from 'lucide-react';
import { UserProfile, EvidenceItem } from '../types';

interface Props {
  user: UserProfile;
  evidences: EvidenceItem[];
  onNavigate: (tab: string) => void;
  onOpenCoach: () => void;
}

export const Dashboard: React.FC<Props> = ({
  user,
  evidences,
  onNavigate,
  onOpenCoach
}) => {
  // Calculate confidence score (starts at 40 + weighted items, max 100)
  const confidenceScore = React.useMemo(() => {
    let score = 40;
    evidences.forEach(ev => {
      switch (ev.type) {
        case 'mentor_endorsement': score += 8; break;
        case 'assessment_result': score += 6; break;
        case 'project_work': score += 6; break;
        case 'task_outcome': score += 3; break;
        case 'skill_progress': score += 3; break;
        case 'milestone': score += 5; break;
        case 'community_kudos': score += 2; break;
      }
    });
    return Math.min(100, score);
  }, [evidences]);

  return (
    <div className="space-y-8">
      {/* Hero Welcome banner */}
      <div className="bg-gradient-to-r from-silver-100 via-white to-softpink-100/60 rounded-3xl p-6 sm:p-8 border border-silver-300 shadow-sm relative overflow-hidden">
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral-500/10 text-coral-500 text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to Your AI Career Enablement Arena</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slateblue-900 tracking-tight leading-tight mb-3">
            Your experience. A brighter future in the AI era.
          </h1>
          <p className="text-sm sm:text-base text-slateblue-700 font-normal leading-relaxed mb-6">
            Hello, <strong className="text-slateblue-900 font-semibold">{user.name}</strong>. Only 30% of women currently dare to ask "Why not me", often giving up before even stepping into the technical arena. At Bloom AI, your non-linear experience, maternal prioritization, and human communication are your strongest assets.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('skills')}
              className="px-5 py-2.5 rounded-xl bg-coral-500 hover:bg-coral-600 text-white font-bold text-sm shadow-md shadow-coral-500/25 flex items-center gap-2 transition-all hover:gap-3"
            >
              <span>Continue Journey (Step {user.journeyStep})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenCoach}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-silver-100 text-slateblue-900 border border-silver-300 font-semibold text-sm flex items-center gap-2 transition-all"
            >
              <Bot className="w-4 h-4 text-coral-500" />
              <span>Ask AI Coach</span>
            </button>
          </div>
        </div>

        {/* Decorative subtle metallic gradient circle */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-softpink-200/40 via-transparent to-transparent pointer-events-none hidden md:block" />
      </div>

      {/* Real-time Impact Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-silver-300 shadow-sm">
          <div className="text-silver-600 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-slateblue-700" />
            <span>Female AI Mentors</span>
          </div>
          <div className="text-2xl font-black text-slateblue-900">3 Verified</div>
          <div className="text-[11px] text-warmgreen font-semibold mt-1">100% Free · Community-supported</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-silver-300 shadow-sm">
          <div className="text-silver-600 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slateblue-700" />
            <span>Women Accompanied</span>
          </div>
          <div className="text-2xl font-black text-slateblue-900">162+ Returners</div>
          <div className="text-[11px] text-silver-600 font-medium mt-1">Across 14 countries</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-silver-300 shadow-sm">
          <div className="text-silver-600 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-slateblue-700" />
            <span>Evidence Items Logged</span>
          </div>
          <div className="text-2xl font-black text-slateblue-900">{evidences.length} Artifacts</div>
          <div className="text-[11px] text-coral-500 font-semibold mt-1">"I Can" Self-Proof Wall</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-silver-300 shadow-sm">
          <div className="text-silver-600 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-slateblue-700" />
            <span>Avg Confidence Uplift</span>
          </div>
          <div className="text-2xl font-black text-slateblue-900">+48%</div>
          <div className="text-[11px] text-warmgreen font-semibold mt-1">Self to AI calibration</div>
        </div>
      </div>

      {/* Main 2-column breakdown: Confidence Gauge vs Next Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Confidence Gauge Ring Card */}
        <div className="bg-white rounded-3xl p-6 border border-silver-300 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slateblue-900 text-base">Confidence Calibration</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-softpink-200 text-coral-500 font-bold">
                Self-Proof Index
              </span>
            </div>

            {/* Circular Gauge Display */}
            <div className="flex flex-col items-center justify-center my-4">
              <div className="relative w-40 h-40 flex items-center justify-center">
                {/* SVG Ring */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#EEF0F4"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#E8725C"
                    strokeWidth="10"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - confidenceScore / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black text-slateblue-900">{confidenceScore}</span>
                  <span className="text-[10px] text-silver-600 font-semibold uppercase tracking-wider">Out of 100</span>
                </div>
              </div>

              <div className="text-center mt-3">
                <span className="text-xs font-bold text-coral-500">
                  {confidenceScore >= 80 ? 'High Arena Efficacy ("Why not me!")' : 'Growing Momentum ("I have evidence")'}
                </span>
                <p className="text-[11px] text-silver-600 mt-1 max-w-xs mx-auto">
                  Calculated from verified mentor endorsements (+8), hands-on tasks (+3), and completed milestones (+5).
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('evidence')}
            className="w-full mt-4 py-2 text-xs font-bold text-slateblue-900 bg-silver-100 hover:bg-silver-200 rounded-xl transition-colors text-center"
          >
            View Your "I Can" Evidence Wall →
          </button>
        </div>

        {/* Top 3 Next Actions */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-silver-300 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slateblue-900 text-base">Recommended Next Actions</h3>
              <span className="text-xs text-silver-600 font-medium">Life Stage: {user.lifeStage} ({user.availableHoursPerWeek}h/wk)</span>
            </div>

            <div className="space-y-3">
              <div 
                onClick={() => onNavigate('skills')}
                className="p-4 rounded-2xl bg-silver-50 hover:bg-softpink-100/50 border border-silver-300 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-coral-500/10 text-coral-500 flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slateblue-900 group-hover:text-coral-500 transition-colors">
                      Review Your Dual-Bar Skills Calibration
                    </h4>
                    <p className="text-xs text-slateblue-700">
                      Compare your self-rating vs. evidence-based AI rating across 6 dimensions.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-silver-500 group-hover:text-coral-500 transition-all group-hover:translate-x-1" />
              </div>

              <div 
                onClick={() => onNavigate('tasks')}
                className="p-4 rounded-2xl bg-silver-50 hover:bg-softpink-100/50 border border-silver-300 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-warmgreen/20 text-warmgreen flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slateblue-900 group-hover:text-coral-500 transition-colors">
                      Submit Hands-on Task & Get Instant Rubric Feedback
                    </h4>
                    <p className="text-xs text-slateblue-700">
                      Try the educational prompt adaptation task (25 mins) to unlock task outcome evidence.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-silver-500 group-hover:text-coral-500 transition-all group-hover:translate-x-1" />
              </div>

              <div 
                onClick={() => onNavigate('community')}
                className="p-4 rounded-2xl bg-silver-50 hover:bg-softpink-100/50 border border-silver-300 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slateblue-900/10 text-slateblue-900 flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slateblue-900 group-hover:text-coral-500 transition-colors">
                      Book a Free 1:1 Session with Clara Lin (Ex-Meta AI)
                    </h4>
                    <p className="text-xs text-slateblue-700">
                      100% Free · Community-supported mentoring — zero payment or charges involved.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-silver-500 group-hover:text-coral-500 transition-all group-hover:translate-x-1" />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-silver-200 flex items-center justify-between text-xs text-silver-600">
            <span>Pausing is not elimination — progress is permanently recorded</span>
            <button
              type="button"
              onClick={() => onNavigate('plan')}
              className="font-bold text-coral-500 hover:underline"
            >
              Go to 30-Day Plan →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
