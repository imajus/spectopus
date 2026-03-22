## Why

The "Let the Agent Cook" and "Agents With Receipts" hackathon tracks require `agent_log.json` — structured execution logs showing pipeline decisions, tool calls, retries, failures, and outputs. The pipeline currently has no logging beyond `console.error`. Without this, we cannot submit to two of our four target tracks.

## What Changes

- Add a per-run logger that accumulates pipeline events (stage transitions, decisions, errors) in memory
- Store execution logs as `logs/{skillId}.json` in S3 alongside skill objects
- Generate presigned S3 URLs for log files and include them in the `GET /skills/:id` JSON response
- New dependency: `@aws-sdk/s3-request-presigner` for presigned URL generation

## Capabilities

### New Capabilities

- `pipeline-logging`: Per-run structured execution logger that records stage transitions, decisions, tool calls, retries, and errors during skill generation
- `log-storage`: S3 storage and presigned URL retrieval for execution log files

### Modified Capabilities

## Impact

- `src/pipeline/index.js` — integrate logger into pipeline orchestration
- `src/pipeline/logger.js` — new file (logger implementation)
- `src/storage.js` — add `putLog` and `getLogUrl` functions
- `src/routes/skills.js` — include `logUrl` in skill response
- `src/pipeline/pipeline.test.js` — update existing logger mock
- `package.json` — add `@aws-sdk/s3-request-presigner`
