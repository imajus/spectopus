## ADDED Requirements

### Requirement: Generated output scanned for injection patterns
The system SHALL scan the final SKILL.md content for known prompt injection patterns before storing it as ready.

#### Scenario: Clean output
- **WHEN** the generated SKILL.md contains no suspicious patterns
- **THEN** the skill is marked as ready and stored normally

#### Scenario: Output contains injection markers
- **WHEN** the generated SKILL.md contains patterns like `IGNORE PREVIOUS INSTRUCTIONS`, `<|im_start|>`, or `SYSTEM:` prompt markers
- **THEN** the skill is marked as failed with an error describing the safety violation

### Requirement: Fail-closed validation fallback
The system SHALL treat unparseable LLM validation responses as validation failures, not successes.

#### Scenario: ABI cross-check returns unparseable response
- **WHEN** the ABI cross-check LLM response cannot be parsed as JSON
- **THEN** the system returns `{ valid: false, errors: ['Validation response could not be parsed'] }` instead of `{ valid: true }`

#### Scenario: Safety check returns unparseable response
- **WHEN** the safety check LLM response cannot be parsed as JSON
- **THEN** the system returns `{ valid: false, errors: ['Validation response could not be parsed'] }` instead of `{ valid: true }`
