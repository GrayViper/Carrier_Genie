# CareerGenie Project TODO

## Remaining
- [ ] Replace OpenAI with Google Gemini API for resume analysis (free tier, post-deployment)
- [ ] Add skeleton loaders and loading states to JobsContext, ApplicationsContext (task 4 of resilient frontend)
- [ ] Add skeleton loaders to JobListingPage, StudentDashboard, ApplicationTracker, AdminPanel (task 5-8 of resilient frontend)
- [ ] Improve ProtectedRoute loading screen from plain text to skeleton (task 9 of resilient frontend)
- [ ] Authentication implementation and JWT login/signup flow
- [ ] Resume upload and AI analysis workflow
- [ ] Job matching algorithm and job recommendations
- [ ] Job posting creation, editing, and listing
- [ ] Dashboards for student, recruiter, and admin
- [ ] Application tracking workflow and status updates
- [ ] Notifications system for students and recruiters
- [ ] Admin panel access control and metrics view

## Completed (all)
- [x] Investigate/implement MCP server for background processing
- [x] Add Clerk MCP server entrypoint for local tooling
- [x] Tech: Frontend — React.js + Tailwind CSS
- [x] Tech: Backend — Node.js + Express.js
- [x] Tech: Database — MongoDB
- [x] Tech: Database — MongoDB (indexes added)
- [x] Tech: Authentication — JWT + Bcrypt
- [x] Tech: AI — Python NLP / OpenAI API integration
- [x] Tech: Deployment — Vercel + Render
- [x] Tech: CI/CD — GitHub Actions
- [x] Integrate real Clerk API credentials and server-side session verification
- [x] Run lint
- [x] Build project
- [x] Run CI tests successfully
- [x] Report results
- [x] Install compatible coverage reporter
- [x] Create and maintain workflow documentation filead
- [x] Add resume analysis benchmark suite
- [x] Implement async resume processing and background caching
- [x] Remove Redis dependency and keep in-process resume workflow
- [x] Harden authentication middleware and JWT settings
- [x] Add `SECURITY.md` security checklist
- [x] Increase bcrypt cost factor for password hashing
- [x] Add secure response headers in mock server
- [x] Security: Enforce HTTPS or add HTTPS redirect middleware (best in production proxy)
- [x] Security: Verify JWT handling and implement secret rotation policy
- [x] Security: Ensure password hashing (bcrypt) is enforced and add security tests
- [x] Security: Harden CORS/origin restrictions, secure headers, and auth middleware
- [x] Availability: Add health checks and runtime monitoring endpoints
- [x] Availability: Implement backup/recovery guidance for mock data persistence
- [x] Scalability: Add load testing and capacity planning for the mock backend
- [x] Scalability: Add database indexing or persistence strategy for production readiness
- [x] Add persistence migration guidance (MongoDB)
- [x] Audit backend server
- [x] Implement backend health and metrics
- [x] Harden JWT authentication
- [x] Add persistence/MongoDB support
- [x] Add Clerk-compatible auth session handling and demo fallback in the frontend
- [x] Add applicant approval notifications for job applicants and surface them in the application tracker UI

## Notes

- In production, `NODE_ENV=production` and `JWT_SECRET` must be defined.
- Dev-only fallback auth is gated by `ALLOW_DEV_AUTH=1`.
- `server/mock-server.js` now sets hardening headers and requires a strong secret when deployed.

## Update process

- Whenever any task is completed, move it from the `Remaining` section to the `Completed` section.
- When a project change is made, add a corresponding entry to `docs/WORKFLOW_LOG.md` with the date and a short description.
- Keep this file and `docs/WORKFLOW_LOG.md` in sync: every completed task must be reflected in both places.
- If a new task is added, append it to the `Remaining` section and mention it in the workflow log.
