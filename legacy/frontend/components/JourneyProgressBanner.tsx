import React from 'react';
import { 
  Compass, 
  Sparkles, 
  Briefcase, 
  FlaskConical, 
  CalendarRange, 
  Users, 
  Bot, 
  HeartHandshake,
  CheckCircle2 
} from 'lucide-react';

interface Props {
  currentStep: number;
  onSelectStep: (stepNumber: number) => void;
}

const STEPS = [
  { num: 1, label: 'Sign Up & Goals', icon: Compass, tab: 'onboarding' },
  { num: 2, label: 'Skills Discovery', icon: Sparkles, tab: 'skills' },
  { num: 3, label: 'AI Opportunities', icon: Briefcase, tab: 'opportunities' },
  { num: 4, label: 'Hands-on Tasks', icon: FlaskConical, tab: 'tasks' },
  { num: 5, label: 'Return Plan', icon: CalendarRange, tab: 'plan' },
  { num: 6, label: 'Community & Mentors', icon: Users, tab: 'community' }
];

export const JourneyProgressBanner: React.FC<Props> = ({ currentStep, onSelectStep }) => {
  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-silver-300 p-5 mb-8">
      {/* Horizontal 6-step flow */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 relative">
        {STEPS.map((step, idx) => {
          const isCompleted = currentStep > step.num;
          const isCurrent = currentStep === step.num;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.num}>
              <button
                type="button"
                onClick={() => onSelectStep(step.num)}
                className={`flex-1 flex flex-col items-center text-center group transition-all duration-200 p-2 rounded-xl relative ${
                  isCurrent ? 'bg-softpink-100/70' : 'hover:bg-silver-100'
                }`}
              >
                {/* Step circle indicator */}
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 relative ${
                    isCompleted
                      ? 'bg-gradient-to-tr from-silver-400 to-coral-500 text-white shadow-sm'
                      : isCurrent
                      ? 'bg-coral-500 text-white ring-4 ring-coral-500/20 shadow-md scale-105'
                      : 'bg-silver-200 text-silver-600 border border-silver-300'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : (
                    <span>{step.num}</span>
                  )}
                  {/* Subtle step icon badge */}
                  <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full border border-silver-300">
                    <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-coral-500' : 'text-slateblue-700'}`} />
                  </div>
                </div>

                <div className="mt-2.5">
                  <span className={`text-xs block font-semibold ${
                    isCurrent ? 'text-coral-500 font-bold' : isCompleted ? 'text-slateblue-900' : 'text-silver-600'
                  }`}>
                    Step {step.num}
                  </span>
                  <span className={`text-xs block font-medium mt-0.5 whitespace-nowrap ${
                    isCurrent ? 'text-slateblue-900 font-bold' : 'text-slateblue-700'
                  }`}>
                    {step.label}
                  </span>
                </div>
              </button>

              {/* Dashed connector line between steps */}
              {idx < STEPS.length - 1 && (
                <div className="hidden md:block w-8 border-t-2 border-dashed border-silver-400 self-center mb-6" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Two full-width companion bands underneath */}
      <div className="mt-5 pt-4 border-t border-silver-200 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2.5 px-3 py-2 bg-gradient-to-r from-silver-100 to-softpink-100/50 rounded-xl border border-silver-300 text-slateblue-800 font-medium">
          <div className="w-6 h-6 rounded-lg bg-coral-500/10 flex items-center justify-center text-coral-500">
            <Bot className="w-4 h-4" />
          </div>
          <span><strong>AI Coach</strong> accompanies you end to end (Reframing "Why me" to "Why not me")</span>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-2 bg-gradient-to-r from-silver-100 to-silver-200 rounded-xl border border-silver-300 text-slateblue-800 font-medium">
          <div className="w-6 h-6 rounded-lg bg-warmgreen/20 flex items-center justify-center text-warmgreen">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <span><strong>Community</strong> provides ongoing support & 100% Free mentoring packages</span>
        </div>
      </div>
    </div>
  );
};
