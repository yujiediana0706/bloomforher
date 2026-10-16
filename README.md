# ReBloom AI

> Helping women move from **"Why me?"** to **"Why not me?"** in their AI career transition.
>
> A career-transition platform for women entering AI roles: it translates past experience into transferable, AI-era capabilities using an **evidence-driven** approach, and supports every woman through a **dual-track of free peer support + paid, escrow-backed professional mentoring**.

**Current status: working prototype (Phase 2 — deployed on Cloud Run)**

- ✅ All pages and interaction flows are implemented, backed by a **dual-mode data layer** (in-memory fallback + Firestore persistence).
- ✅ **Real AI is wired in**: the platform calls **Agent Platform (Vertex AI Reasoning Engine) first**, and falls back to a direct **Vertex AI Gemini 3.5 Flash** call (global endpoint) — so live answers always come from a real large model.
- ✅ 5 independent agents (assessment, coach, memory, proactive, mentor-match) are created in GCP Agent Studio with Reasoning Engine endpoints.
- ✅ **Real users and real auth**: self-built email + password registration/login (scrypt salted hashing + a signed httpOnly session cookie); users and credentials are persisted in Firestore. There are **no demo or pre-seeded accounts**.
- ✅ **Real resume parsing**: users can upload a resume (PDF / DOCX / TXT); the server extracts the text, stores it on their profile, and feeds it to the AI coach and the diagnosis prompts.
- ✅ **Profile and diagnosis persist to Firestore**: the onboarding profile, skill profile, opportunity report and return plan are all written back to Firestore.
- ✅ **Deployed on Cloud Run** (see §8).

This is a submission prototype for the **Google AI Builder Cup** (Sustainability & Social Impact track), APAC region.

---

## 1. Repository structure

```
bloomforher/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # global layout: AuthProvider + Navbar + footer
│   │   ├── globals.css             # Tailwind directives + metallic utility classes
│   │   ├── page.tsx                # landing page: three-step core flow + hero
│   │   ├── register/               # email + password registration
│   │   ├── login/                  # email + password sign-in
│   │   ├── onboarding/             # journey ① profile (multi-screen form)
│   │   ├── skills/                 # journey ② skill discovery (transferable skills + confidence calibration)
│   │   ├── opportunities/          # journey ③ AI opportunities (role matches + women-friendly tracks)
│   │   ├── tasks-lab/              # journey ④ hands-on tasks (submit → streaming feedback + score)
│   │   ├── plan/                   # journey ⑤ 30-day return plan (pausable / adjustable)
│   │   ├── plaza/ + plaza/[id]/    # Talk Plaza (visual community · "I'm willing to help" · free peer support)
│   │   ├── community/              # mentor community
│   │   ├── mentors/[id]/           # mentor detail + slot booking
│   │   ├── my-sessions/            # my bookings (peer support + mentor sessions)
│   │   ├── coach/                  # cross-cutting A: AI Mentor (SSE streaming)
│   │   ├── evidence/               # cross-cutting B: evidence vault + "I can" wall
│   │   ├── dashboard/              # workspace: journey progress + confidence ring + impact data
│   │   ├── become-mentor/          # apply to become a mentor
│   │   ├── mentor/manage/          # mentor console (profile / slots / bookings)
│   │   └── api/                    # all API routes (nodejs runtime)
│   ├── components/                 # shared components (Navbar / AuthProvider / ui / JourneyBanner)
│   └── lib/
│       ├── types.ts                # domain types (aligned with the data model)
│       ├── constants.ts            # stage labels / confidence formula / flower names / navigation
│       ├── mockData.ts             # seed data (single source of truth with scripts/seed.ts)
│       ├── store.ts                # dual-mode data layer (in-memory + Firestore sync)
│       ├── firestore.ts            # GCP Firestore client (lazy-loaded)
│       ├── ai.ts                   # AI call layer (Agent Platform first → Gemini fallback)
│       ├── agent-client.ts         # Reasoning Engine query + Vertex AI Gemini client
│       ├── auth.ts                 # server-only auth: scrypt password hashing + signed session tokens
│       ├── resume.ts               # server-only resume parsing (PDF / DOCX / TXT)
│       ├── accounts.ts             # client-safe session constant
│       ├── session.ts              # server-side session (signed httpOnly cookie)
│       └── client.ts               # front-end request helpers (apiGet / apiSend)
├── scripts/seed.ts                 # idempotent seeding script (firebase-admin)
├── Dockerfile                      # Cloud Run container image
├── cloudbuild.yaml                 # Cloud Build CI/CD (build → push → deploy)
├── firestore.rules                 # Firestore security rules
├── firestore.indexes.json          # composite index list
└── .env.local                      # environment variables (agent endpoints / GOOGLE_CLOUD_PROJECT)
```

---

## 2. GCP technical architecture

```
┌──────────────────────────────────── Browser (Next.js App Router · React 18) ────────────────────────────────────┐
│  Landing → onboarding → skills → opportunities → tasks-lab → plan                                              │
│  Talk Plaza / Mentor Community / My Sessions / AI Mentor / Evidence Vault / Workspace                           │
│  Navbar keeps only "Home · AI Mentor · Talk Plaza"; everything else folds into AI Mentor "More features"         │
└───────────┬──────────────────────────────────────────────────────────────────────────────────────────────────────┘
            │  HTTP / SSE
┌───────────▼────────────────────────────── Next.js Route Handlers (runtime = nodejs) ─────────────────────────────┐
│  /api/auth/session  /api/skills  /api/opportunities  /api/plan  /api/plan-tasks  /api/tasks-lab(+submit)         │
│  /api/evidence  /api/coach/chat(SSE)  /api/plaza(+[id]+willing)  /api/peer-chats                                 │
│  /api/mentors(+[id])  /api/mentor/profile  /api/mentor/slots  /api/bookings  /api/reviews                        │
│  /api/circles(+[id])  /api/dashboard  /api/profile  /api/my-sessions                                             │
│                                                                                                                  │
│  ├─▶ src/lib/store.ts          dual-mode data layer (in-memory fallback + Firestore persistence)                 │
│  ├─▶ src/lib/auth.ts           scrypt password hashing + HMAC-signed session tokens                              │
│  └─▶ src/lib/ai.ts             AI call layer (Agent Platform first → Vertex AI Gemini fallback)                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
            │
            │  Internal network calls (Cloud Run metadata server ADC, no key file)
            ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  GCP Vertex AI                                                                                                   │
│  ├─ Agent Platform (preferred) — 5 Reasoning Engines (us-west1), endpoints configured                            │
│  │    rebloom-assessment / rebloom-coach / rebloom-memory / rebloom-proactive / rebloom-mentor-match            │
│  └─ Vertex AI Gemini 3.5 Flash (fallback) — global endpoint aiplatform.googleapis.com                           │
│       Call chain: use the Agent when available; otherwise fall back to the same model via a direct Gemini call, │
│       so live answers always come from a real large model.                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
            │
            ▼
  Cloud Firestore (persistence)   /   Google Cloud Storage (resumes / certificates)
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

**Content moderation**: before a Talk Plaza post is created, the rebloom-coach agent runs a gentle content check (it only blocks hate speech / violent threats / discrimination / sexual content / malicious attacks; normal sharing, venting, and negative expressions all pass).

---

## 3. Data model (Firestore collections)

| Collection | Key fields |
| --- | --- |
| `users/{uid}` | Profile: name/email/currentRole/targetRole/skills[]/goals[]/constraints/lifeStage/confidenceSelf/journeyStep/coffeeAvailability[]/communityAgreed/resumeFileName/resumeText (text extracted from the uploaded resume) |
| `credentials/{uid}` | Auth credentials: scrypt `salt` + `hash` (never exposed to the client) |
| `publicProfiles/{uid}` | Subset of community-visible fields (read by the Plaza for booking; avoids exposing the full private profile) |
| `skillProfiles/{uid}` | Skill discovery: transferableSkills[] + uniqueValue + confidenceCalibration[] |
| `opportunityReports/{uid}` | Opportunity analysis: roleMatches[] + womenFriendlyTracks[] + genderRiskHints[] |
| `returnPlans/{uid}` / `planTasks/{id}` | 30-day plan and tasks (learning/practice/milestone) |
| `labTasks/{id}` | Hands-on tasks + submissions[] (with rubric feedback and scores) |
| `evidences/{id}` | Evidence vault: 8 types + source(auto/manual) + tags[] + relatedId + isPublic |
| `plazaPosts/{id}` + `comments/` + `willingToHelp/{helperUid}` + `private/meta` | Talk Plaza; **authorId lives in the private sub-document, unreadable by anyone but the author** |
| `peerChats/{id}` | Free peer booking: requested→confirmed→completed, with chatLink/appreciation |
| `mentors/{id}` / `mentorSlots/{id}` | Mentors and their slots (**a mentor document never contains a meetingLink**) |
| `bookings/{id}` / `packageOrders/{id}` / `reviews/{id}` / `endorsements/{id}` | Paid, escrow-backed transaction flow (held→confirmed→completed→released) |
| `posts/{id}` + `comments/` / `kudos/` / `reports/` | Generic circles |
| `conversations/{uid}/messages/{mid}` | AI Coach conversation history |

**Key business rules**: evidence settles automatically (assessment / plan check-offs / task submissions / released endorsements / thank-yous after a completed peer chat / posts reaching 3 kudos / milestones 1·5·10). Confidence = base 40 + weighted contributions (mentor endorsement 8, peer thank-you 6, assessment 6, portfolio piece 6, task progress 3, milestone 5, peer recognition 2), capped at 100. Anonymous flower names, HTTP 409 on conflict, 403 on unauthorized access, 401 when not signed in.

---

## 4. Design system

Technology × minimal × warm. The base is a **silver metallic feel** (page background `#EEF0F4`, white cards, `rounded-2xl`, very light metallic gradient strips for the navbar underline and progress tracks); warm accents include warm coral orange `#E8725C` (primary CTA / current-step highlight / kudos state), soft pink `#F3B8C8` / apricot pink `#F9E4E0` (evidence wall / help posts / "I can" tags), slate-blue-gray emphasis text `#3E4C63`, and status colors: confirmed slate blue / released warm green `#7FB685` / rejected warm red. Typography uses a system font stack (no dependency on Google Fonts). The full palette lives in [tailwind.config.ts](tailwind.config.ts).

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

There are **no demo accounts**. A brand-new visitor opens `/register`, creates an account with their own email and password (self-built auth: scrypt salted hashing + a signed httpOnly session cookie, persisted in Firestore), and then starts the full career diagnosis from zero — `/onboarding → /skills → /opportunities → /tasks-lab → /plan`, with `/coach` (AI Mentor), `/plaza`, and the paid mentor marketplace available along the way. Sign-in for returning users is at `/login`.

---

## 6. Environment variables

See [.env.example](.env.example). Key items:

| Variable | Purpose |
| --- | --- |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID |
| `FIREBASE_PROJECT_ID` | Firebase project ID (Firestore persistence) |
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

The 5 independent agents are created in GCP Agent Studio with Reasoning Engine endpoints (wired into `.env.local` and `cloudbuild.yaml`):

| Agent | Role | AI function mapping |
| --- | --- | --- |
| **rebloom-assessment** | Assessment agent | `buildSkillProfile` / `buildOpportunityReport` / `buildReturnPlan` / `buildLabTasks` / `evaluateSubmission` |
| **rebloom-coach** | Coach agent | `coachReply` / `buildWeeklyConfidenceSummary` / `moderateContent` |
| **rebloom-memory** | Memory agent | RAG knowledge retrieval (public career knowledge + the user's private memory) |
| **rebloom-proactive** | Proactive agent | Triggered reminders, behavior analysis, intervention strategies |
| **rebloom-mentor-match** | Mentor-match agent | Mentor recommendation and matching |

**Prompt injection of 4-layer memory**: parsed text from every uploaded resume, coachNote, tracked action items + skills, and the key conclusions of the diagnosis report.

**Authentication**: on Cloud Run the platform uses the metadata server for ADC (`GoogleAuth`, no key file required); in local development you can explicitly point to `GOOGLE_APPLICATION_CREDENTIALS`.

**Local development limitation**: networks in mainland China cannot reach the GCP OAuth token endpoint, so AI calls automatically fall back to placeholder logic; once deployed to Cloud Run, GCP's internal network has no such restriction and AI calls work normally.

---

## 8. Deployment (Cloud Run)

### Architecture

```
GitHub (main branch) → Cloud Build trigger → Docker build → GCR → Cloud Run
```

### What is configured

1. ✅ Cloud Build trigger: a push to `main` fires automatically
2. ✅ `Dockerfile`: multi-stage build with standalone output, deployed as a Node.js 20 service
3. ✅ `cloudbuild.yaml`: 3 steps (build → push → deploy), with agent endpoints injected directly
4. ✅ Cloud Run service: `rebloom-ai`, region `asia-southeast1`, unauthenticated access allowed

### Live URL

**https://rebloom-ai-107927033625.asia-southeast1.run.app**

### Redeploying

Push code to the `main` branch and Cloud Build is triggered automatically:

```bash
git push origin main
```

You can also trigger it manually from GCP Console → Cloud Build → Triggers.

---

## 9. Acceptance self-check

| Item | Status |
| --- | --- |
| `npm run build` passes | ✅ All 37 routes build successfully |
| `npx tsc --noEmit` passes | ✅ No type errors |
| No simulator leftovers / no admin console entry | ✅ |
| Palette matches §4 (silver metallic base + coral/soft-pink accents) | ✅ |
| Core flow (diagnosis → AI Mentor → Talk Plaza) is fully interactive | ✅ |
| AI replies come from a real model | ✅ Vertex AI Gemini 3.5 Flash (global endpoint) |
| Content moderation | ✅ rebloom-coach gentle moderation |
| Email + password auth (scrypt + signed httpOnly cookie) | ✅ No demo accounts |
| Live URL + GitHub + Cloud Run deployment | ✅ |

---

## 10. 30-second demo script

> (Register a fresh account, then walk through the flow from zero)

"Many women are not short on ability — they **underestimate how much technology is already theirs**. ReBloom does something simple —

**First, it translates experience into evidence.** After you register and build your profile, the skill discovery page tells you that the projects you led and the people you coordinated are exactly the capabilities AI roles need — and a 'Self-rating vs AI' calibration board helps you reclaim the self you undervalued.

**Second, it turns a direction into something executable.** The AI opportunities page gives you 3 matched roles and women-friendly tracks; hands-on tasks let you produce your first AI portfolio piece in 30 minutes and get feedback and a score; the 30-day plan adapts to your rhythm — **pausing is not dropping out.**

**Third, it turns companionship into two tracks.** When you feel low, the AI Coach doesn't serve platitudes — it **pulls up your own evidence**, reframes 'why me' into 'why not me', and sends you to the **Talk Plaza** to meet other women. The Plaza is public-interest: one 'I'm willing to help' books a free peer chat. When you need more professional support, you book a verified mentor — fees are held in escrow and **released only after you confirm the session is complete.**

Every positive signal — mentor endorsements, peer thank-yous, kudos — settles automatically into a row of '**I can**'s in your evidence vault.

From **Why me** to **Why not me**."

### 5-minute full demo video script

| Time | Screen | Narration / actions |
| --- | --- | --- |
| 0:00–0:30 | Landing page hero scrolls slowly, slogan fades in | "Many women are not short on ability — they underestimate how much technology is already theirs. ReBloom turns that underestimation into an executable transition path." |
| 0:30–1:20 | Register a brand-new account at `/register` → onboarding | "Three core steps: first, say who you are, where you are now, and where you want to go." Shows life stage, current/target role, weekly hours. |
| 1:20–2:10 | Skills page → "Self-rating vs AI" calibration board | "Click generate: the AI picks 5 transferable skills from your real experience — notice this board: you rated yourself 5, the AI scores 8. The 3-point gap is exactly the part that gets systematically underestimated." |
| 2:10–2:50 | AI opportunities page → 3 roles + women-friendly tracks | "3 matched roles, match scores, plus women-friendly tracks and risk hints." |
| 2:50–3:30 | AI Mentor chat (SSE streaming) | "When you're feeling low, the AI doesn't serve platitudes: it pulls a real achievement from your own evidence vault, reframes 'why me' into 'why not me', and gives one 10-minute micro-action." Caption: answers generated live by **Vertex AI Gemini 3.5 Flash**. |
| 3:30–4:10 | Talk Plaza → "I'm willing to help" → free peer chat booking | "The Plaza is public-interest: one 'I'm willing to help' is enough to book a free peer chat." |
| 4:10–4:40 | Mentor detail → paid escrow flow | "When you need more professional support, book a verified mentor. Funds are held in escrow and released only after you confirm the session is complete." |
| 4:40–5:00 | Workspace → evidence vault "I can" wall + confidence ring | "Every positive signal settles automatically into a row of 'I can's. From Why me, to Why not me." |

> Recording tips: register a fresh account before recording so the whole flow starts from zero; keep the real waiting and streaming in the AI segment without cutting or speeding up, to prove it's a real model rather than a script; end by overlaying the architecture diagram (see §2).

---

## 11. Roadmap

| Item | Current state | Next step |
| --- | --- | --- |
| Full Agent Engine chain | 5 agents are created in Agent Studio with endpoints, but live `:query` calls return empty (the Reasoning Engines are still drafts and have not produced a callable runtime package), so the system automatically falls back to a direct Gemini call | Click "Deploy" in Agent Studio to generate a runtime instance and open the "Agent Platform preferred" path — no code changes needed |
| Production-grade auth | Self-built email + password with scrypt hashing and a signed httpOnly session cookie | Optionally migrate to Firebase Auth / OAuth providers |
| Resume / degree parsing | `unpdf` parsing is wired in with injection length limits | Improve structured extraction and reduce false positives |

---

## Appendix: commands and configuration quick reference

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development (in-memory data) |
| `npm run build` / `npm start` | Production build / start |
| `npx tsc --noEmit` | Type checking |
| `npm run seed` | Idempotent Firestore seeding (requires a service account) |
| `git push origin main` | Trigger automatic Cloud Build deployment |
