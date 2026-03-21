## Why

Generated SKILL.md files need persistent storage accessible by both the async pipeline (writer) and the API endpoint (reader). The pipeline also needs to update status placeholders as it progresses through stages, so callers can poll for progress.

## What Changes

- Add S3-compatible storage client using AWS SDK v3
- Implement skill CRUD operations (put, get)
- Implement status placeholder management — create placeholder on generation start, update stage progress, replace with final content on completion
- Status tracking via SKILL.md frontmatter (`metadata.status`: generating/ready/failed, `metadata.stage`: research/generate/validate)

## Capabilities

### New Capabilities
- `skill-storage`: S3 client for storing and retrieving SKILL.md files with status tracking via frontmatter

### Modified Capabilities

(none)

## Impact

- New file: `src/storage.js`
- New dependencies: `@aws-sdk/client-s3`
- New env vars: `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_REGION`
- Updates `.env.example`
