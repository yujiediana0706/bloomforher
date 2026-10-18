# HerRise

> Helping women move from **"Why me?"** to **"Why not me?"** in their AI career transition.
>
> A career-transition platform for women entering AI roles: it translates past experience into transferable, AI-era capabilities using an **evidence-driven** approach, and supports every woman through a **dual-track of free peer support + paid, escrow-backed professional mentoring**.

**Current status: working prototype (deployed on Google Cloud Run)**

- ✅ **Deferred registration**: visitors complete the full diagnosis (profile → skill portrait → path selection) **anonymously** — no sign-up wall. An account is only requested when they want to chat with the AI Mentor or book a peer/mentor session. Anonymous data is migrated to the new account on registration.
- ✅ **Real AI is wired in**: the platform calls **Agent Platform (Vertex AI Reasoning Engine) first**, and falls back to a direct **Vertex AI Gemini 3.5 Flash** call (global endpoint) — so live answers always come from a real large model.
- ✅ **Coach memory**: the AI Mentor receives the user's parsed resume text, past conversation history, tracked action items, and diagnosis conclusions in every prompt — so the coaching is genuinely personal.
- ✅ **Real users and real auth**: self-built email + password registration/login (scrypt salted hashing + a signed httpOnly session cookie); users and credentials are persisted in Firestore. There are **no pre-seeded or test accounts**.
- ✅ **Real resume parsing**: users can upload a resume (PDF / DOCX / TXT); the server extracts the text, stores it on their profile, and feeds it to the AI coach and the diagnosis prompts.
- ✅ **Hands-on practice loop**: every plan task links to a designed micro-task in the Tasks Lab; submissions are graded by AI with rubric feedback, and progress flows back to the dashboard automatically.

This is a submission prototype for the **Google AI Builder Cup** (Sustainability & Social Impact track), APAC region.

---

## 1. Repository structure

```
bloomforher/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # global layout: AuthProvider + Navbar + metadata
│   │   ├── globals.css             # Tailwind directives + design tokens
│   │   ├── page.tsx                # landing page: hero + three-step core flow
│   │   ├── register/               # email + password registration
│   │   ├── login/                  # email + password sign-in
│   │   ├── onboarding/             # journey ① profile (multi-screen form, anonymous-friendly)
│   │   ├── skills/                 # journey ② skill portrait (radar chart, evidence levels, confidence calibration)
│   │   ├── opportunities/          # journey ③ path selection (role matches + trade-offs)
│   │   ├── tasks-lab/              # hands-on micro-tasks (submit → streaming AI feedback + score)
│   │   ├── plan/                   # 30-day action plan (pausable / adjustable)
│   │   ├── plaza/ + plaza/[id]/    # Talk Plaza (peer community · "I'll walk with you" · free peer support)
│   │   ├── community/              # mentor community
│   │   ├── mentors/[id]/           # mentor detail + slot booking
│   │   ├── my-sessions/            # my bookings (peer support + mentor sessions)
│   │   ├── coach/                  # AI Mentor (SSE streaming chat + report + progress)
│   │   ├── evidence/               # evidence vault + "I can" wall
│   │   ├── dashboard/              # workspace: journey progress + confidence ring
│   │   ├── become-mentor/          # apply to become a mentor
│   │   ├── mentor/manage/          # mentor console (profile / slots / bookings)
│   │   └── api/                    # all API routes (nodejs runtime)
│   ├── components/                 # shared components (Navbar / AuthProvider / AuthGate / ui)
│   ├── middleware.ts               # issues a persistent anonymous-uid cookie to every visitor
│   └── lib/
│       ├── types.ts                # domain types (aligned with the data model)
│       ├── constants.ts            # stage labels / confidence formula / navigation
│       ├── mockData.ts             # seed data (single source of truth with scripts/seed.ts)
│       ├── store.ts                # dual-mode data layer (in-memory + Firestore sync)
│       ├── firestore.ts            # GCP Firestore client (lazy-loaded)
│       ├── ai.ts                   # AI call layer (Agent Platform first → Gemini fallback)
│       ├── agent-client.ts         # Reasoning Engine query + Vertex AI Gemini client
│       ├── auth.ts                 # server-only auth: scrypt password hashing + signed session tokens
│       ├── resume.ts               # server-only resume parsing (PDF / DOCX / TXT)
│       ├── accounts.ts             # client-safe session constants
│       ├── session.ts              # server-side session (signed httpOnly cookie + anonymous uid)
│       └── client.ts               # front-end request helpers (apiGet / apiSend)
├── scripts/seed.ts                 # idempotent seeding script (firebase-admin)
├── Dockerfile                      # Cloud Run container image
├── firestore.rules                 # Firestore security rules
├── firestore.indexes.json          # composite index list
└── .env.example                    # environment variable template
```

---

## 2. GCP technical architecture

```
┌──────────────────────────────────── Browser (Next.js App Router · React 18) ────────────────────────────────────┐
│  Landing → onboarding → skills → opportunities → plan  (all anonymous-friendly)                                 │
│  AI Mentor / Dashboard / My Sessions require an account; Talk Plaza is browsable without one                    │
│  Navbar keeps only "Home · AI Mentor · Talk Plaza"; everything else folds into the user menu                    │
└───────────┬──────────────────────────────────────────────────────────────────────────────────────────────────────┘
            │  HTTP / SSE
┌───────────▼────────────────────────────── Next.js Route Handlers (runtime = nodejs) ─────────────────────────────┐
│  /api/auth/session  /api/skills  /api/opportunities  /api/plan  /api/tasks-lab(+submit)  /api/evidence           │
│  /api/coach/chat(SSE)  /api/plaza(+[id]+willing)  /api/peer-chats  /api/mentors  /api/bookings  /api/dashboard  │
│                                                                                                                  │
│  ├─▶ src/lib/store.ts          dual-mode data layer (in-memory fallback + Firestore persistence)                 │
│  ├─▶ src/lib/auth.ts           scrypt password hashing + HMAC-signed session tokens                              │
│  ├─▶ src/lib/session.ts        real session OR anonymous uid (herrise_anon cookie, migrated on sign-up)          │
│  └─▶ src/lib/ai.ts             AI call layer (Agent Platform first → Vertex AI Gemini fallback)                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
            │
            │  Internal network calls (Cloud Run metadata server ADC, no key file)
            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  GCP Vertex AI                                                                                                   │
│  ├─ Agent Platform (preferred) — 5 Reasoning Engines, endpoints configured via env vars                          │
│  │    herrise-assessment / herrise-coach / herrise-memory / herrise-proactive / herrise-mentor-match             │
│  └─ Vertex AI Gemini 3.5 Flash (fallback) — global endpoint aiplatform.googleapis.com                            │
│       Call chain: use the Agent when available; otherwise fall back to the same model via a direct Gemini call,  │
│       so live answers always come from a real large model.                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
  Cloud Firestore (persistence, named database)   /   Google Cloud Storage (resumes)
```

### AI call chain

```
User message → /api/coach/chat → src/lib/ai.ts/coachReply()
                                              │
                              callModel() ────┤ preferred
                                              ▼
                    src/lib/agent-client.ts/callAgentEndpoint()
                    POST {location}-aiplatform.googleapis.com/v1/{endpoint}:query
                                              │
                          Agent unavailable / empty ─┤ fallback
                                              ▼
                    src/lib/agent-client.ts/callGemini()
                    gemini-3.5-flash @ global (native systemInstruction field)
                                              │
                                              ▼
                          SSE streaming → browser
```

**Model candidates**: `gemini-3.5-flash@global` (available) → `gemini-2.5-flash@us-central1` → `gemini-2.0-flash-001@us-central1`, probed one by one until one succeeds. Note the global endpoint hostname is `aiplatform.googleapis.com` (no region prefix), while regional endpoints use `{region}-aiplatform.googleapis.com`.

**Content moderation**: before a Talk Plaza post is created, the herrise-coach agent runs a gentle content check (it only blocks hate speech / violent threats / discrimination / sexual content / malicious attacks; normal sharing, venting, and negative expressions all pass).

### Coach memory (per-user context injected into every prompt)

| Layer | Content |
| --- | --- |
| Resume memory | Parsed text of every uploaded resume (capped per file) |
| Conversation memory | The most recent coach chat turns, loaded from Firestore each session |
| Journey memory | Tracked action items, checked-off tasks, and calibrated skills |
| Diagnosis memory | Key conclusions of the skill portrait and chosen target path |

---

## 3. Data model (Firestore collections)

| Collection | Key fields |
| --- | --- |
| `users/{uid}` | Profile: name/email/currentRole/targetRole/skills[]/goals[]/constraints/lifeStage/confidenceSelf/journeyStep/resumeFileName/resumeText |
| `credentials/{uid}` | Auth credentials: scrypt `salt` + `hash` (never exposed to the client) |
| `publicProfiles/{uid}` | Subset of community-visible fields (avoids exposing the full private profile) |
| `skillProfiles/{uid}` | Skill portrait: transferableSkills[] (evidence level: verified / transferable / hypothesis) + confidenceCalibration[] |
| `opportunityReports/{uid}` | Path analysis: roleMatches[] with matchScore + skill gaps + honest trade-offs |
| `returnPlans/{uid}` / `planTasks/{id}` | 30-day plan and tasks (learning/practice/milestone) |
| `labTasks/{id}` | Hands-on micro-tasks + submissions[] (with rubric feedback and scores) |
| `evidences/{id}` | Evidence vault: 8 types + source(auto/manual) + tags[] + relatedId + isPublic |
| `plazaPosts/{id}` + `comments/` + `willingToHelp/{helperUid}` + `private/meta` | Talk Plaza; **authorId lives in the private sub-document, unreadable by anyone but the author** |
| `peerChats/{id}` | Free peer booking: requested→confirmed→completed, with chatLink/appreciation |
| `mentors/{id}` / `mentorSlots/{id}` | Mentors and their slots (**a mentor document never contains a meetingLink**) |
| `bookings/{id}` / `packageOrders/{id}` / `reviews/{id}` / `endorsements/{id}` | Paid, escrow-backed transaction flow (held→confirmed→completed→released) |
| `coachMessages/{uid}` | AI Coach conversation history (powers coach memory) |

**Key business rules**: evidence settles automatically (assessment / plan check-offs / task submissions / released endorsements / thank-yous after a completed peer chat / milestones). Confidence = base 40 + weighted contributions, capped at 100. HTTP 409 on conflict, 403 on unauthorized access, 401 when not signed in.

---

## 4. Design system

Technology × minimal × warm, in the spirit of the Anthropic/Claude site: warm off-white background, ink primary text, coral interaction accents, thin-bordered cards without heavy shadows, serif display headings. Typography uses a system font stack (no dependency on Google Fonts). Base font size is 17px for readability. The full palette lives in [tailwind.config.ts](tailwind.config.ts).

---

## 5. Running locally

```bash
npm install
npm run dev            # http://localhost:3000
```

It runs with no credentials (data falls back to an in-memory store). Type-check and build:

```bash
npx tsc --noEmit       # type checking
npm run build          # production build
```

### Accounts and zero-state flow

There are **no pre-registered accounts**. A brand-new visitor clicks **Start your diagnosis** and immediately begins onboarding — no sign-up wall. The full diagnosis flow (`/onboarding → /skills → /opportunities → /plan`) works anonymously under a persistent `herrise_anon` cookie issued by middleware. An account is only requested when the visitor wants to use the AI Mentor, dashboard, or book a peer/mentor session; on registration, all anonymous data is migrated to the new account.

---

## 6. Environment variables

See [.env.example](.env.example). Key items:

| Variable | Purpose |
| --- | --- |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID (optional on Cloud Run; ADC resolves it automatically) |
| `AGENT_ENDPOINT_ASSESSMENT` | Assessment agent Reasoning Engine endpoint |
| `AGENT_ENDPOINT_COACH` | Coach agent Reasoning Engine endpoint |
| `AGENT_ENDPOINT_MEMORY` | Memory agent Reasoning Engine endpoint |
| `AGENT_ENDPOINT_PROACTIVE` | Proactive agent Reasoning Engine endpoint |
| `AGENT_ENDPOINT_MENTOR_MATCH` | Mentor-match agent Reasoning Engine endpoint |
| `AUTH_SECRET` | HMAC secret used to sign session cookies |
| `GOOGLE_APPLICATION_CREDENTIALS` | Service-account key path (local development only) |

---

## 7. AI architecture (Vertex AI Gemini + Agent Platform)

**Effective path**: `callModel()` in `src/lib/ai.ts` first tries the Agent Platform; if the agent is unavailable or returns empty, it falls back to a direct **Vertex AI Gemini 3.5 Flash** call (global endpoint). Live answers are produced by Gemini 3.5 Flash (verified in production), satisfying the competition's "Gemini / Vertex AI" requirement.

The 5 independent agents are designed in GCP Agent Studio with Reasoning Engine endpoints (wired via environment variables):

| Agent | Role | AI function mapping |
| --- | --- | --- |
| **herrise-assessment** | Assessment agent | `buildSkillProfile` / `buildOpportunityReport` / `buildReturnPlan` / `buildLabTasks` / `evaluateSubmission` |
| **herrise-coach** | Coach agent | `coachReply` / `buildWeeklyConfidenceSummary` / `moderateContent` |
| **herrise-memory** | Memory agent | RAG knowledge retrieval (public career knowledge + the user's private memory) |
| **herrise-proactive** | Proactive agent | Triggered reminders, behavior analysis, intervention strategies |
| **herrise-mentor-match** | Mentor-match agent | Mentor recommendation and matching |

**Coach behavior principles**: the AI Mentor helps the user see their abilities accurately and act on facts — supportive but never sycophantic. Every capability judgment must be grounded in the user's actual experience; strengths and real skill gaps are stated honestly, and confidence is built through executable actions rather than empty praise. The skill portrait distinguishes **verified strengths**, **transferable abilities**, **unverified hypotheses**, and **genuine skill gaps**, each labeled with an evidence level.

**Authentication**: on Cloud Run the platform uses the metadata server for ADC (`GoogleAuth`, no key file required); in local development you can explicitly point to `GOOGLE_APPLICATION_CREDENTIALS`.

---

## 8. Deployment (Cloud Run)

### What is configured

1. ✅ `Dockerfile`: multi-stage build with Next.js standalone output (Node.js)
2. ✅ Cloud Run service: `herrise-frontend`, region `us-central1`, unauthenticated access allowed
3. ✅ Firestore named database + composite indexes + security rules; Cloud Storage rules for private resume buckets

### Live URL

**https://herrise-frontend-41961229241.us-central1.run.app**

### Redeploying

```bash
gcloud run deploy herrise-frontend --source . --region us-central1 \
  --allow-unauthenticated --port 3000 --memory 1Gi --cpu 1 --max-instances 10
```

---

## 9. Acceptance self-check

| Item | Status |
| --- | --- |
| `npm run build` passes | ✅ All routes build successfully |
| `npx tsc --noEmit` passes | ✅ No type errors |
| No simulator leftovers / no admin console entry | ✅ |
| Deferred registration (anonymous diagnosis, gated mentor/chat) | ✅ |
| Core flow (diagnosis → path selection → AI Mentor) is fully interactive | ✅ |
| AI replies come from a real model | ✅ Vertex AI Gemini 3.5 Flash (global endpoint) |
| Content moderation | ✅ herrise-coach gentle moderation |
| Email + password auth (scrypt + signed httpOnly cookie) | ✅ No pre-registered accounts |
| Live URL + GitHub + Cloud Run deployment | ✅ |

---

## 10. Roadmap

| Item | Current state | Next step |
| --- | --- | --- |
| Full Agent Engine chain | 5 agents designed in Agent Studio; when an endpoint is unavailable the system automatically falls back to a direct Gemini call | Deploy the Reasoning Engines in Agent Studio to open the "Agent Platform preferred" path — no code changes needed |
| Production-grade auth | Self-built email + password with scrypt hashing and a signed httpOnly session cookie | Optionally migrate to Firebase Auth / OAuth providers |
| Resume parsing | `unpdf` / `mammoth` parsing wired in with injection length limits | Improve structured extraction and reduce false positives |

---

## Appendix: commands and configuration quick reference

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development (in-memory data) |
| `npm run build` / `npm start` | Production build / start |
| `npx tsc --noEmit` | Type checking |
| `npm run seed` | Idempotent Firestore seeding (requires a service account) |
| `gcloud run deploy herrise-frontend --source .` | Deploy to Cloud Run |
