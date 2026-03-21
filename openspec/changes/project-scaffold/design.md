## Context

Spectopus has no code yet — only documentation (Requirements.md, Specification.md). This change creates the minimal project skeleton that all subsequent changes (research tools, generation pipeline, API endpoints, payments) will build on.

## Goals / Non-Goals

**Goals:**
- Runnable Express server with a single health endpoint
- Environment variable management via .env
- Test infrastructure ready for subsequent changes
- Docker-ready for deployment

**Non-Goals:**
- No application logic, routes, or middleware beyond health check
- No S3, x402, AI SDK, or Basescan integration (those are separate changes)
- No CI/CD pipeline

## Decisions

**ES modules over CommonJS** — Project convention. `"type": "module"` in package.json, all files use `import`/`export`.

**Express app factory pattern** — `src/app.js` exports a `createApp()` function that returns a configured Express instance. `src/index.js` calls it and starts listening. This lets tests import the app without starting the server.

**dotenv for env vars** — Lightweight, no framework lock-in. Load in `src/index.js` only (not in app.js or tests). `.env.example` documents all variables with placeholder values.

**Vitest** — Project convention. Fast, ESM-native, no additional config needed for ES modules.

**Flat src/ structure** — Start flat (`src/index.js`, `src/app.js`), add subdirectories as complexity grows in later changes. No premature `src/routes/`, `src/services/`, etc.

## Risks / Trade-offs

**Minimal structure may need reorganization later** → Acceptable. Easier to add structure when patterns emerge than to guess upfront.
