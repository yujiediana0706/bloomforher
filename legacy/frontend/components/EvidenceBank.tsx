import React, { useState } from 'react';
import { 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Share2, 
  Plus, 
  Filter, 
  Clock, 
  ShieldCheck, 
  Bot,
  Layers,
  Heart
} from 'lucide-react';
import { EvidenceItem, EvidenceType, UserProfile } from '../types';

interface Props {
  evidences: EvidenceItem[];
  user: UserProfile;
  onAddManualEvidence: (evidence: Omit<EvidenceItem, 'id' | 'createdAt'>) => void;
  onShareToCircle: (evidence: EvidenceItem) => void;
}

export const EvidenceBank: React.FC<Props> = ({
  evidences,
  user,
  onAddManualEvidence,
  onShareToCircle
}) => {
  const [viewMode, setViewMode] = useState<'wall' | 'timeline'>('wall');
  const [filterType, setFilterType] = useState<string>('all');
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Manual evidence form state
  const [manualTitle, setManualTitle] = useState('');
  const [manualDetail, setManualDetail] = useState('');
  const [manualType, setManualType] = useState<EvidenceType>('project_work');

  // Filtered evidence items
  const filteredEvidences = evidences.filter(e => {
    if (filterType === 'all') return true;
    return e.type === filterType;
  });

  // Confidence score calculation (starts at 40, capped at 100)
  const breakdown = React.useMemo(() => {
    let endorsement = 0;
    let assessment = 0;
    let project = 0;
    let task = 0;
    let milestone = 0;
    let peer = 0;

    evidences.forEach(ev => {
      switch (ev.type) {
        case 'mentor_endorsement': endorsement += 8; break;
        case 'assessment_result': assessment += 6; break;
        case 'project_work': project += 6; break;
        case 'task_outcome': task += 3; break;
        case 'skill_progress': task += 3; break;
        case 'milestone': milestone += 5; break;
        case 'community_kudos': peer += 2; break;
      }
    });

    const total = Math.min(100, 40 + endorsement + assessment + project + task + milestone + peer);
    return { total, endorsement, assessment, project, task, milestone, peer };
  }, [evidences]);

  const handleManualSubmit = () => {
    if (!manualTitle.trim()) return;
    onAddManualEvidence({
      userId: user.uid,
      type: manualType,
      title: manualTitle,
      detail: manualDetail,
      source: 'manual',
      tags: ['Manual Artifact', manualType],
      isPublic: false
    });
    setAddModalOpen(false);
    setManualTitle('');
    setManualDetail('');
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-silver-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral-500/10 text-coral-500 text-xs font-bold mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>Cross-cutting Layer B · Self-Proof Bank</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slateblue-900">
            The "I Can" Evidence Wall
          </h2>
          <p className="text-xs sm:text-sm text-slateblue-700 mt-1 max-w-2xl">
            Never rely on empty motivational slogans. Real, cumulative evidence eliminates self-doubt and proves you belong in the AI arena.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-silver-100 p-1 rounded-xl border border-silver-300">
            <button
              type="button"
              onClick={() => setViewMode('wall')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                viewMode === 'wall' ? 'bg-white text-slateblue-900 shadow-sm' : 'text-silver-600'
              }`}
            >
              "I Can" Wall
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                viewMode === 'timeline' ? 'bg-white text-slateblue-900 shadow-sm' : 'text-silver-600'
              }`}
            >
              Timeline View
            </button>
          </div>

          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2 bg-coral-500 hover:bg-coral-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Manual Artifact</span>
          </button>
        </div>
      </div>

      {/* Confidence Breakdown Strip */}
      <div className="bg-white rounded-3xl p-6 border border-silver-300 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="font-extrabold text-slateblue-900 text-base">Confidence Calibration Gauge Breakdown</h3>
          <span className="text-xs font-bold text-coral-500">Total Score: {breakdown.total} / 100</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-center">
          <div className="p-3 bg-silver-50 rounded-xl border border-silver-200">
            <span className="text-[10px] text-silver-600 font-bold uppercase block">Baseline</span>
            <span className="text-base font-black text-slateblue-900">40 pts</span>
          </div>
          <div className="p-3 bg-silver-50 rounded-xl border border-silver-200">
            <span className="text-[10px] text-silver-600 font-bold uppercase block">Endorsements</span>
            <span className="text-base font-black text-coral-500">+{breakdown.endorsement}</span>
          </div>
          <div className="p-3 bg-silver-50 rounded-xl border border-silver-200">
            <span className="text-[10px] text-silver-600 font-bold uppercase block">Assessments</span>
            <span className="text-base font-black text-slateblue-900">+{breakdown.assessment}</span>
          </div>
          <div className="p-3 bg-silver-50 rounded-xl border border-silver-200">
            <span className="text-[10px] text-silver-600 font-bold uppercase block">Task Outcomes</span>
            <span className="text-base font-black text-warmgreen">+{breakdown.task}</span>
          </div>
          <div className="p-3 bg-silver-50 rounded-xl border border-silver-200">
            <span className="text-[10px] text-silver-600 font-bold uppercase block">Projects</span>
            <span className="text-base font-black text-slateblue-900">+{breakdown.project}</span>
          </div>
          <div className="p-3 bg-silver-50 rounded-xl border border-silver-200">
            <span className="text-[10px] text-silver-600 font-bold uppercase block">Milestones</span>
            <span className="text-base font-black text-coral-500">+{breakdown.milestone}</span>
          </div>
        </div>
      </div>

      {/* AI Weekly Confidence Summary (must cite >= 2 items) */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-softpink-100 to-silver-100 border border-silver-300 flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-coral-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <Bot className="w-5 h-5" />
        </div>
        <div className="text-xs text-slateblue-900 space-y-1">
          <span className="font-extrabold text-sm text-coral-600 block">AI Verified Progress Synthesis:</span>
          <p className="leading-relaxed">
            "{user.name}, you have accumulated <strong>{evidences.length} verified artifacts</strong>. Most notably, your <em>'Hands-on Lab: Educational Prompt Architecture'</em> (Score 5/5) and the <em>'Clara Lin Endorsement'</em> confirm that your non-technical operations background translates directly into top-tier AI orchestration. You belong here."
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All Artifacts' },
          { key: 'mentor_endorsement', label: 'Mentor Endorsements' },
          { key: 'task_outcome', label: 'Hands-on Lab Outcomes' },
          { key: 'assessment_result', label: 'Skills Calibrations' },
          { key: 'skill_progress', label: 'Plan Progress' },
          { key: 'community_kudos', label: 'Community Kudos' }
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterType(tab.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              filterType === tab.key 
                ? 'bg-slateblue-900 text-white' 
                : 'bg-white text-silver-600 hover:bg-silver-100 border border-silver-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Evidence Cards Display */}
      {filteredEvidences.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-silver-300">
          <p className="text-sm font-semibold text-silver-500">
            No evidence yet — complete a Skills Discovery and your first 'I Can' will appear automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvidences.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-6 border border-silver-300 shadow-sm flex flex-col justify-between hover:border-coral-500/50 transition-all relative group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-softpink-100 text-coral-500">
                    {item.type.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-silver-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h4 className="font-extrabold text-slateblue-900 text-base mb-2">{item.title}</h4>
                <p className="text-xs text-slateblue-700 leading-relaxed mb-4">{item.detail}</p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {item.tags.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-silver-100 rounded text-[10px] font-semibold text-silver-600">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-silver-200 flex items-center justify-between text-xs">
                <span className="text-silver-500 text-[11px]">
                  Source: {item.source === 'auto' ? 'AI Verified' : 'Self-uploaded'}
                </span>
                <button
                  type="button"
                  onClick={() => onShareToCircle(item)}
                  className="font-bold text-coral-500 hover:text-coral-600 flex items-center gap-1 text-xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share to Circle</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Add Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slateblue-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-silver-300 shadow-xl space-y-4">
            <h3 className="text-lg font-black text-slateblue-900">Add Manual Evidence Artifact</h3>

            <div>
              <label className="block text-xs font-bold text-slateblue-900 mb-1">Evidence Type</label>
              <select
                value={manualType}
                onChange={(e) => setManualType(e.target.value as EvidenceType)}
                className="w-full px-3 py-2 rounded-xl border border-silver-400 text-xs font-bold"
              >
                <option value="project_work">Real-world Project Work</option>
                <option value="task_outcome">Task Outcome</option>
                <option value="milestone">Personal Milestone</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slateblue-900 mb-1">Title</label>
              <input
                type="text"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                placeholder="e.g. Created SOP Template for Client Operations"
                className="w-full px-3 py-2 rounded-xl border border-silver-400 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slateblue-900 mb-1">Description / Details</label>
              <textarea
                rows={4}
                value={manualDetail}
                onChange={(e) => setManualDetail(e.target.value)}
                placeholder="Describe your achievement, concrete outcome, and how it relates to AI..."
                className="w-full p-3 rounded-xl border border-silver-400 text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-silver-200">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-silver-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleManualSubmit}
                className="px-5 py-2 bg-coral-500 hover:bg-coral-600 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Save Evidence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
