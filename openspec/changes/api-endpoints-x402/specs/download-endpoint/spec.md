## ADDED Requirements

### Requirement: Download endpoint returns skill content
`GET /skills/:id` SHALL retrieve the SKILL.md content from S3 and return it as `text/markdown`.

#### Scenario: Completed skill
- **WHEN** a GET request is made for a skill with `status: "ready"`
- **THEN** the server responds with 200 and the final SKILL.md content as text/markdown

#### Scenario: In-progress skill
- **WHEN** a GET request is made for a skill with `status: "generating"`
- **THEN** the server responds with 200 and the placeholder content showing current stage

#### Scenario: Failed skill
- **WHEN** a GET request is made for a skill with `status: "failed"`
- **THEN** the server responds with 200 and the failure content with error details

### Requirement: Download endpoint returns 404 for unknown skills
The endpoint SHALL return 404 when the requested skill ID does not exist in S3.

#### Scenario: Unknown skill
- **WHEN** a GET request is made for a non-existent skill ID
- **THEN** the server responds with 404
