import React, { useState } from 'react';
import { 
  CalendarRange, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  Clock, 
  MessageSquare, 
  Bot, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { ReturnPlan as ReturnPlanType, UserProfile, EvidenceItem } from '../types';
import { generateReturnPlan } from '../services/geminiService';

interface Props {
  plan: ReturnPlanType;
  user: UserProfile;
  onTaskCheck: (taskId: string, completed: boolean, newEvidence?: EvidenceItem) => void;
  onUpdatePlan: (newPlan: ReturnPlanType) => void;
}

export const ReturnPlan: React.FC<Props> = ({
  plan,
  user,
  onTaskCheck,
  onUpdatePlan
}) => {
  const [adjustmentInput, setAdjustmentInput] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [coachResponse, setCoachResponse] = useState<string | null>(null);

  const handleToggleTask = (taskId: string, currentStatus: boolean, taskTitle: string) => {
    const nextStatus = !currentStatus;
    let evidence: EvidenceItem | undefined;

    if (nextStatus) {
      evidence = {
        id: `ev-task-progress-${Date.now()}`,
        userId: user.uid,
        type: 'skill_progress',
        title: `Completed Plan Task: ${taskTitle}`,
        detail: `Successfully completed within ${user.availableHoursPerWeek} hrs/week pacing boundary.`,
        source: 'auto',
        tags: ['Return Plan', 'Progress Milestone'],
        isPublic: false,
        createdAt: new Date().toISOString()
      };
    }

    onTaskCheck(taskId, nextStatus, evidence);
  };

  const handleAdjustPlan = async () => {
    if (!adjustmentInput.trim() || isAdjusting) return;
    setIsAdjusting(true);
    setCoachResponse(null);

    try {
      const updatedPlan = await generateReturnPlan(user, adjustmentInput);
      onUpdatePlan(updatedPlan);
      setCoachResponse(
        `I have updated your 30-day plan based on "${adjustmentInput}". Remember: Pausing is not elimination! Your previous milestones are fully preserved.`
      );
      setAdjustmentInput('');
    } catch (err) {
      console.error('Plan adjustment error', err);
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-silver-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral-500/10 text-coral-500 text-xs font-bold mb-2">
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Journey ⑤ · 30-Day Personalized Return Plan</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slateblue-900">
            Pacing Track: {plan.lifeStage}
          </h2>
          <p className="text-xs sm:text-sm text-slateblue-700 mt-1 max-w-2xl">
            Strictly tuned to ≤ {plan.recommendedWeeklyHours} hours/week. All stages carry the "Interruptible" flag.
          </p>
        </div>

        <div className="p-3 bg-silver-100 rounded-2xl border border-silver-300 text-xs text-slateblue-800 font-medium">
          <span className="font-bold text-coral-500 block mb-0.5">Gentle Pacing Rule:</span>
          {plan.contingencyNote}
        </div>
      </div>

      {/* Natural Language Adjustment Bar */}
      <div className="bg-white rounded-3xl p-6 border border-silver-300 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Bot className="w-4 h-4 text-coral-500" />
          <h3 className="font-bold text-slateblue-900 text-sm">Need to Adjust Plan Due to Life Events?</h3>
        </div>
        <p className="text-xs text-silver-600 mb-3">
          Type naturally (e.g. "my child is sick this week", "I need to pause for 4 days", or "I have extra 3 hours").
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={adjustmentInput}
            onChange={(e) => setAdjustmentInput(e.target.value)}
            placeholder="e.g., I need to pause this week because my toddler is teething..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-silver-400 focus:outline-none focus:ring-2 focus:ring-coral-500 text-xs font-medium"
          />
          <button
            type="button"
            onClick={handleAdjustPlan}
            disabled={isAdjusting || !adjustmentInput.trim()}
            className="px-5 py-2.5 rounded-xl bg-coral-500 hover:bg-coral-600 disabled:opacity-50 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
          >
            {isAdjusting ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Adjusting...</span>
              </>
            ) : (
              <span>Re-Adjust Plan</span>
            )}
          </button>
        </div>

        {coachResponse && (
          <div className="mt-3 p-3 bg-softpink-100 rounded-xl border border-silver-300 text-xs text-slateblue-900 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-coral-500 shrink-0" />
            <span>{coachResponse}</span>
          </div>
        )}
      </div>

      {/* 30-Day Gantt / Week Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plan.weeks.map((week) => (
          <div
            key={week.week}
            className="bg-white rounded-3xl p-6 border border-silver-300 shadow-sm flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-silver-200">
                <span className="px-2.5 py-1 rounded-full bg-silver-200 text-slateblue-900 text-xs font-bold">
                  Week {week.week}
                </span>
                <span className="text-xs text-silver-600 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {week.weeklyHours} hrs allocated
                </span>
              </div>

              <h4 className="font-extrabold text-slateblue-900 text-base mt-3 mb-2">{week.theme}</h4>

              {/* Tasks Checklist */}
              <div className="space-y-2 mt-4">
                <span className="text-[11px] font-bold text-silver-600 uppercase block">Practice & Milestones:</span>
                {week.practiceTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => handleToggleTask(t.id, t.completed, t.title)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                      t.completed ? 'bg-silver-50 border-silver-200 opacity-80' : 'bg-white border-silver-300 hover:border-coral-500'
                    }`}
                  >
                    <button type="button" className="mt-0.5 text-coral-500">
                      {t.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-warmgreen" />
                      ) : (
                        <Circle className="w-4 h-4 text-silver-400" />
                      )}
                    </button>
                    <div className="flex-1">
                      <span className={`text-xs font-semibold block ${t.completed ? 'line-through text-silver-500' : 'text-slateblue-900'}`}>
                        {t.title}
                      </span>
                      <span className="text-[10px] text-silver-500">~{t.estimatedHours} hrs</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Learning resources */}
              <div className="mt-4 pt-3 border-t border-silver-200">
                <span className="text-[11px] font-bold text-silver-600 uppercase block mb-1">Micro-Learning:</span>
                <ul className="text-xs text-slateblue-700 space-y-1">
                  {week.learningResources.map((res, rIdx) => (
                    <li key={rIdx} className="flex items-start gap-1.5">
                      <span className="text-coral-500">•</span>
                      <span>{res}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-silver-200 flex items-center justify-between text-[11px] text-silver-600">
              <span className="text-warmgreen font-semibold">Stage: Interruptible</span>
              <span>{week.practiceTasks.filter(t => t.completed).length}/{week.practiceTasks.length} Completed</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
