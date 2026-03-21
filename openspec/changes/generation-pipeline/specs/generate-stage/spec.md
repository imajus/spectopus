## ADDED Requirements

### Requirement: Generate SKILL.md from research
The system SHALL produce a complete SKILL.md following the Agent Skills specification, given the research stage output.

#### Scenario: Successful generation
- **WHEN** the generate stage receives a research summary
- **THEN** it returns a SKILL.md string with valid frontmatter (name, description, metadata with contractAddress, chainId, generator: "spectopus"), usage instructions, code examples using viem, and a gotchas section

### Requirement: Include Agent Skills spec context
The generate stage SHALL include the Agent Skills specification in the system prompt so the LLM produces correctly formatted output.

#### Scenario: Spec-compliant output
- **WHEN** a SKILL.md is generated
- **THEN** it contains valid YAML frontmatter with required fields and follows the Agent Skills document structure

### Requirement: Accept retry feedback
The generate stage SHALL accept optional validation errors from a previous attempt and incorporate them to improve output.

#### Scenario: Retry with feedback
- **WHEN** the generate stage receives validation errors from a previous attempt
- **THEN** it includes those errors in the prompt and produces corrected output
