## 1. Project Init

- [ ] 1.1 Create `package.json` with `"type": "module"`, name `spectopus`, scripts (`start`, `dev`, `test`)
- [ ] 1.2 Install dependencies: `express`, `dotenv`; dev: `vitest`
- [ ] 1.3 Create `.gitignore` (node_modules, .env, dist, coverage)
- [ ] 1.4 Create `.env.example` with `PORT=3000` and placeholders for future vars

## 2. Express Server

- [ ] 2.1 Create `src/app.js` — export `createApp()` returning configured Express app with JSON parsing and `GET /health`
- [ ] 2.2 Create `src/index.js` — load dotenv, call `createApp()`, listen on `PORT` (default 3000)

## 3. Tests

- [ ] 3.1 Create `vitest.config.js`
- [ ] 3.2 Create `src/app.test.js` — test health endpoint returns 200 with `{ status: "ok" }`

## 4. Docker

- [ ] 4.1 Create `Dockerfile` (node:22-alpine, npm ci --production, expose 3000, CMD node src/index.js)
- [ ] 4.2 Create `.dockerignore` (node_modules, .env, .git, *.test.js, coverage)
