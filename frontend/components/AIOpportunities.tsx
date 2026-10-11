import React, { useState } from 'react';
import { 
  Briefcase, 
  Sparkles, 
  CheckCircle, 
  ArrowRight, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck,
  Bot
} from 'lucide-react';
import { RoleMatch } from '../types';

interface Props {
  roles: RoleMatch[];
  onSelectRoleForTask: (roleTitle: string) => void;
  onAskCoachAboutRole: (roleTitle: string) => void;
}

export const AIOpportunities: React.FC<Props> = ({
  roles,
  onSelectRoleForTask,
  onAskCoachAboutRole
}) => {
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(roles[0]?.id || null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareRoleA, setCompareRoleA] = useState<string>(roles[0]?.id || '');
  const [compareRoleB, setCompareRoleB] = useState<string>(roles[1]?.id || '');

  const roleA = roles.find(r => r.id === compareRoleA) || roles[0];
  const roleB = roles.find(r => r.id === compareRoleB) || roles[1];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-silver-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral-500/10 text-coral-500 text-xs font-bold mb-2">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Journey ③ · AI-Era Role Scenarios</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slateblue-900">
            Women-Friendly Entry Tracks in the AI Economy
          </h2>
          <p className="text-xs sm:text-sm text-slateblue-700 mt-1 max-w-2xl">
            Selected for low technical coding prerequisites, high requirement for contextual empathy, and seamless transition pathways for returners.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCompareMode(!compareMode)}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all self-start sm:self-auto ${
            compareMode 
              ? 'bg-coral-500 text-white shadow-md shadow-coral-500/20' 
              : 'bg-silver-100 hover:bg-silver-200 text-slateblue-900 border border-silver-300'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>{compareMode ? 'Exit Compare Mode' : 'Compare Roles Side-by-Side'}</span>
        </button>
      </div>

      {/* Compare Mode View */}
      {compareMode && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-coral-500/40 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-silver-200">
            <h3 className="font-extrabold text-slateblue-900 text-base">Side-by-Side Role Comparison</h3>
            <div className="flex items-center gap-3">
              <select
                value={compareRoleA}
                onChange={(e) => setCompareRoleA(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-silver-400 text-xs font-bold text-slateblue-900"
              >
                {roles.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
              <span className="text-xs font-bold text-silver-500">VS</span>
              <select
                value={compareRoleB}
                onChange={(e) => setCompareRoleB(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-silver-400 text-xs font-bold text-slateblue-900"
              >
                {roles.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[roleA, roleB].map((r, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-silver-50 border border-silver-300 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slateblue-900 text-lg">{r.title}</h4>
                  <span className="px-2.5 py-1 rounded-full bg-coral-500 text-white text-xs font-black">
                    {r.matchScore}% Match
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-silver-600 uppercase block mb-1">Why You Fit:</span>
                  <p className="text-xs text-slateblue-800 font-medium">{r.whyFit}</p>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-silver-600 uppercase block mb-1">Key Workflow:</span>
                  <ul className="text-xs text-slateblue-700 space-y-1">
                    {r.typicalWorkflows.slice(0, 2).map((w, wIdx) => (
                      <li key={wIdx}>• {w}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-white rounded-xl border border-silver-200">
                  <span className="text-[10px] font-bold text-coral-500 uppercase block mb-0.5">Trade-offs to note:</span>
                  <p className="text-xs text-silver-600">{r.tradeoffs}</p>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectRoleForTask(r.title)}
                  className="w-full py-2 bg-coral-500 hover:bg-coral-600 text-white font-bold text-xs rounded-xl shadow-sm text-center"
                >
                  Select for Hands-on Task →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Role Cards List */}
      <div className="space-y-4">
        {roles.map((role) => {
          const isExpanded = expandedRoleId === role.id;

          return (
            <div
              key={role.id}
              className={`bg-white rounded-3xl border transition-all ${
                isExpanded ? 'border-coral-500 shadow-md' : 'border-silver-300 hover:border-silver-400'
              }`}
            >
              <div 
                className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                onClick={() => setExpandedRoleId(isExpanded ? null : role.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Circular Match Score Ring */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-coral-500 to-softpink-300 flex flex-col items-center justify-center text-white shrink-0 shadow-sm">
                    <span className="text-lg font-black leading-none">{role.matchScore}%</span>
                    <span className="text-[9px] uppercase font-bold opacity-90">Match</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-silver-100 text-slateblue-800 border border-silver-300">
                        {role.category}
                      </span>
                      {role.isWomenFriendly && (
                        <span className="text-[11px] font-semibold text-warmgreen flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Women-Friendly Entry
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-extrabold text-slateblue-900">{role.title}</h3>
                    <p className="text-xs text-slateblue-700 mt-1 max-w-2xl">{role.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRoleForTask(role.title);
                    }}
                    className="px-4 py-2 bg-coral-500 hover:bg-coral-600 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Try Mini-Task
                  </button>
                  <button
                    type="button"
                    className="p-2 text-silver-500 hover:text-slateblue-900"
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-silver-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-silver-50 rounded-2xl border border-silver-200">
                    <span className="font-bold text-slateblue-900 block mb-1">Why Your Background Fits:</span>
                    <p className="text-slateblue-700 leading-relaxed">{role.whyFit}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {role.requiredSkills.map((s, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-white rounded-md text-[11px] font-medium border border-silver-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-silver-50 rounded-2xl border border-silver-200">
                    <span className="font-bold text-slateblue-900 block mb-1">Typical Workflows:</span>
                    <ul className="text-slateblue-700 space-y-1.5">
                      {role.typicalWorkflows.map((w, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-coral-500">•</span>
                          <span>{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-silver-50 rounded-2xl border border-silver-200 flex flex-col justify-between">
                    <div>
                      <span className="font-bold text-slateblue-900 block mb-1">Real-World Examples & Trade-offs:</span>
                      <p className="text-silver-600 mb-2">{role.tradeoffs}</p>
                      <ul className="text-slate-700 space-y-1">
                        {role.realWorldExamples.map((ex, idx) => (
                          <li key={idx} className="text-[11px] text-slateblue-800">
                            → {ex}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => onAskCoachAboutRole(role.title)}
                      className="mt-3 py-1.5 bg-white hover:bg-silver-100 text-coral-500 font-bold text-xs rounded-xl border border-silver-300 flex items-center justify-center gap-1.5"
                    >
                      <Bot className="w-4 h-4" />
                      <span>Ask Coach About This Track</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
