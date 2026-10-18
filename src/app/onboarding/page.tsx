'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  RefreshCw,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ProgressBar,
  SectionTitle,
} from '@/components/ui';
import { useAuth } from '@/components/AuthProvider';
import { apiSend } from '@/lib/client';
import { COACH_AVATAR_URL, LIFE_STAGE_DESCRIPTIONS, LIFE_STAGE_LABELS } from '@/lib/constants';
import type { LifeStage, Segment, UserConstraints } from '@/lib/types';

const TOTAL_STEPS = 8;

const LIFE_STAGE_ORDER: LifeStage[] = [
  'student',
  'early_career',
  'growth',
  'pregnancy_planning',
  'parental_leave',
  'returning_parent',
  'parttime_transition',
];

interface ConfidenceQuestion {
  key: string;
  label: string;
  desc: string;
}

const CONFIDENCE_QUESTIONS: ConfidenceQuestion[] = [
  {
    key: 'techSelfEfficacy',
    label: 'Tech self-efficacy',
    desc: 'I feel confident in my ability to learn and use AI / tech tools.',
  },
  {
    key: 'aiToolReadiness',
    label: 'AI tool readiness',
    desc: 'I can genuinely bring AI tools into my daily work and scenarios.',
  },
  {
    key: 'gapValue',
    label: 'Value of career gaps',
    desc: 'I believe career gaps or caregiving periods also build transferable skills.',
  },
  {
    key: 'domainTransfer',
    label: 'Cross-domain transfer',
    desc: 'I can transfer my existing industry experience into AI-related scenarios.',
  },
  {
    key: 'problemDecompose',
    label: 'Problem decomposition',
    desc: 'I can break complex problems into actionable steps.',
  },
  {
    key: 'ethicsJudgment',
    label: 'Ethical judgment',
    desc: 'I can judge whether AI output is reliable and ethical.',
  },
];

const COACH_LINES: Record<number, string> = {
  1: "Hi there, I'm your AI Coach. Let me get to know you first—this information helps me build a profile that fits you better. No rush, take your time.",
  2: 'Just write down the path you have traveled; no need to polish it into a pretty resume. Real experiences hold many transferable skills.',
  3: 'You can have several goals at once, and adjust direction along the way. Tell me your current constraints, and I will help you design a pace you can actually keep.',
  4: 'You can upload your resume here—I will actually read the text inside it and use your real experience for your diagnosis. This is optional, and you can skip it.',
  5: 'Your current life stage directly shapes the pace of the plan—none is better or worse, just different ways to arrange things.',
  6: 'Next is a self-rated confidence check. Answer with your honest gut feeling; there are no right answers, and I will compare each score with the evidence in your experience.',
  7: 'A note on the next step: self-ratings can run too low or too high. I will not automatically raise your scores; I will check them against what your experience actually demonstrates.',
  8: 'Confirm your information, and you will see your skill portrait next: the strengths the evidence actually supports and the real gaps worth closing. Nothing in it is invented.',
};

const inputCls =
  'w-full rounded-xl border border-silver-300 bg-silver-50 px-3 py-2 text-sm text-slateblue-900 outline-none transition-colors focus:border-coral-500 focus:bg-white';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [backgroundSummary, setBackgroundSummary] = useState('');
  const [constraints, setConstraints] = useState({
    returnToWork: false,
    newIndustry: false,
    flexibility: false,
  });
  const [weeklyHours, setWeeklyHours] = useState(10);
  const [resumeName, setResumeName] = useState('');
  const [resumeStatus, setResumeStatus] = useState<
    'idle' | 'uploading' | 'parsed' | 'error'
  >('idle');
  const [resumePreview, setResumePreview] = useState('');
  const [resumeError, setResumeError] = useState('');
  const [lifeStage, setLifeStage] = useState<LifeStage | null>(null);
  const [confidence, setConfidence] = useState<Record<string, number>>(
    () => Object.fromEntries(CONFIDENCE_QUESTIONS.map((q) => [q.key, 5]))
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill the existing profile after login
  React.useEffect(() => {
    if (!user) return;
    setName((v) => v || user.name);
    setCurrentRole((v) => v || user.currentRole);
    setTargetRole((v) => v || user.targetRole);
    setBackgroundSummary((v) => v || user.backgroundSummary);
    setResumeName((v) => v || user.resumeFileName || user.resumePath || '');
    if (user.resumeText) {
      setResumePreview((v) => v || user.resumeText!);
      setResumeStatus((s) => (s === 'idle' ? 'parsed' : s));
    }
    setLifeStage((v) => v ?? user.lifeStage);
    setConstraints((c) => ({
      returnToWork: c.returnToWork || user.constraints.returnToWork,
      newIndustry: c.newIndustry || user.constraints.newIndustry,
      flexibility: c.flexibility || user.constraints.flexibility,
    }));
  }, [user]);

  function toggleConstraint(key: keyof typeof constraints) {
    setConstraints((c) => ({ ...c, [key]: !c[key] }));
  }

  function setConfidenceValue(key: string, value: number) {
    setConfidence((c) => ({ ...c, [key]: value }));
  }

  async function uploadResume(file: File) {
    setResumeStatus('uploading');
    setResumeError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/resume', { method: 'POST', body: fd });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        resumeFileName?: string;
        resumeText?: string;
      };
      if (!res.ok) throw new Error(data.error || 'Failed to read your resume.');
      setResumeName(data.resumeFileName || file.name);
      setResumePreview(data.resumeText || '');
      setResumeStatus('parsed');
    } catch (e) {
      setResumeStatus('error');
      setResumeError(e instanceof Error ? e.message : 'Failed to read your resume.');
    }
  }

  async function removeResume() {
    setResumeName('');
    setResumePreview('');
    setResumeStatus('idle');
    setResumeError('');
    try {
      await fetch('/api/resume', { method: 'DELETE' });
    } catch {
      /* best-effort */
    }
  }

  async function handleFinish() {
    // Do not gate on the client-side `user` object: anonymous visitors have no
    // profile until the first API write, and the server identifies everyone by
    // cookie anyway (ensureUser creates the profile on demand).
    if (!name.trim()) {
      setError('Please enter your name first');
      setStep(1);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const values = CONFIDENCE_QUESTIONS.map((q) => confidence[q.key] ?? 5);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const confidenceSelf = Math.max(1, Math.min(10, Math.round(avg)));

      const goals: string[] = [];
      if (constraints.returnToWork) goals.push('Return to work');
      if (constraints.newIndustry) goals.push('Switch industries');
      if (constraints.flexibility) goals.push('Flexible work');

      const segment: Segment =
        constraints.returnToWork ||
        constraints.newIndustry ||
        (lifeStage ?? 'student') !== 'student'
          ? 'setter'
          : 'explorer';

      const payloadConstraints: UserConstraints = {
        returnToWork: constraints.returnToWork,
        newIndustry: constraints.newIndustry,
        flexibility: constraints.flexibility,
        weeklyHours,
      };

      await apiSend('/api/profile', 'POST', {
        name: name.trim(),
        currentRole: currentRole.trim(),
        targetRole: targetRole.trim(),
        backgroundSummary,
        constraints: payloadConstraints,
        lifeStage: lifeStage ?? 'student',
        confidenceSelf,
        goals,
        skills: [],
        segment,
        resumePath: resumeName.trim() || undefined,
      });
      await apiSend('/api/skills', 'POST');
      await apiSend('/api/opportunities', 'POST');
      await refresh();
      // Strengths-first journey: skill portrait -> pick one path -> AI Mentor.
      router.push('/skills?from=onboarding');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed, please try again');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState text="Loading your profile…" />
      </div>
    );
  }

  if (!user) {
    // Anonymous visitors can complete onboarding without an account. The
    // profile is saved under their anonymous uid and migrated on sign-up.
  }

  const confidenceSlice =
    step === 6 ? CONFIDENCE_QUESTIONS.slice(0, 3) : CONFIDENCE_QUESTIONS.slice(3, 6);

  return (
    <div className="mx-auto max-w-2xl">
      <SectionTitle
        eyebrow={`Step ${step} / ${TOTAL_STEPS}`}
        title="Build your personal profile"
        desc="About 8 screens, done in a few minutes; feel free to exit midway—your info is saved with your account."
      />

      <div className="mb-4">
        <ProgressBar value={(step / TOTAL_STEPS) * 100} />
      </div>

      {/* AI Coach bubble prompt */}
      <div className="mb-4 rounded-2xl border border-softpink-300 bg-softpink-100 p-3">
        <div className="flex items-start gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={COACH_AVATAR_URL}
            alt="Your AI coach"
            className="h-9 w-9 shrink-0 rounded-full border border-softpink-300 object-cover shadow-sm"
          />
          <p className="text-sm leading-relaxed text-slateblue-800">
            {COACH_LINES[step]}
          </p>
        </div>
      </div>

      <Card>
        {/* 1. Name + role */}
        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-bold text-slateblue-900">
                Your name
              </label>
              <input
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Wei Lin"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-slateblue-900">
                Current role
              </label>
              <input
                className={inputCls}
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
                placeholder="e.g. Primary school math teacher / Full-time mom"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-slateblue-900">
                Target role
              </label>
              <input
                className={inputCls}
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g. AI Operations / AI Product Manager"
              />
            </div>
          </div>
        ) : null}

        {/* 2. Past experience */}
        {step === 2 ? (
          <div>
            <label className="mb-1 block text-sm font-bold text-slateblue-900">
              Past experience (background summary)
            </label>
            <p className="mb-2 text-xs text-slateblue-700">
              Write down the projects you have done, the roles you have held,
              and the problems you have solved—the more specific, the more
              accurate your profile.
            </p>
            <textarea
              className={`${inputCls} min-h-[160px] resize-y`}
              value={backgroundSummary}
              onChange={(e) => setBackgroundSummary(e.target.value)}
              placeholder="Example: taught math to 6 classes, led an online school Q&A group, turned common parent questions into reusable answer templates..."
            />
          </div>
        ) : null}

        {/* 3. Goals and constraints */}
        {step === 3 ? (
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-bold text-slateblue-900">
                Career goals and constraints (multiple choice)
              </p>
              <div className="flex flex-wrap gap-2">
                <Chip
                  active={constraints.returnToWork}
                  onClick={() => toggleConstraint('returnToWork')}
                >
                  Return to work
                </Chip>
                <Chip
                  active={constraints.newIndustry}
                  onClick={() => toggleConstraint('newIndustry')}
                >
                  Switch industries
                </Chip>
                <Chip
                  active={constraints.flexibility}
                  onClick={() => toggleConstraint('flexibility')}
                >
                  Flexible work
                </Chip>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-slateblue-900">
                Hours you can commit per week
              </label>
              <input
                type="number"
                min={1}
                max={60}
                className={inputCls}
                value={weeklyHours}
                onChange={(e) =>
                  setWeeklyHours(Math.max(1, Number(e.target.value) || 1))
                }
              />
              <p className="mt-1 text-xs text-slateblue-700">
                AI will plan an interruptible pace around this many hours—no
                need to push yourself.
              </p>
            </div>
          </div>
        ) : null}

        {/* 4. Resume upload */}
        {step === 4 ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-bold text-slateblue-900">
                Upload your resume (optional, but recommended)
              </p>
              <p className="mt-1 text-xs text-slateblue-700">
                I read the text inside your resume so your diagnosis and coaching
                can use your real experience. PDF, DOCX, or TXT, up to 5&nbsp;MB.
              </p>
            </div>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-silver-400 bg-silver-50 px-6 py-8 text-center transition-colors hover:border-coral-500 hover:bg-coral-50">
              {resumeStatus === 'uploading' ? (
                <RefreshCw className="h-5 w-5 animate-spin text-coral-500" />
              ) : (
                <Upload className="h-5 w-5 text-coral-500" />
              )}
              <span className="text-sm font-bold text-slateblue-900">
                {resumeStatus === 'uploading'
                  ? 'Reading your resume…'
                  : 'Click to choose a file'}
              </span>
              <span className="text-xs text-slateblue-700">
                It will be parsed and saved to your profile
              </span>
              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadResume(f);
                  e.target.value = '';
                }}
              />
            </label>

            {resumeError ? (
              <p className="rounded-xl border border-warmred/40 bg-warmred/10 px-3 py-2 text-sm font-bold text-warmred">
                {resumeError}
              </p>
            ) : null}

            {resumeName && resumeStatus !== 'error' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-xl border border-softpink-300 bg-softpink-100 px-3 py-2 text-sm font-bold text-coral-700">
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate">{resumeName}</span>
                  {resumeStatus === 'parsed' ? (
                    <Check className="h-4 w-4 shrink-0" />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void removeResume()}
                    className="ml-auto shrink-0 text-xs font-bold text-slateblue-700 hover:text-coral-600"
                  >
                    Remove
                  </button>
                </div>
                {resumePreview ? (
                  <details className="rounded-xl border border-silver-300 bg-silver-50 px-3 py-2">
                    <summary className="cursor-pointer text-xs font-bold text-slateblue-700">
                      Preview the text the AI will read
                    </summary>
                    <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-slateblue-700">
                      {resumePreview.slice(0, 1200)}
                      {resumePreview.length > 1200 ? '…' : ''}
                    </p>
                  </details>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* 5. Life stage */}
        {step === 5 ? (
          <div>
            <p className="mb-3 text-sm font-bold text-slateblue-900">
              Your current life stage
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {LIFE_STAGE_ORDER.map((stage) => {
                const active = lifeStage === stage;
                return (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setLifeStage(stage)}
                    className={`rounded-2xl border p-3 text-left transition-colors ${
                      active
                        ? 'border-coral-500 bg-coral-50'
                        : 'border-silver-300 bg-white hover:bg-silver-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          active
                            ? 'border-coral-500 bg-coral-500 text-white'
                            : 'border-silver-400'
                        }`}
                      >
                        {active ? <Check className="h-3 w-3" /> : null}
                      </span>
                      <span className="text-sm font-bold text-slateblue-900">
                        {LIFE_STAGE_LABELS[stage]}
                      </span>
                    </div>
                    <p className="mt-1 pl-7 text-xs leading-relaxed text-slateblue-700">
                      {LIFE_STAGE_DESCRIPTIONS[stage]}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* 6. AI confidence scale (split across two screens) */}
        {step === 6 || step === 7 ? (
          <div className="space-y-5">
            <p className="text-sm font-bold text-slateblue-900">
              AI confidence self-assessment (1-10, go with your gut)
            </p>
            {confidenceSlice.map((q) => (
              <div key={q.key}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slateblue-900">
                    {q.label}
                  </span>
                  <Badge tone="pink">{confidence[q.key] ?? 5} / 10</Badge>
                </div>
                <p className="mb-2 text-xs text-slateblue-700">{q.desc}</p>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={confidence[q.key] ?? 5}
                  onChange={(e) =>
                    setConfidenceValue(q.key, Number(e.target.value))
                  }
                  className="w-full cursor-pointer accent-coral-500"
                />
              </div>
            ))}
          </div>
        ) : null}

        {/* 8. Confirm and finish */}
        {step === 8 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-coral-500" />
              <p className="text-sm font-bold text-slateblue-900">
                Confirm your information
              </p>
            </div>
            <dl className="space-y-2 text-sm">
              {[
                ['Name', name || '—'],
                ['Current role', currentRole || '—'],
                ['Target role', targetRole || '—'],
                ['Life stage', lifeStage ? LIFE_STAGE_LABELS[lifeStage] : '—'],
                ['Weekly commitment', `${weeklyHours} hours`],
                [
                  'Career goals',
                  [
                    constraints.returnToWork ? 'Return to work' : '',
                    constraints.newIndustry ? 'Switch industries' : '',
                    constraints.flexibility ? 'Flexible work' : '',
                  ]
                    .filter(Boolean)
                    .join(', ') || '—',
                ],
                [
                  'Resume',
                  resumeName
                    ? `${resumeName} (parsed ✓)`
                    : 'Not uploaded (optional)',
                ],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-start justify-between gap-4 rounded-xl bg-silver-50 px-3 py-2"
                >
                  <dt className="shrink-0 font-bold text-slateblue-700">{k}</dt>
                  <dd className="text-right text-slateblue-900">{v}</dd>
                </div>
              ))}
            </dl>
            {error ? (
              <p className="rounded-xl border border-warmred/40 bg-warmred/10 px-3 py-2 text-sm font-bold text-warmred">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}

        {error && step !== 8 ? (
          <p className="mt-4 rounded-xl border border-warmred/40 bg-warmred/10 px-3 py-2 text-sm font-bold text-warmred">
            {error}
          </p>
        ) : null}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <Button
            variant="secondary"
            disabled={step === 1 || saving}
            onClick={() => {
              setError('');
              setStep((s) => Math.max(1, s - 1));
            }}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {step < TOTAL_STEPS ? (
            <Button
              onClick={() => {
                setError('');
                setStep((s) => Math.min(TOTAL_STEPS, s + 1));
              }}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating…
                </>
              ) : (
                'See my strengths'
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
