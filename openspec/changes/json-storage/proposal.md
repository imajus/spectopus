## Why

The `GET /skills/:id` endpoint returns `text/markdown`, which breaks x402 `fetchWithPayment` clients that expect JSON responses. Additionally, the current Markdown-with-frontmatter storage requires fragile string manipulation (regex replacements) to update status and stage fields.

## What Changes

- **BREAKING**: `GET /skills/:id` returns `application/json` instead of `text/markdown`
- S3 storage format changes from Markdown files (`skills/{id}.md`) to JSON files (`skills/{id}.json`)
- Storage functions simplified: field updates become JSON property writes instead of frontmatter regex replacements
- Pipeline's `markReady` helper moves from `pipeline/index.js` to `storage.js` for consistency with `markFailed`

## Capabilities

### New Capabilities
- `json-skill-storage`: JSON-based skill storage and retrieval with structured status/content fields

### Modified Capabilities

## Impact

- `src/storage.js` — rewrite all functions for JSON format
- `src/routes/skills.js` — change response from `text/markdown` to `application/json`
- `src/pipeline/index.js` — use `markReady` from storage, remove local helper
- `src/storage.test.js` — update assertions for JSON objects
- `src/routes/skills.test.js` — update response format assertions
- `src/pipeline/pipeline.test.js` — update `putSkill`/`markReady` assertions
