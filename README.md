# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Deployment

This repository is configured for a split deployment:

- Frontend: Vercel static SPA.
- Backend: Render Node.js web service.
- Database: MongoDB Atlas (optional when `MONGODB_URI` is set).
- AI integration: Python resume analysis script called from the backend.

### Vercel frontend

The frontend builds with `npm run build` and publishes `dist/` as a static site. Vercel should be configured to set `VITE_API_BASE` to the Render backend URL in production, and `VITE_ALLOW_DEMO` should be disabled in production.

### Local development requirements

- Node.js `>= 20.9.0`
- npm `>= 9`
- `VITE_CLERK_PUBLISHABLE_KEY` if using Clerk auth locally

These are required because `@clerk/backend` depends on Node 20+ and the CI workflow is aligned to the same runtime.

### Render backend

The backend now supports production deployment on Render by binding to `process.env.PORT` and using `npm run start` as the web service command.

Required Render environment variables for production:

- `NODE_ENV=production`
- `JWT_SECRET` (strong secret)
- `FRONTEND_ORIGIN` (the deployed Vercel origin)
- `MONGODB_URI` (MongoDB Atlas connection string, optional)
- `CLERK_SECRET_KEY` or `CLERK_JWT_KEY` (required for Clerk session verification when using Clerk auth)
- `OPENAI_API_KEY` / `OPENAI_ENDPOINT` / `OPENAI_MODEL` (optional for AI resume analysis)

If `MONGODB_URI` is not provided, the backend falls back to local `server/data.json` persistence.

## Project frontend status

- Frontend tech work completed: React context hooks were standardized, Tailwind styling is in place, and fast refresh compatibility was restored by splitting context values from provider components.
- `npm run lint` passes with no current warnings in the frontend context modules.

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
