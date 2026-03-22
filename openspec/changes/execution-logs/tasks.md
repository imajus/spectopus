## 1. Dependencies

- [ ] 1.1 Install `@aws-sdk/s3-request-presigner`

## 2. Storage Layer

- [ ] 2.1 Add `putLog(skillId, logData)` to `src/storage.js` — writes JSON to `logs/{skillId}.json`
- [ ] 2.2 Add `getLogUrl(skillId)` to `src/storage.js` — returns presigned URL (24h expiry)

## 3. Logger

- [ ] 3.1 Create `src/pipeline/logger.js` with `createLogger(skillId, contractAddress)` returning `{ startStage, logToolCall, logDecision, endStage, flush }`

## 4. Pipeline Integration

- [ ] 4.1 Integrate logger into `src/pipeline/index.js` — create logger, wrap stages, log decisions, flush in finally block

## 5. API Response

- [ ] 5.1 Update `GET /skills/:id` in `src/routes/skills.js` to include `logUrl` when status is `ready` or `failed`

## 6. Tests

- [ ] 6.1 Update logger mock in `src/pipeline/pipeline.test.js` to match implementation
- [ ] 6.2 Run tests and verify all pass
