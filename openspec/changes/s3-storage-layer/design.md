## Context

The pipeline writes SKILL.md files; the API reads them. S3-compatible storage (Cloudflare R2, MinIO, AWS S3) serves as the shared persistence layer. Status is tracked within the SKILL.md file itself via YAML frontmatter, not in a separate database.

## Goals / Non-Goals

**Goals:**
- Store and retrieve SKILL.md files by skill ID
- Track generation status within the SKILL.md frontmatter
- Support any S3-compatible provider

**Non-Goals:**
- No listing/searching skills (Bazaar handles discovery)
- No versioning or history
- No caching layer

## Decisions

**Status in frontmatter, not a separate store** — The SKILL.md file IS the status record. A pending skill has `metadata.status: "generating"` in its frontmatter. A completed skill has `metadata.status: "ready"`. This avoids needing a database and keeps the system simple.

**AWS SDK v3** — Standard S3 client. Works with R2, MinIO, and AWS. Use `@aws-sdk/client-s3` only (not the full SDK).

**Skill ID as S3 key** — Key format: `skills/{id}.md`. Simple, flat, no nesting.

**Storage module exports functions, not a class** — `putSkill(id, content)`, `getSkill(id)`, `createPlaceholder(id, metadata)`, `updateStage(id, stage)`. Module-level S3 client initialized once on first use.

## Risks / Trade-offs

**No atomicity for status updates** → Acceptable for PoC. Only one pipeline writes to a given skill ID.

**S3 eventual consistency** → Modern S3 (and R2) offer strong read-after-write consistency. Not an issue.
