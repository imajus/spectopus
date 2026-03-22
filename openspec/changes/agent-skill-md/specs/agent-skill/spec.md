## ADDED Requirements

### Requirement: Valid SKILL.md frontmatter
The SKILL.md file SHALL have YAML frontmatter with `name` set to `spectopus`, a `description` under 1024 characters covering generate/explore/install capabilities, and a `metadata` block with `author`, `version`, and `chain` fields.

#### Scenario: Frontmatter validates against Agent Skills spec
- **WHEN** the SKILL.md frontmatter is parsed
- **THEN** `name` equals `spectopus`, `description` is non-empty and under 1024 characters, and `metadata` contains `author`, `version`, and `chain` keys

### Requirement: Name matches parent directory
The `name` field in frontmatter SHALL match the parent directory name (`spectopus`), as required by the Agent Skills specification.

#### Scenario: Directory and name alignment
- **WHEN** the skill is placed at `skills/spectopus/SKILL.md`
- **THEN** the frontmatter `name` field equals `spectopus`

### Requirement: Generate capability documented
The SKILL.md body SHALL include a Generate section documenting the `POST /skills/generate` endpoint with request body format (`contractAddress`, `chainId`, optional `message`), response format (`id`, `url`), and a code example using `fetch`.

#### Scenario: Agent reads generate instructions
- **WHEN** an agent reads the Generate section
- **THEN** it finds the endpoint URL pattern, required request fields, response schema, and a working `fetch` code example

### Requirement: Explore capability documented
The SKILL.md body SHALL include an Explore section documenting how to discover available skills on x402 Bazaar using the `@x402/extensions/bazaar` client.

#### Scenario: Agent reads explore instructions
- **WHEN** an agent reads the Explore section
- **THEN** it finds instructions to use `withBazaar()` and `listResources()` to discover generated skills, with a code example

### Requirement: Install capability documented
The SKILL.md body SHALL include an Install section documenting the `GET /skills/:id` endpoint for downloading a generated SKILL.md, including how to poll for completion status and save the result locally.

#### Scenario: Agent reads install instructions
- **WHEN** an agent reads the Install section
- **THEN** it finds the endpoint URL pattern, response content type (`text/markdown`), status polling guidance, and a code example for downloading and saving

### Requirement: x402 payment notice
The SKILL.md SHALL mention that endpoints may return HTTP 402 and require x402 payment, without detailing the payment flow.

#### Scenario: Payment notice present
- **WHEN** an agent reads the skill
- **THEN** it finds a note about x402 payment requirements for the API endpoints

### Requirement: Body under 500 lines
The SKILL.md body SHALL be under 500 lines as recommended by the Agent Skills specification for efficient context usage.

#### Scenario: Line count check
- **WHEN** the SKILL.md file is measured
- **THEN** the total line count is under 500
