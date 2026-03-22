## ADDED Requirements

### Requirement: Skills stored as JSON in S3
The system SHALL store skill data as JSON objects in S3 at key `skills/{id}.json` with content type `application/json`. Each object SHALL contain: `id`, `status`, `stage`, `contractAddress`, `chainId`, and `content` fields.

#### Scenario: Create placeholder for new skill
- **WHEN** a skill generation is initiated with contractAddress `0xABC`
- **THEN** S3 object `skills/{id}.json` is created with `{ id, status: "generating", stage: "research", contractAddress: "0xABC", chainId: 8453, content: "" }`

#### Scenario: Update stage during pipeline
- **WHEN** the pipeline transitions to the `generate` stage
- **THEN** the stored JSON object's `stage` field is updated to `"generate"` and all other fields are preserved

#### Scenario: Mark skill as ready
- **WHEN** the pipeline completes successfully with SKILL.md content
- **THEN** the stored JSON object's `status` is set to `"ready"` and `content` is set to the full SKILL.md markdown

#### Scenario: Mark skill as failed
- **WHEN** the pipeline fails with error message "ABI not available"
- **THEN** the stored JSON object's `status` is set to `"failed"` and `content` is set to `"ABI not available"`

### Requirement: GET /skills/:id returns JSON
The `GET /skills/:id` endpoint SHALL return `application/json` responses with `status` and `content` fields.

#### Scenario: Skill is ready
- **WHEN** a client requests a skill with status `"ready"`
- **THEN** the response is `{ "status": "ready", "content": "<full-markdown>" }`

#### Scenario: Skill is generating
- **WHEN** a client requests a skill with status `"generating"` and stage `"validate"`
- **THEN** the response is `{ "status": "processing", "content": "Stage: validate" }`

#### Scenario: Skill generation failed
- **WHEN** a client requests a skill with status `"failed"` and content `"Validation failed"`
- **THEN** the response is `{ "status": "failed", "content": "Validation failed" }`

#### Scenario: Skill not found
- **WHEN** a client requests a non-existent skill ID
- **THEN** the response status is 404 with `{ "error": "Skill not found" }`
