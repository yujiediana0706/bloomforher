import React, { useState } from 'react';
import { 
  Compass, 
  ArrowRight, 
  Sparkles, 
  Bot, 
  CheckCircle, 
  Clock, 
  Heart,
  Baby,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import { UserProfile, LifeStage } from '../types';

interface Props {
  onComplete: (updatedProfile: Partial<UserProfile>) => void;
  initialUser: UserProfile;
}

export const Onboarding: React.FC<Props> = ({ onComplete, initialUser }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initialUser.name);
  const [lifeStage, setLifeStage] = useState<LifeStage>(initialUser.lifeStage);
  const [availableHours, setAvailableHours] = useState(initialUser.availableHoursPerWeek);
  const [background, setBackground] = useState(initialUser.backgroundSummary);
  
  // 6-question confidence self-assessment scale (1-10)
  const [scores, setScores] = useState(initialUser.confidenceSelfScores);

  const lifeStages: { key: LifeStage; label: string; desc: string; icon: any }[] = [
    { key: 'Postpartum Return', label: 'Postpartum Return', desc: 'Returning to work after maternity or childcare pause (1-3 yrs)', icon: Baby },
    { key: 'Career Pivot', label: 'Career Pivot', desc: 'Transitioning from humanities/ops into AI-enabled functions', icon: Briefcase },
    { key: 'In-School Exploration', label: 'In-School Exploration', desc: 'Undergraduate or graduate student exploring AI careers', icon: GraduationCap },
    { key: 'Part-Time Transition', label: 'Part-Time Transition', desc: 'Balancing caretaking responsibilities with flexible AI contracts', icon: Heart }
  ];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete({
        name,
        lifeStage,
        availableHoursPerWeek: availableHours,
        backgroundSummary: background,
        confidenceSelfScores: scores,
        journeyStep: 2
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-10 border border-silver-300 shadow-sm relative">
      {/* Step Indicator */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-silver-200">
        <div>
          <span className="text-xs font-bold text-coral-500 uppercase tracking-wider block">
            Step ① Sign Up & Goal Setting
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slateblue-900 mt-1">
            {step === 1 && 'Define Your Life Stage & Context'}
            {step === 2 && 'Tell Us About Your Past Experience'}
            {step === 3 && 'Baseline AI Confidence Calibration'}
          </h2>
        </div>
        <div className="text-xs font-bold px-3 py-1 bg-silver-100 text-slateblue-900 rounded-full border border-silver-300">
          Screen {step} of 3
        </div>
      </div>

      {/* Static Coach bubble encouragement */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-softpink-100/80 to-silver-100 border border-silver-300 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-coral-500 text-white flex items-center justify-center shrink-0 mt-0.5">
          <Bot className="w-4 h-4" />
        </div>
        <div className="text-xs text-slateblue-900">
          <p className="font-bold text-coral-600 mb-0.5">AI Coach Perspective:</p>
          <p className="text-slateblue-700">
            {step === 1 && 'Life constraints are not obstacles to hide; they are parameters we design your AI trajectory around. Whether you have 4 hours or 20 hours a week, AI workflows favor focused precision.'}
            {step === 2 && 'Do not downplay non-technical roles! Project coordination, curriculum authoring, and customer diplomacy are the exact foundations for AI Operations and Prompt Design.'}
            {step === 3 && 'Be completely candid with your self-ratings. Research proves women systematically rate their technical readiness 40% lower than their actual observable capabilities. We are here to calibrate that!'}
          </p>
        </div>
      </div>

      {/* Screen 1: Life Stage & Available Hours */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slateblue-900 mb-1">Your Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-silver-400 focus:outline-none focus:ring-2 focus:ring-coral-500 text-sm font-medium"
              placeholder="e.g. Elena Rostova"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slateblue-900 mb-2">Select Your Current Life Stage</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {lifeStages.map((ls) => {
                const Icon = ls.icon;
                const isSelected = lifeStage === ls.key;
                return (
                  <button
                    key={ls.key}
                    type="button"
                    onClick={() => setLifeStage(ls.key)}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'border-coral-500 bg-softpink-100/60 ring-2 ring-coral-500/20'
                        : 'border-silver-300 hover:border-silver-400 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-coral-500' : 'text-slateblue-700'}`} />
                      <span className="text-sm font-bold text-slateblue-900">{ls.label}</span>
                    </div>
                    <p className="text-xs text-silver-600">{ls.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slateblue-900">
                Weekly Available Bandwidth
              </label>
              <span className="text-xs font-extrabold text-coral-500">{availableHours} Hours / Week</span>
            </div>
            <input
              type="range"
              min="3"
              max="25"
              step="1"
              value={availableHours}
              onChange={(e) => setAvailableHours(Number(e.target.value))}
              className="w-full accent-coral-500 cursor-pointer"
            />
            <p className="text-[11px] text-silver-600 mt-1">
              Your 30-day plan will strictly cap tasks below this limit so you never feel overwhelmed.
            </p>
          </div>
        </div>
      )}

      {/* Screen 2: Background Summary */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slateblue-900 mb-1">
              Your Past Experience & Career Highlights
            </label>
            <textarea
              rows={6}
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="w-full p-4 rounded-2xl border border-silver-400 focus:outline-none focus:ring-2 focus:ring-coral-500 text-sm leading-relaxed"
              placeholder="Detail your past roles, coordination projects, writing, or education experience..."
            />
            <p className="text-[11px] text-silver-600 mt-1">
              Gemini will extract your transferable superpowers from this text. Mention complex coordination or communication triumphs!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-silver-50 border border-silver-300 text-xs text-slateblue-700">
            <span className="font-bold text-slateblue-900 block mb-1">Privacy & Data Respect Notice:</span>
            Sensitive fields like life stage and family commitments are private by default. Evidence items will never be published without your explicit single-click consent.
          </div>
        </div>
      )}

      {/* Screen 3: 6-Question Confidence Assessment */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-xs text-slateblue-700">
            Rate how you feel today (1 = low confidence, 10 = high confidence). Don't worry about low scores — we will calibrate these with evidence!
          </p>

          {[
            { key: 'technicalSelfEfficacy', label: 'Technical Self-Efficacy ("I am capable of working with AI tools")' },
            { key: 'aiToolReadiness', label: 'AI Tool Readiness ("I can use ChatGPT/Claude effectively")' },
            { key: 'careerGapConfidence', label: 'Career Gap Framing ("I can explain my pause with pride")' },
            { key: 'adaptability', label: 'Adaptability to New Digital Paradigms' },
            { key: 'communicationValue', label: 'Communication & Pedagogical Value' },
            { key: 'problemSolvingInAI', label: 'Problem Decomposition & Exception Handling' }
          ].map((item) => (
            <div key={item.key} className="p-3 bg-silver-50 rounded-xl border border-silver-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slateblue-900">{item.label}</span>
                <span className="text-xs font-black text-coral-500">
                  {scores[item.key as keyof typeof scores]} / 10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={scores[item.key as keyof typeof scores]}
                onChange={(e) => setScores({
                  ...scores,
                  [item.key]: Number(e.target.value)
                })}
                className="w-full accent-coral-500 cursor-pointer"
              />
            </div>
          ))}
        </div>
      )}

      {/* Footer navigation button */}
      <div className="mt-8 pt-6 border-t border-silver-200 flex justify-between items-center">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="px-4 py-2 text-xs font-semibold text-silver-600 hover:text-slateblue-900"
          >
            ← Back
          </button>
        ) : <div />}

        <button
          type="button"
          onClick={handleNext}
          className="px-6 py-2.5 rounded-xl bg-coral-500 hover:bg-coral-600 text-white font-bold text-sm shadow-md shadow-coral-500/25 flex items-center gap-2 transition-all"
        >
          <span>{step === 3 ? 'Trigger AI Skills Discovery →' : 'Continue'}</span>
        </button>
      </div>
    </div>
  );
};
