## ADDED Requirements

### Requirement: Store skill content
The system SHALL provide a `putSkill(id, content)` function that stores SKILL.md content in S3 at key `skills/{id}.md` with content type `text/markdown`.

#### Scenario: Store and retrieve
- **WHEN** `putSkill("abc123", "# My Skill")` is called
- **THEN** the content is stored at S3 key `skills/abc123.md` and can be retrieved

### Requirement: Retrieve skill content
The system SHALL provide a `getSkill(id)` function that retrieves SKILL.md content from S3 by skill ID.

#### Scenario: Existing skill
- **WHEN** `getSkill("abc123")` is called for a stored skill
- **THEN** it returns the SKILL.md content as a string

#### Scenario: Non-existent skill
- **WHEN** `getSkill("missing")` is called for a skill that does not exist
- **THEN** it returns `null`

### Requirement: Create status placeholder
The system SHALL provide a `createPlaceholder(id, metadata)` function that stores a SKILL.md with `metadata.status: "generating"` and the provided metadata (contractAddress, chainId).

#### Scenario: Placeholder created
- **WHEN** `createPlaceholder("abc123", { contractAddress: "0x...", chainId: 8453 })` is called
- **THEN** S3 contains a SKILL.md at `skills/abc123.md` with frontmatter containing `status: "generating"`, `stage: "research"`, and the provided metadata

### Requirement: Update pipeline stage
The system SHALL provide an `updateStage(id, stage)` function that updates the `metadata.stage` field in the stored SKILL.md frontmatter.

#### Scenario: Stage updated
- **WHEN** `updateStage("abc123", "generate")` is called on a placeholder
- **THEN** the stored SKILL.md frontmatter shows `stage: "generate"`

### Requirement: Mark skill as failed
The system SHALL provide a `markFailed(id, error)` function that sets `metadata.status: "failed"` and includes error details in the SKILL.md body.

#### Scenario: Skill marked failed
- **WHEN** `markFailed("abc123", "Validation failed after 2 retries")` is called
- **THEN** the stored SKILL.md has `status: "failed"` in frontmatter and error details in body

### Requirement: S3 configuration
The storage module SHALL configure the S3 client using `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, and `S3_REGION` (default: `auto`) environment variables.

#### Scenario: Configuration from env
- **WHEN** the storage module initializes
- **THEN** it creates an S3 client using the endpoint, credentials, and region from environment variables
