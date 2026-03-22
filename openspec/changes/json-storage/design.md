## Context

Skills are currently stored as Markdown files with YAML frontmatter in S3. Status and stage updates require reading the file, running regex replacements on frontmatter fields, and writing back. The `GET /skills/:id` endpoint returns `text/markdown`, which is incompatible with x402 `fetchWithPayment` clients that expect JSON.

## Goals / Non-Goals

**Goals:**
- JSON storage format for skill state in S3
- JSON API response from `GET /skills/:id`
- Simplify storage operations (property writes vs regex replacements)
- Consolidate `markReady` into storage layer alongside `markFailed`

**Non-Goals:**
- Changing the pipeline stages or their interfaces
- Migrating existing S3 objects (old format can be ignored)
- Changing the `POST /skills/generate` request/response format

## Decisions

### Store as JSON in S3
Skills stored as `skills/{id}.json` with `ContentType: application/json`. Structure:
```json
{
  "id": "uuid",
  "status": "generating|ready|failed",
  "stage": "research|generate|validate",
  "contractAddress": "0x...",
  "chainId": 8453,
  "content": ""
}
```
**Rationale**: Eliminates fragile frontmatter regex. Native `JSON.parse`/`JSON.stringify` is reliable. The `content` field holds the generated SKILL.md markdown when ready, error messages when failed, or empty string while generating.

### Move `markReady` to storage module
Currently `markReady` is a local helper in `pipeline/index.js` that manipulates frontmatter strings. Move it to `storage.js` alongside `markFailed` — both are read-modify-write operations on skill state.

### API response maps status values
The `generating` internal status maps to `processing` in the API response for clearer client semantics. Response always includes `status` and `content` fields.

## Risks / Trade-offs

- **[Breaking API change]** → Clients reading `text/markdown` will break. Acceptable since the only client (`fetchWithPayment`) already can't parse the current format.
- **[Old S3 objects unreadable]** → `JSON.parse` will fail on existing Markdown objects. Acceptable for hackathon scope — no production data to preserve.
