## Context

The pipeline (`src/pipeline/index.js`) runs 3 stages (research → generate → validate) asynchronously, storing progress in S3. Skills are JSON objects at `skills/{id}.json`. The test file already mocks a `./logger.js` module with methods: `createLogger`, `startStage`, `logToolCall`, `logDecision`, `endStage`, `flush`. No logging library is currently installed.

## Goals / Non-Goals

**Goals:**
- Record pipeline execution events to satisfy hackathon structured logging requirement
- Store logs in S3 and expose via presigned URLs in skill responses
- Match the logger interface already expected by tests

**Non-Goals:**
- LangChain callback handler integration (too complex for PoC — manual logging is sufficient)
- Real-time log streaming
- Log aggregation or analytics
- Log retention policies

## Decisions

### 1. Manual logging over LangChain callbacks
Log key events manually in `runPipeline` rather than attaching `BaseCallbackHandler` to LangChain. The hackathon judges need to see stage transitions, decisions, and retries — not per-token LLM traces. Manual logging is simpler, requires no changes to stage function signatures, and produces a cleaner log.

**Alternative considered:** LangChain `BaseCallbackHandler` with `handleChatModelStart`, `handleToolEnd`, etc. Rejected because it adds complexity (threading callbacks through all stage functions) for minimal extra value in this context.

### 2. In-memory accumulation with single S3 write
The logger accumulates events in a plain JS object during the pipeline run, then writes once to S3 via `flush()`. This avoids multiple S3 writes per run and keeps the implementation trivial.

### 3. Presigned URLs via `@aws-sdk/s3-request-presigner`
Use AWS SDK's `getSignedUrl` to generate temporary (24h) URLs for log objects. Include the URL in the `GET /skills/:id` JSON response as `logUrl`. This avoids a new Express endpoint and works with Cloudflare R2's S3-compatible API.

### 4. Log stored at `logs/{skillId}.json`
Separate S3 prefix from skills. Same bucket, predictable key pattern.

## Risks / Trade-offs

- **R2 presigned URL compatibility** → R2 supports S3 presigned URLs with `forcePathStyle: true` (already configured). If it fails, fallback to serving log through Express.
- **Logger flush failure loses log** → Acceptable for PoC. The pipeline result (skill) is already stored. Log is best-effort.
- **No token usage tracking** → Without LangChain callbacks, we don't capture token counts. Acceptable — the log shows decisions and flow, which is what judges evaluate.
