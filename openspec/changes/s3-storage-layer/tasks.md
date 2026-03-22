## 1. S3 Client Setup

- [x] 1.1 Install `@aws-sdk/client-s3`
- [x] 1.2 Create `src/storage.js` with S3 client initialization from env vars (S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY, S3_REGION)
- [x] 1.3 Add S3 env vars to `.env.example`

## 2. Core Operations

- [x] 2.1 Implement `putSkill(id, content)` — PutObject to `skills/{id}.md` with content type `text/markdown`
- [x] 2.2 Implement `getSkill(id)` — GetObject from `skills/{id}.md`, return string or null if not found

## 3. Status Management

- [x] 3.1 Implement `createPlaceholder(id, metadata)` — generate SKILL.md with frontmatter (status: generating, stage: research, contractAddress, chainId), store via putSkill
- [x] 3.2 Implement `updateStage(id, stage)` — fetch current content, update stage in frontmatter, re-store
- [x] 3.3 Implement `markFailed(id, error)` — set status to failed, include error in body

## 4. Tests

- [x] 4.1 Test placeholder creation produces correct frontmatter
- [x] 4.2 Test updateStage modifies frontmatter stage field
- [x] 4.3 Test markFailed sets status and error content
