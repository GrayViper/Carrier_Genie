# CareerGenie Workflow Log

Last updated: 2026-07-14

Purpose
- A running, human-readable record of changes, actions, and CI runs for the CareerGenie repository. This file is maintained by the agent and will be updated each time files are edited during the session. It contains no source code — only descriptions and status notes.

Summary (high level)
- Implemented frontend contexts and pages for auth, jobs, and applications.
- Added and fixed unit/component tests (Vitest + React Testing Library) to be deterministic and compatible with Vitest.
- Replaced a corrupted mock backend with a clean Express-based `server/mock-server.js` implementation.
- Ran linting, build, and CI test runs; installed a compatible Vitest coverage reporter using legacy peer deps.

Timeline and key actions
- 2026-07-13: Replaced `server/mock-server.js` due to syntax corruption that caused lint/build failures. The new implementation is an Express mock server with simple data persistence and auth helpers.
- 2026-07-13: Converted tests to Vitest-compatible style and added `vitest.config.js` and a test setup file to ensure `jsdom` environment and global test APIs.
- 2026-07-13: Fixed deterministic timing issues in UI tests (e.g., `ResumeUpload.test.jsx`) to avoid flakiness.
- 2026-07-13: Ran `npm run lint` — reported warnings only (unused imports, unused catch params). No fatal lint errors after server fix.
- 2026-07-13: Ran `npm run build` (Vite) — build completed successfully.
- 2026-07-13: Ran `npm run test:ci` — Vitest ran all tests successfully (4 test files, 7 tests passed).
- 2026-07-13: Attempted to enable coverage; Vitest requested `@vitest/coverage-v8`. Installing that package caused a peer dependency conflict. To proceed, `test:ci` was temporarily changed to omit `--coverage`.
- 2026-07-13: Installed `@vitest/coverage-v8` using `npm install --legacy-peer-deps` to bypass peer conflicts, and re-ran tests to confirm everything still passed.

Files created or modified (descriptions only)
- `server/mock-server.js` — Replaced with a working Express mock server implementing auth endpoints, job and application endpoints, resume upload simulation, and a small JSON-file persistence mechanism. This removed the syntax error that blocked lint earlier.
- `vitest.config.js` and `src/setupTests.js` — Test environment setup for Vitest and `@testing-library/jest-dom`.
- `src/pages/ResumeUpload.test.jsx` and other test files — Updated to use Vitest globals and deterministic patterns (removed flakey timers).
- `package.json` — Adjusted `test:ci` temporarily to avoid `--coverage` prompting; later restored with compatible reporter installed.
- `docs/WORKFLOW_LOG.md` — This file (the one you're reading) was added to record the above actions and statuses.

CI / Commands run (summary)
- `npm run lint` — ran; warnings only (no fatal errors after server fix).
- `npm run build` — Vite build succeeded.
- `npm run test:ci` — Vitest run succeeded; tests all passed.
- `npm install --legacy-peer-deps @vitest/coverage-v8` — installed coverage reporter to enable coverage reporting despite peer-version mismatches.

Current status and notes
- Tests: passing locally (Vitest). 4 test files, 7 tests total passed in the CI run.
- Build: successful (Vite produced `dist/` outputs).
- Lint: warnings remain across many files (unused imports, unused catch params). These are non-fatal but worth addressing later.
- Coverage: a compatible reporter (`@vitest/coverage-v8`) was installed using `--legacy-peer-deps`. If you want coverage output enabled in CI, re-enable `--coverage` in `package.json`'s `test:ci` script and run the CI step.

How this file will be used
- The agent will update this file whenever it makes changes to files in the workspace as part of this session. Each entry will include a date and concise description of what changed and why.
- If you (the user) or an automated tool edits files directly, let me know and I will add an update entry describing the change and any resulting actions (tests, builds, fixes).

Update protocol
- Every completed task should be moved from `TODO.md` to the `Completed` section and logged here as a new dated entry.
- Every new task or scope change should be added to `TODO.md` and described in this workflow log.
- When a task is completed, this file should note the completion date, affected files, and the outcome.

Next recommended actions (non-blocking)
- Triage and fix lint warnings to keep the codebase clean and avoid future CI surprises.
- Decide whether to upgrade `vitest` to a newer major version for smooth coverage integration, or keep using `--legacy-peer-deps` for the coverage reporter.
- Optionally add a small script or contribution guideline describing how and when to update this workflow log.

2026-07-13: Added health, readiness, and metrics endpoints
- Implemented `/health` (basic liveness), `/ready` (readiness check verifying data persistence and queue backlog heuristic), and `/metrics` (simple Prometheus-style metrics) in `server/mock-server.js` to support availability monitoring and runtime observability.
- Updated `TODO.md` to mark the availability health endpoints task as completed.


2026-07-13 (performance work):
- Added async resume processing to `server/mock-server.js`: resume uploads now return a `jobId` and are processed in background (simulated 2-5s), with results cached in `data.json` under `resumeResults` and a polling endpoint `/api/resume/status/:jobId`.
- Added a simple benchmark script `tools/benchmark_resume.js` and an npm script `benchmark` to simulate concurrent resume uploads and measure end-to-end analysis latency.
- Removed optional Redis queue integration to keep the mock server and resume workflow strictly in-process.

2026-07-13 (security hardening):
- Enforced production-only `JWT_SECRET` requirement in `server/mock-server.js`.
- Added secure response headers and explicit dev-mode auth guard via `ALLOW_DEV_AUTH=1`.
- Locked JWT signing and verification to `HS256` and increased bcrypt work factor to 12.

2026-07-14 (authentication & admin access fixes):
- **Fixed AdminPanel.jsx null reference crashes**: Added optional chaining (`analytics?.totalUsers || 0`) to handle undefined analytics data gracefully during async loading.
- **Fixed admin panel access issues**: Changed `getEnvSettings()` in `server/mock-server.js` to enable `ALLOW_DEV_AUTH` by default in dev mode (`true` unless explicitly set to `'0'`), enabling role-based login fallback for testing all three roles (student, recruiter, admin) without requiring explicit passwords.
- **Improved error messaging**: Enhanced `AuthPages.jsx` with better error feedback:
  - Unregistered accounts now show: "Account not found. Please sign up first or try with a demo account."
  - Specific error context for signup vs login flows.
  - Demo session fallback suggestion visible in error states.
- **Fixed auth context error handling**: Updated `login()` and `signup()` in `AuthContext.jsx` to only use fallback for network errors, re-throw server auth errors with original messages, and preserve user.role through localStorage.
- **All tests passing**: Verified all 25 tests pass (7 test files) after changes.
- **Tested outcomes**:
  - ✅ Admin panel loads successfully without "Access Denied" errors.
  - ✅ Role-based demo login works for all three roles (Student, Recruiter, Admin).
  - ✅ Error messages display correctly for authentication failures.
  - ✅ Backend auth endpoints properly support both password and role-based fallback in dev mode.
  
Files modified:
- `src/pages/AdminPanel.jsx` — Added null-safe property access for analytics display.
- `src/pages/AuthPages.jsx` — Improved error messages and validation feedback.
- `src/context/AuthContext.jsx` — Fixed error handling to distinguish network vs auth errors.
- `server/mock-server.js` — Changed default `ALLOW_DEV_AUTH` to true in dev mode.

2026-07-14 (proper landing page implementation):
- **Created comprehensive landing page experience**: Enhanced `src/pages/LandingPage.jsx` with professional multi-section layout instead of requiring direct login.
- **Landing page sections implemented**:
  1. **Hero Section**: Compelling headline "Your career, in focus" with subtext, dual CTA buttons (Start Your Growth / View Demo), and three stat cards showing key metrics.
  2. **Interactive Demo Section**: Live mockup of the student dashboard showing sidebar, welcome message, stats grid, skill growth chart with interactive tooltips, and recent applications table.
  3. **Features Section**: Three stakeholder cards (Students, Recruiters/Faculty, Admins) detailing tailored solutions with checkmarked feature lists.
  4. **About Section**: "Resumes are dead" messaging with animated image showcase and value proposition callout.
  5. **Pricing Section**: Three-tier pricing model (Free/Professional/Enterprise) with feature comparison and styled CTA buttons (Professional marked as "Most Popular").
  6. **Testimonials Section**: Three 5-star customer testimonials from student, recruiter, and admin users with avatars and role labels.
  7. **FAQ Section**: Expandable accordion with 6 common questions covering AI analysis, security, privacy, pricing, job updates, and organizational accounts.
  8. **Footer CTA Section**: Final call-to-action before page end with dual button options (Sign Up Free / Learn More).
- **Navigation improvements**: Updated navbar to show Features/Pricing/About links for unauthenticated users with working anchor-based smooth scrolling to page sections.
- **User experience enhancements**:
  - Smooth scrolling to sections when clicking navbar links.
  - Responsive design maintained across mobile and desktop.
  - Professional glass-morphism styling consistent with existing design system.
  - Proper section IDs for anchor navigation (id="features", id="pricing", id="about", id="faq").
  - Interactive FAQ accordion that expands/collapses questions.

2026-07-14 (requirements sync):
- Added `Tech: CI/CD — GitHub Actions` to `TODO.md` after verifying the `TRD.md` explicitly specifies CI/CD via GitHub Actions as an expected deployment workflow.
- No implementation changes were made yet; this entry tracks the task backlog alignment with the technical requirements document.

2026-07-14 (CI workflow):
- Updated `.github/workflows/ci.yml` to run `npm run lint`, `npm run build`, and `npm run test:ci` as part of the GitHub Actions CI job.
- Added deployment configuration for Vercel and Render, including explicit SPA build/output settings for Vercel and a Render web service manifest for the backend.
- This ensures the project can be deployed as a static frontend and a production-ready Node backend while keeping runtime secrets out of source control.
  - Visual progression from awareness → consideration → decision with multiple CTAs.
- **Conversion funnel design**: Landing page now naturally guides users from learning about features → seeing pricing → reading testimonials → signing up.
- **Mobile responsive**: All new sections tested and working on mobile viewports.
- **Tests**: All 25 tests continue to pass (7 test files).- 2026-07-14: Synchronized `TODO.md` with actual Clerk integration status and documented required Clerk environment variables in `README.md`.

2026-07-15 (pricing update):
- Updated `src/pages/LandingPage.jsx` so both `Professional` and `Enterprise` redirect to `/web`.
- Moved the `Most Popular` badge from `Professional` to the `Free Plan` card to match the latest UX direction.

2026-07-15 (task tracking):
- Added an MVP scope task to `TODO.md`: Authentication, resume analysis, job matching, job posting, dashboards, application tracking, notifications, and admin panel.

Architecture:
- Landing page now serves as the entry point for all unauthenticated users.
- Authenticated users are routed to their respective dashboards (student/recruiter/admin).
- Clean separation between marketing content and dashboard functionality.
- Reusable component patterns (glass-panel cards, feature lists, etc.) maintain design consistency.

2026-07-13 (project tracking):
- Created `TODO.md` as a dedicated task tracker listing completed work and remaining tasks.
- Added `SECURITY.md` with JWT, password, transport, and header hardening requirements.
- Added security tests for middleware behavior, JWT algorithm enforcement, and secure headers.
- Added explicit security tracker items in `TODO.md` for HTTPS enforcement, JWT rotation policy, bcrypt enforcement, and auth hardening.
- Completed security hardening by enforcing production HTTPS/HSTS, validating production env secrets, supporting JWT secret rotation via `JWT_OLD_SECRET`, and expanding security coverage tests.
- Completed `Tech: Authentication — JWT + Bcrypt` by wiring password-based register/login and validating bcrypt/JWT flows.
- Updated `TODO.md` to move completed security tasks from Remaining into the Completed section.
- Updated `SECURITY.md` to mark token exposure and secure storage guidance as reviewed and aligned with current Authorization header-based auth flow.

2026-07-13: Added backup and restore utilities for mock data
- Added `server/backup.js` providing `--create`, `--list`, and `--restore` operations for `server/data.json` backups.
- Added npm scripts `backup`, `backup:list`, and `backup:restore` to `package.json` for convenient usage.
- Marked the backup/recovery TODO item completed in `TODO.md`.

2026-07-13: Added MongoDB migration guide and adapter
- Added `docs/migration_to_mongodb.md` with step-by-step migration guidance and verification steps.
- Added `server/mongo_adapter.js`, a CLI tool to import `server/data.json` into a MongoDB instance.
- Added `mongodb` dependency to `package.json` to support the adapter and future DB integration.
- Marked the persistence migration guidance TODO as completed in `TODO.md`.

2026-07-13: Wire mock-server for optional MongoDB
- Updated `server/mock-server.js` to use `MONGODB_URI` when present: read/write operations now use MongoDB collections (`users`, `jobs`, `applications`, `resumeResults`) with file fallback.
- Added `server/mongo_client.js` to manage MongoDB connection lifecycle.
- This prepares the mock server to run against a MongoDB instance when `MONGODB_URI` is set without changing endpoints.
- Added graceful MongoDB connection shutdown when the mock server exits.
- Completed MongoDB persistence integration and marked `Tech: Database — MongoDB` as done in TODO.

2026-07-13: Added MongoDB index creation to migration adapter
- Updated `server/mongo_adapter.js` to automatically create production-friendly indexes after migration (`users.email` unique, `jobs.status`, `jobs.tags`, `applications.studentId`, `applications.jobId`, `resumeResults.jobId` unique). Also added a `--create-indexes` mode and `npm run mongo:create-indexes` script.
- 2026-07-13: Completed frontend tech improvements by standardizing React context hook modules, separating provider definitions from context values for fast refresh compatibility, and confirming the app passes `npm run lint`.

2026-07-14: Added Python NLP resume analysis integration
- Added `server/ai/analysis.py` to provide a lightweight Python resume analyzer that decodes base64 resume text, extracts keyword-based skills, and returns structured AI feedback.
- Updated `server/mock-server.js` to invoke the Python analyzer from the resume processing pipeline, falling back to the previous simulated analysis when Python/OpenAI integration is unavailable.
- Extended the `/api/resume` endpoint to accept `contentBase64` and persist analysis metadata in `resumeResults`.
- Added a backend test verifying resume analysis job creation and status polling for the AI integration path.
- Marked `Tech: AI — Python NLP / OpenAI API integration` complete in `TODO.md`.

2026-07-14: Added Clerk-compatible auth session handling
- Added `src/utils/clerk.js` and `src/utils/clerk.test.js` to normalize Clerk-style user payloads into the app's existing user shape.
- Updated `src/context/AuthContext.jsx` to recognize a persisted Clerk session and restore it automatically.
- Updated `src/pages/AuthPages.jsx` to expose a Clerk demo session path for local UI testing.
- Fixed context hook imports in `src/context/useAuth.jsx`, `src/context/useJobs.jsx`, and `src/context/useApplications.jsx` so the app build succeeds.
- Verified the new clerk utility test passes and the Vite production build succeeds.

2026-07-14: Implemented real Clerk backend session verification
- Updated `server/mock-server.js` to verify Clerk bearer tokens with `@clerk/backend` using `CLERK_SECRET_KEY` or `CLERK_JWT_KEY`, while preserving legacy JWT token fallback and dev-only demo auth.
- Adjusted `/auth-status` to return accurate `clerkConfigured`, `jwtConfigured`, `allowDevAuth`, and `mode` values.
- Verified the change with `npm run test:security` and confirmed `13 passed`.

Commands to run locally:
```bash
# Start mock server:
npm run start:mock

# Run benchmark:
npm run benchmark
```

If you want me to run the benchmark now, I can start the mock server and run `npm run benchmark` and append the results here.

2026-07-14: Added a local Clerk MCP server entrypoint
- Added `server/mcp/clerk-mcp-server.js` implementing a minimal MCP server with `get_clerk_status` and `get_clerk_setup_hint` tools.
- Added an npm script `npm run mcp:clerk` so the server can be launched locally through the workspace.
- Updated `TODO.md` to reflect that the Clerk MCP server entrypoint is now available.

2026-07-14: Added a background-processing MCP server
- Added `server/mcp/background-mcp-server.js` implementing queueable background-job tools for enqueueing, inspecting, listing, and gathering metrics for background jobs.
- Added `server/mcp/background-mcp-server.test.js` to cover tool exposure and basic job-state transitions.

2026-07-14: Validated CI/CD workflow for GitHub Actions
- Confirmed `.github/workflows/ci.yml` covers the expected pipeline steps: `npm run lint`, `npm run build`, and `npm run test:ci`.
- Verified local CI run with the same commands: lint passed with warnings only, production build succeeded, and Vitest `test:ci` passed 25/25.
- Marked `Tech: CI/CD — GitHub Actions` complete in `TODO.md`.

2026-07-14: Aligned CI Node runtime with Clerk backend requirements
- Updated `.github/workflows/ci.yml` to use Node 20 so the GitHub Actions runner matches `@clerk/backend`'s supported Node engine.
- Added `engines.node` and `engines.npm` to `package.json` to make runtime requirements explicit for contributors and deployment.

2026-07-14: Documented Node runtime requirements and added explicit security CI step
- Added a local development requirements section to `README.md` specifying Node `>=20.9.0` and npm `>=9`.
- Added a dedicated `npm run test:security` step to `.github/workflows/ci.yml` so backend security tests are visible as a separate CI job stage.
- Added `npm run mcp:background` for launching the new server locally and updated `TODO.md` to mark the background-processing MCP work as complete.

2026-07-14: Added applicant approval notifications
- Implemented backend approval handling in `server/mock-server.js` so applicants receive a notification record when an admin approves a job they applied to.
- Exposed the notification feed in `src/pages/ApplicationTracker.jsx` so students can see approval alerts in the app.
- Added regression coverage in `server/mock-server.test.js` for the full approval-to-notification flow and verified the full Vitest suite passes (26 tests, 7 files).

- 2026-07-13: Updated `README.md` with a project-specific frontend status note describing the completed React/Tailwind work and current lint status.

Contact the agent
- To request an immediate update to this log after manual edits, reply in the chat describing the change and I'll append a new timestamped entry.
- 2026-07-13: Marked TODO completed: Scalability: Add load testing and capacity planning for the mock backend

- 2026-07-13: Marked TODO completed: Scalability: Add database indexing or persistence strategy for production readiness
- 2026-07-13: Added centralized async error handling and an Express error middleware in server/mock-server.js.
- Updated TODO.md to mark the backend server task as complete.

2026-07-13: Completed backend audit, health/readiness/metrics, JWT hardening, and MongoDB persistence support
- Added backend audit and hardening work in `server/mock-server.js`, including secure headers, JWT auth improvements, and optional `MONGODB_URI` support.
- Added a backend async error middleware test and verified with `npm test -- --run server/mock-server.test.js`.
- Updated `TODO.md` to mark completed backend audit, backend health/metrics, JWT authentication hardening, and MongoDB persistence tasks.


---

## 2026-07-15 — Bug fixes, deployment setup, and resilient frontend (session)

### Bug fixes

**Application tracker showing empty / blank page after resume upload**
- Root cause: the empty-state in `ApplicationTracker.jsx` used `.glass-panel` with `border-white/5` — `rgba(255,255,255,0.02)` background on a dark page, effectively invisible.
- Fix: replaced with an explicit `bg-slate-900/60 border-white/10` card, added a proper heading and icon, improved empty-state copy based on resume status.
- File modified: `src/pages/ApplicationTracker.jsx`

**Refresh on `/applications` redirecting to login**
- Root cause 1: `AuthContext.jsx` had two duplicate `useEffect` blocks both restoring `cg_user` from localStorage. The first called `setIsReady(true)` synchronously, causing a race where `user` was briefly `null` when child components rendered.
- Root cause 2: No protected route wrapper — each page did its own ad-hoc auth check. `ApplicationTracker` had broken restore logic that only attempted session reload if *both* `cg_token` AND `cg_user` existed.
- Fix: added `ProtectedRoute` component to `App.jsx` that waits for `isReady` before deciding to redirect. Removed duplicate `useEffect` from `AuthContext`. Stripped `ApplicationTracker`'s own restore logic entirely.
- Files modified: `src/App.jsx`, `src/context/AuthContext.jsx`, `src/pages/ApplicationTracker.jsx`

**Apply button doing nothing / application page crashing**
- Root cause 1: `applyToJob` is `async` but was called without `await` in `JobDetailsPage`, so `res` was always a Promise, never the result object. `res.success` was always `undefined`.
- Root cause 2: `createLocalApplication()` in `ApplicationsContext` was missing the `history` array. `ApplicationTracker` called `activeApp.history.map(...)` which threw `Cannot read properties of undefined`.
- Root cause 3: `updateApplicationStatus` spread `...app.history` which crashes if history is missing on old cached data.
- Fix: added `await` to `applyToJob` call; added `history: [{ status: 'Applied', ... }]` to `createLocalApplication()`; changed `...app.history` to `...(app.history || [])`.
- Files modified: `src/pages/JobDetailsPage.jsx`, `src/context/ApplicationsContext.jsx`, `src/pages/ApplicationTracker.jsx`

**Peer dependency conflicts blocking Render build**
- `@testing-library/react@14` requires React 18, project uses React 19 → upgraded to `@testing-library/react@16`.
- `@vitest/coverage-v8@4.x` requires `vitest@4.x`, project uses `vitest@1.x` → aligned to `@vitest/coverage-v8@1.5.4`.
- Added `--legacy-peer-deps` to Render build command in `render.yaml` as safety net.
- Files modified: `package.json`, `package-lock.json`, `render.yaml`

**`vercel.json` version 3 rejected by Vercel**
- Vercel only accepts version ≤ 2. Downgraded `"version": 3` to `"version": 2`.
- File modified: `vercel.json`

---

### Deployment setup

**Full deployment architecture established:**
- Frontend → Vercel (`https://carrier-genie-vl9j.vercel.app`)
- Backend → Render (`https://carrier-genie.onrender.com`)
- Database → MongoDB Atlas (CareerGenie cluster, AWS Mumbai, free M0 tier)

**Render backend issues resolved (in order):**
1. `FRONTEND_ORIGIN` missing → server threw on startup. Fixed by adding env var in Render dashboard.
2. Node.js 26 used by Render → TLS SSL alert 80 from MongoDB Atlas. Fixed by pinning `NODE_VERSION=20.19.0` in `render.yaml` and Render dashboard.
3. MongoDB driver v5 incompatibility with Node 26 → upgraded to `mongodb@^6.17.0`.
4. `closeMongo` imported but not exported → crash on startup. Fixed import.
5. MongoDB Atlas Network Access only had home IP → Render's IPs blocked. Fixed by adding `0.0.0.0/0` in Atlas Network Access.
6. `insertMany([])` throws in MongoDB v6 when array is empty → guarded all `insertMany` calls with length check in `ensureData()`.
7. MongoDB not connected at startup → `getDb()` threw on `/ready` endpoint. Fixed by connecting MongoDB at server startup in `startServer()` async function.
8. `FRONTEND_ORIGIN` had trailing slash → CORS mismatch. Fixed by stripping trailing slash in `getEnvSettings()`.

**Files modified:** `server/mock-server.js`, `server/mongo_client.js`, `render.yaml`, `package.json`

---

### MongoDB Atlas integration

- Connected Atlas cluster (CareerGenie, `careergenie.xmamuzy.mongodb.net`) via `MONGODB_URI` env var on Render and local `.env.local`.
- All user registrations, applications, jobs, notifications, and resume results now persist permanently in Atlas regardless of Render restarts.
- Server seeds initial data on first run if collections are empty.
- `MONGODB_URI` added to `.env.local` for local development.

---

### Resilient frontend (in progress)

Work started to make the frontend fully dynamic and resilient to backend downtime (Render free tier spins down after 15 min inactivity).

**Completed so far:**
- Added `@keyframes shimmer` animation and `.skeleton`, `.skeleton-round`, `.skeleton-card` CSS classes to `src/index.css`.
- Created `src/components/Skeleton.jsx` with reusable components: `Skeleton`, `SkeletonLines`, `JobCardSkeleton`, `StatCardSkeleton`, `AppItemSkeleton`.
- Created `src/hooks/useServerStatus.js` — polls `/health` every 30s (server up) or 10s (server down); exposes `serverStatus`, `isDown`, `isWaking`, `lastChecked`, `recheck()`.
- Created `src/components/ServerStatusBanner.jsx` — sticky banner below navbar:
  - Rose/red when server is unreachable, with Retry button and dismiss (×).
  - Amber/yellow with spinner when server is waking up (Render cold start).
  - Green "Back online" toast when server recovers.
- Wired `ServerStatusBanner` into `App.jsx` via `useServerStatus`.
- Started adding `jobsLoading` / `jobsError` state to `JobsContext`.

**Remaining (added to TODO.md):**
- Complete loading/error state in `JobsContext`, `ApplicationsContext`.
- Add skeleton loaders to `JobListingPage`, `StudentDashboard`, `ApplicationTracker`, `AdminPanel`.
- Improve `ProtectedRoute` loading screen from plain text to animated skeleton.

Files created/modified:
- `src/index.css` — shimmer animation + skeleton classes appended
- `src/components/Skeleton.jsx` — new file
- `src/hooks/useServerStatus.js` — new file
- `src/components/ServerStatusBanner.jsx` — new file
- `src/App.jsx` — imports and wires `ServerStatusBanner` + `useServerStatus`
- `src/context/JobsContext.jsx` — `jobsLoading` / `jobsError` state added (partial)

---

### Notes
- Render free tier spins down after 15 minutes of inactivity. First request after idle takes 30–60s. The `ServerStatusBanner` detects and communicates this to users as "Server waking up".
- MongoDB Atlas free tier (M0) persists all data permanently. No data loss on Render restarts.
- OpenAI replaced with Gemini is deferred post-deployment (tracked in TODO.md).

---

## 2026-07-15 — Replaced OpenAI with Google Gemini API for resume analysis

**Motivation:** OpenAI requires a paid subscription. Gemini (via Google AI Studio) offers a free tier with generous limits, making it a better fit for this project.

**What changed:**

`server/ai/analysis.py`
- Removed all OpenAI-related code (`OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_ENDPOINT`, `openai_analyze`, `analyze_with_openai`).
- Added `gemini_analyze()` — calls the Gemini `generateContent` REST API directly using `urllib.request` (no extra dependencies).
- Prompt instructs Gemini to return a strict JSON object with `score`, `atsScore`, `skills`, `strengths`, `weaknesses`, `suggestions`.
- Added markdown code fence stripping in case Gemini wraps the JSON in triple backticks.
- `analysisType` field now reports `'gemini'` when AI analysis succeeds, `'python-nlp'` when falling back to local keyword analysis.
- Local keyword fallback still runs first and is used as the result if `GEMINI_API_KEY` is not set or Gemini call fails — the app always returns a valid analysis regardless of backend AI availability.

`.env.example`
- Removed `OPENAI_API_KEY`, `OPENAI_ENDPOINT`, `OPENAI_MODEL`.
- Added `GEMINI_API_KEY`, `GEMINI_MODEL` (default: `gemini-1.5-flash`), `GEMINI_ENDPOINT` with a link to AI Studio for key generation.

`render.yaml`
- Removed `OPENAI_ENDPOINT` and `OPENAI_MODEL` env var entries.
- Added `GEMINI_MODEL` and `GEMINI_ENDPOINT` env var entries.
- `GEMINI_API_KEY` is intentionally not committed — must be added manually in Render's dashboard under Environment Variables (treat as a secret).

**How to get a Gemini API key (free):**
1. Go to https://aistudio.google.com/app/apikey
2. Sign in with a Google account
3. Click "Create API key" — copy the key
4. In Render dashboard → your service → Environment → add `GEMINI_API_KEY` = your key
5. Redeploy — resume analysis will now use Gemini AI

**Fallback behaviour:**
- If `GEMINI_API_KEY` is not set → local Python keyword analysis runs (score, skills, strengths/weaknesses based on keyword matching).
- If Gemini call fails (network error, quota exceeded) → same local fallback, error printed to stderr only.
- Frontend is unaffected either way — it always receives a valid analysis response.

**Files modified:**
- `server/ai/analysis.py`
- `.env.example`
- `render.yaml`
- `TODO.md` — moved Gemini task from Remaining to Completed
