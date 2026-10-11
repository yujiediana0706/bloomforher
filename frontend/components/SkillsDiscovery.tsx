import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  Quote, 
  CheckCircle2, 
  Bot, 
  HelpCircle,
  Share2
} from 'lucide-react';
import { SkillsDiscoveryResult, UserProfile } from '../types';

interface Props {
  skillsResult: SkillsDiscoveryResult;
  user: UserProfile;
  onJumpToCoach: (initialPrompt: string) => void;
  onAdvanceToOpportunities: () => void;
}

export const SkillsDiscovery: React.FC<Props> = ({
  skillsResult,
  user,
  onJumpToCoach,
  onAdvanceToOpportunities
}) => {
  return (
    <div className="space-y-8">
      {/* Top Banner with Unique Value Summary */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-silver-300 shadow-sm relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral-500/10 text-coral-500 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Journey ② · Transferable Superpowers Unlocked</span>
          </div>

          <h2 className="text-xl sm:text-3xl font-extrabold text-slateblue-900 tracking-tight leading-snug mb-3">
            Your Unique Value Proposition in the AI Era
          </h2>

          <div className="p-4 rounded-2xl bg-gradient-to-r from-silver-100 to-softpink-100/70 border border-silver-300 mb-6">
            <p className="text-sm text-slateblue-900 leading-relaxed font-medium italic">
              "{skillsResult.uniqueValue}"
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onJumpToCoach("Can you help me refine my transferable skills for an AI Operations interview?")}
              className="px-4 py-2 bg-coral-500 hover:bg-coral-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
            >
              <Bot className="w-4 h-4" />
              <span>Chat with AI Coach to Refine Profile</span>
            </button>
            <button
              type="button"
              onClick={onAdvanceToOpportunities}
              className="px-4 py-2 bg-silver-100 hover:bg-silver-200 text-slateblue-900 rounded-xl text-xs font-bold flex items-center gap-2 border border-silver-300 transition-all"
            >
              <span>Explore Matched AI Opportunities →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transferable Skills Cards */}
      <div>
        <h3 className="text-lg font-bold text-slateblue-900 mb-4 flex items-center gap-2">
          <span>Transferable Superpower Cards</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-silver-200 text-slateblue-700">
            {skillsResult.transferableSkills.length} Verified Dimensions
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skillsResult.transferableSkills.map((skill) => (
            <div
              key={skill.id}
              className="bg-white p-5 rounded-2xl border border-silver-300 shadow-sm flex flex-col justify-between hover:border-coral-500/50 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-extrabold text-slateblue-900 text-base">{skill.name}</h4>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-softpink-100 text-coral-500 text-xs font-black">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>{skill.aiRelevance}% Relevance</span>
                  </div>
                </div>

                <div className="p-3 bg-silver-50 rounded-xl border border-silver-200 text-xs text-slateblue-800 mb-3">
                  <span className="font-bold text-silver-600 block text-[10px] uppercase mb-0.5">
                    Quoting Your Real Experience:
                  </span>
                  "{skill.evidence}"
                </div>

                <p className="text-xs text-slateblue-700 leading-relaxed font-normal">
                  {skill.narrative}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-silver-200 flex items-center justify-between text-[11px] text-silver-600">
                <span className="flex items-center gap-1 text-warmgreen font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified Evidence
                </span>
                <button
                  type="button"
                  onClick={() => onJumpToCoach(`How do I pitch my "${skill.name}" skill during interviews?`)}
                  className="font-bold text-coral-500 hover:underline"
                >
                  Practice Pitch →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confidence-Correction Board: Side-by-Side Dual Bars */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-silver-300 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="inline-flex items-center gap-1 text-coral-500 text-xs font-bold uppercase tracking-wider">
              <span>Scientific Mindset Realignment</span>
            </div>
            <h3 className="text-xl font-black text-slateblue-900 mt-0.5">
              Confidence-Correction Board: Self-Rating vs. Evidence AI Rating
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-silver-400 inline-block" />
              <span>Self-Rating (Conservative)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-coral-500 inline-block" />
              <span>AI Evidence Rating</span>
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {skillsResult.confidenceCalibration.map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-silver-50 border border-silver-300">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slateblue-900">{item.dimension}</span>
                <span className="text-xs font-bold text-coral-500">
                  +{item.aiScore - item.selfScore} Calibration Uplift
                </span>
              </div>

              {/* Dual Bar Graphic */}
              <div className="space-y-2 mb-3">
                {/* Self-Score Bar */}
                <div className="flex items-center gap-2">
                  <span className="w-16 text-[11px] font-semibold text-silver-600">Self: {item.selfScore}/10</span>
                  <div className="flex-1 h-3 bg-silver-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-silver-400 rounded-full transition-all duration-500"
                      style={{ width: `${(item.selfScore / 10) * 100}%` }}
                    />
                  </div>
                </div>

                {/* AI Score Bar */}
                <div className="flex items-center gap-2">
                  <span className="w-16 text-[11px] font-bold text-coral-500">AI: {item.aiScore}/10</span>
                  <div className="flex-1 h-3 bg-silver-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-coral-500 to-softpink-300 rounded-full transition-all duration-700"
                      style={{ width: `${(item.aiScore / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Exact wording template rule: "In project X you already did Y..." */}
              <div className="p-3 bg-white rounded-xl border border-silver-200 text-xs text-slateblue-800 leading-relaxed font-medium">
                <span className="text-coral-500 font-bold block mb-0.5">Objective Reframing:</span>
                "{item.evidenceRef}"
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
