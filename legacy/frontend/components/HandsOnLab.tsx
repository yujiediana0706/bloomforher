import React, { useState } from 'react';
import { 
  FlaskConical, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  RotateCcw, 
  Clock, 
  Award, 
  Send,
  HelpCircle,
  FileText
} from 'lucide-react';
import { HandsOnTask, EvidenceItem } from '../types';
import { evaluateTaskSubmission } from '../services/geminiService';

interface Props {
  tasks: HandsOnTask[];
  onTaskCompleted: (task: HandsOnTask, newEvidence: EvidenceItem) => void;
}

export const HandsOnLab: React.FC<Props> = ({ tasks, onTaskCompleted }) => {
  const [selectedTask, setSelectedTask] = useState<HandsOnTask>(tasks[0]);
  const [submissionText, setSubmissionText] = useState(selectedTask.userSubmission || '');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [liveStreamText, setLiveStreamText] = useState('');
  const [currentFeedback, setCurrentFeedback] = useState(selectedTask.feedback || null);

  const handleSelectTask = (task: HandsOnTask) => {
    setSelectedTask(task);
    setSubmissionText(task.userSubmission || '');
    setCurrentFeedback(task.feedback || null);
    setLiveStreamText('');
  };

  const handleSubmit = async () => {
    if (!submissionText.trim() || isEvaluating) return;
    setIsEvaluating(true);
    setLiveStreamText('');
    setCurrentFeedback(null);

    try {
      const evaluation = await evaluateTaskSubmission(
        selectedTask.title,
        selectedTask.scenario,
        selectedTask.rubric,
        submissionText,
        (chunk) => {
          setLiveStreamText(prev => prev + chunk);
        }
      );

      const feedbackObj = {
        ...evaluation,
        evaluatedAt: new Date().toISOString().split('T')[0]
      };

      setCurrentFeedback(feedbackObj);

      const updatedTask: HandsOnTask = {
        ...selectedTask,
        userSubmission: submissionText,
        feedback: feedbackObj
      };

      // Automatically generate a task_outcome evidence in Evidence Bank
      const newEvidence: EvidenceItem = {
        id: `ev-task-${Date.now()}`,
        userId: 'demo_user',
        type: 'task_outcome',
        title: `Hands-on Lab: ${selectedTask.title} (Score: ${feedbackObj.score}/5)`,
        detail: `Demonstrated capabilities: ${feedbackObj.highlights.join(' ')}`,
        source: 'auto',
        tags: ['Hands-on Lab', 'Task Outcome', selectedTask.targetRole],
        isPublic: false,
        createdAt: new Date().toISOString()
      };

      onTaskCompleted(updatedTask, newEvidence);
    } catch (err) {
      console.error('Task submission evaluation failed', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-silver-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral-500/10 text-coral-500 text-xs font-bold mb-2">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Journey ④ · Real Task + Instant Feedback (Not a Simulator)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slateblue-900">
            One-Shot Hands-on Lab
          </h2>
          <p className="text-xs sm:text-sm text-slateblue-700 mt-1 max-w-2xl">
            Complete lightweight 20–40 minute real-world assignments. Every submission creates permanent verified evidence on your "I Can" Wall.
          </p>
        </div>
      </div>

      {/* Task Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tasks.map((task) => {
          const isSelected = selectedTask.id === task.id;
          const hasCompleted = !!task.feedback;

          return (
            <button
              key={task.id}
              type="button"
              onClick={() => handleSelectTask(task)}
              className={`p-4 rounded-2xl text-left border transition-all ${
                isSelected
                  ? 'border-coral-500 bg-white ring-2 ring-coral-500/20 shadow-sm'
                  : 'border-silver-300 bg-silver-50 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-silver-600 uppercase">
                  {task.estimatedMinutes} Mins · {task.targetRole}
                </span>
                {hasCompleted && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-warmgreen">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Score {task.feedback?.score}
                  </span>
                )}
              </div>
              <h4 className="font-bold text-sm text-slateblue-900 leading-snug">{task.title}</h4>
            </button>
          );
        })}
      </div>

      {/* Active Task Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Task Prompt & Rubric */}
        <div className="bg-white rounded-3xl p-6 border border-silver-300 shadow-sm space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-coral-500">{selectedTask.targetRole}</span>
              <span className="text-xs text-silver-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                ~{selectedTask.estimatedMinutes} minutes
              </span>
            </div>
            <h3 className="text-lg font-black text-slateblue-900">{selectedTask.title}</h3>
          </div>

          <div className="p-4 bg-silver-50 rounded-2xl border border-silver-200">
            <span className="font-bold text-xs text-slateblue-900 block mb-1">Scenario Description:</span>
            <p className="text-xs text-slateblue-700 leading-relaxed">{selectedTask.scenario}</p>
          </div>

          <div>
            <span className="font-bold text-xs text-slateblue-900 block mb-2">Suggested AI Tool Prompt Scaffold:</span>
            <div className="p-3 bg-silver-100 rounded-xl border border-silver-300 text-xs text-slateblue-800 font-mono select-all">
              {selectedTask.suggestedPrompt}
            </div>
          </div>

          <div>
            <span className="font-bold text-xs text-slateblue-900 block mb-2">Completion Evaluation Rubric:</span>
            <ul className="text-xs text-slateblue-700 space-y-1.5">
              {selectedTask.rubric.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-coral-500 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Submission & Real-time AI Evaluation */}
        <div className="bg-white rounded-3xl p-6 border border-silver-300 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slateblue-900 text-base">Your Task Output Submission</h3>
              <span className="text-[11px] text-silver-600">Text, prompt draft, or trade-off reasoning</span>
            </div>

            <textarea
              rows={9}
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Paste your prompt iterations, AI output analysis, and decision trade-offs here..."
              className="w-full p-4 rounded-2xl border border-silver-400 focus:outline-none focus:ring-2 focus:ring-coral-500 text-xs font-normal leading-relaxed"
            />

            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSubmissionText(selectedTask.userSubmission || '')}
                className="text-xs text-silver-600 hover:text-slateblue-900 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Seed Answer</span>
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isEvaluating || !submissionText.trim()}
                className="px-5 py-2.5 rounded-xl bg-coral-500 hover:bg-coral-600 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-coral-500/20 flex items-center gap-2 transition-all"
              >
                {isEvaluating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Gemini Evaluating Against Rubric...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit & Evaluate Instant Feedback</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback Output or Live Streaming Section */}
          {(liveStreamText || currentFeedback) && (
            <div className="mt-4 p-5 rounded-2xl bg-gradient-to-r from-silver-50 to-softpink-100/50 border border-silver-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slateblue-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-coral-500" />
                  <span>Instant Rubric Feedback</span>
                </span>
                {currentFeedback && (
                  <span className="px-2.5 py-1 rounded-full bg-coral-500 text-white text-xs font-black">
                    Score: {currentFeedback.score} / 5.0
                  </span>
                )}
              </div>

              {liveStreamText && !currentFeedback && (
                <p className="text-xs text-slateblue-800 leading-relaxed font-mono whitespace-pre-wrap">
                  {liveStreamText}
                </p>
              )}

              {currentFeedback && (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-warmgreen block mb-1">Highlights (Quoting Your Work):</span>
                    <ul className="space-y-1 text-slateblue-800">
                      {currentFeedback.highlights.map((h, i) => (
                        <li key={i}>• {h}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="font-bold text-coral-600 block mb-1">Actionable Suggestions:</span>
                    <ul className="space-y-1 text-slateblue-800">
                      {currentFeedback.actionableSuggestions.map((a, i) => (
                        <li key={i}>• {a}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-silver-300 flex items-center justify-between text-[11px] text-silver-600">
                    <span>Evidence permanently added to your "I Can" bank</span>
                    <span className="font-semibold text-warmgreen">Verified Outcome</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
