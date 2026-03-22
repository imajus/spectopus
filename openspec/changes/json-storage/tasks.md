## 1. Storage Layer

- [x] 1.1 Rewrite `src/storage.js` — store/retrieve JSON, change S3 key to `skills/{id}.json`, update all functions (`putSkill`, `getSkill`, `createPlaceholder`, `updateStage`, `markFailed`, add `markReady`)
- [x] 1.2 Update `src/storage.test.js` — assert on JSON objects instead of frontmatter strings

## 2. Pipeline

- [x] 2.1 Update `src/pipeline/index.js` — import `markReady` from storage, remove local `markReady` helper, call `markReady(skillId, skillContent)` instead of `putSkill(skillId, markReady(content))`
- [x] 2.2 Update `src/pipeline/pipeline.test.js` — replace `putSkill` assertions with `markReady` assertions

## 3. API Route

- [x] 3.1 Update `GET /skills/:id` in `src/routes/skills.js` — return JSON with `status` and `content` fields, map `generating` → `processing`
- [x] 3.2 Update `src/routes/skills.test.js` — mock `getSkill` to return JSON objects, assert on `res.body` instead of `res.text`

## 4. Verify

- [x] 4.1 Run `npx vitest` — all tests pass
