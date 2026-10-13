import React from 'react';
import { X, CheckCircle2, ShieldCheck, Terminal, Award, HelpCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadmeModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slateblue-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col border border-silver-300 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-silver-200 flex items-center justify-between bg-silver-50 rounded-t-3xl">
          <div>
            <h3 className="font-extrabold text-lg text-slateblue-900">
              Architecture Specs, README & Acceptance Criteria
            </h3>
            <span className="text-xs text-silver-600">Bloom AI · Her Path — Google AI Builder Cup Submission</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-silver-500 hover:text-slateblue-900 rounded-lg hover:bg-silver-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slateblue-800 leading-relaxed">
          {/* Section 1: Product Overview */}
          <div>
            <h4 className="font-black text-sm text-coral-500 uppercase tracking-wide mb-1">
              1. Competition Track & Product Concept
            </h4>
            <p>
              <strong>Track:</strong> Sustainability & Social Impact.<br />
              <strong>Problem:</strong> Only 30% of women dare to ask "Why not me", while most prematurely self-limit to "Why me". Women returning to the workforce (returners/setters) face tech insecurity, childcare gaps, and lack of empathetic female mentors.<br />
              <strong>Social Impact Model:</strong> All mentoring is 100% Free · Community-supported mentoring. Cost is never a barrier.
            </p>
          </div>

          {/* Section 2: Demo Accounts */}
          <div className="p-4 bg-silver-50 rounded-2xl border border-silver-300">
            <h4 className="font-bold text-slateblue-900 mb-2">Pre-Configured Demo Accounts (Password: Bloom123!)</h4>
            <ul className="space-y-1 font-mono text-[11px]">
              <li>• <strong>demo.returner@Bloom.test</strong> — Elena (Setter, 32, postpartum return, step 5, rich evidence & plan)</li>
              <li>• <strong>demo.explorer@Bloom.test</strong> — Maya (Explorer, 22, college student, fresh onboarding flow)</li>
              <li>• <strong>demo.mentor1@Bloom.test</strong> — Clara Lin (Ex-Meta AI Product Manager, Mom of two)</li>
              <li>• <strong>demo.mentor2@Bloom.test</strong> — Maya Zhou (FairBloom AI Founder, YC Alum)</li>
              <li>• <strong>demo.mentor3@Bloom.test</strong> — Iris Su (Head of AI Operations, non-tech transitioner)</li>
            </ul>
          </div>

          {/* Section 3: 30-Second Voiceover Script */}
          <div className="p-4 bg-softpink-100/70 rounded-2xl border border-silver-300">
            <h4 className="font-bold text-coral-600 mb-2">30-Second Demo Voice-Over Script (For Video Review)</h4>
            <p className="italic text-slateblue-900">
              "When women consider AI, only 30% dare to ask 'Why not me'. Welcome to <strong>Bloom AI · Her Path</strong>. In 5 minutes, Elena, an operations lead returning after 18 months of maternity leave, completes her Skills Discovery. Gemini extracts her non-technical superpowers, proving that instructional design is the foundation for AI operations. She completes a lightweight prompt task, receiving streaming feedback and unlocking an 'I Can' evidence badge. Her 30-day plan gently adapts when life happens, reminding her that 'Pausing is not elimination'. Finally, she books a 100% free session with Clara, an ex-Meta AI mentor. With Bloom AI, your experience is your greatest edge in the AI era."
            </p>
          </div>

          {/* Section 4: Architecture Diagram */}
          <div>
            <h4 className="font-black text-sm text-slateblue-900 mb-2">System Architecture (All Google Cloud Ecosystem)</h4>
            <pre className="p-3 bg-silver-100 rounded-xl text-[10px] font-mono overflow-x-auto border border-silver-300">
{`+---------------------------------------------------------------+
|       React 18 SPA + Tailwind CSS Design System               |
|       (Silver metallic base #EEF0F4 + Warm Coral #E8725C)     |
+-------------------------------+-------------------------------+
                                |
                                v
+-------------------------------+-------------------------------+
|               Google Gemini API (@google/genai)               |
|               Model: gemini-2.5-flash (Thinking budget tuned) |
|   - JSON Structured Skills Extraction & Confidence Calibration|
|   - Opportunity Matching & Compare Mode                       |
|   - Hands-on Lab Rubric Streaming Evaluation                  |
|   - AI Coach Evidence-Reframing Method ("Why me" -> "Why not")|
+-------------------------------+-------------------------------+
                                |
                                v
+-------------------------------+-------------------------------+
|               Firebase Ecosystem                              |
|   - Cloud Firestore (Native Database: gbc2026-1012a)          |
|   - Firebase Auth (Anonymous & Email Authentication)          |
|   - Firestore Security Rules & Composite Indexes Deployed     |
+---------------------------------------------------------------+`}
            </pre>
          </div>

          {/* Acceptance Checklist */}
          <div>
            <h4 className="font-bold text-slateblue-900 mb-2">Acceptance Criteria Verified:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <span className="flex items-center gap-1.5 text-warmgreen font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                No traditional simulator residue
              </span>
              <span className="flex items-center gap-1.5 text-warmgreen font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                No admin frontend entry point
              </span>
              <span className="flex items-center gap-1.5 text-warmgreen font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                100% Free · Community-supported mentoring
              </span>
              <span className="flex items-center gap-1.5 text-warmgreen font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Dual-bar Skills Calibration board
              </span>
              <span className="flex items-center gap-1.5 text-warmgreen font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                "Pausing is not elimination" plan adjustment
              </span>
              <span className="flex items-center gap-1.5 text-warmgreen font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Evidence-reframing AI coach
              </span>
              <span className="flex items-center gap-1.5 text-warmgreen font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Mobile 375px responsive layout verified
              </span>
              <span className="flex items-center gap-1.5 text-warmgreen font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Booking state machine & endorsements
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-silver-200 bg-silver-50 flex justify-end rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-coral-500 hover:bg-coral-600 text-white font-bold text-xs rounded-xl"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
