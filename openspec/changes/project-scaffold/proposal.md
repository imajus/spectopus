## Why

No project structure exists yet. Every subsequent change (research tools, pipeline, API, payments) needs a running Express server, environment configuration, and test infrastructure. This is the foundation.

## What Changes

- Initialize Node.js project with ES modules (`"type": "module"` in package.json)
- Create Express server with health check endpoint (`GET /health`)
- Set up environment variable loading via dotenv (`.env` + `.env.example`)
- Establish `src/` directory structure with entry point at `src/index.js`
- Configure Vitest as test runner
- Add Docker support (`Dockerfile` + `.dockerignore`)
- Add `.gitignore` for Node.js projects
- Add npm scripts: `start`, `dev`, `test`

## Capabilities

### New Capabilities
- `express-server`: HTTP server setup with Express, health endpoint, env config, and graceful startup
- `docker-support`: Dockerfile and .dockerignore for containerized deployment

### Modified Capabilities

(none)

## Impact

- New files: `package.json`, `src/index.js`, `.env.example`, `.gitignore`, `.dockerignore`, `Dockerfile`, `vitest.config.js`
- Dependencies: `express`, `dotenv`, `vitest` (dev)
- All future changes depend on this scaffold
