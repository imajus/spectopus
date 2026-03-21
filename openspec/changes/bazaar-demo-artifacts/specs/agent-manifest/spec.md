## ADDED Requirements

### Requirement: agent.json manifest
The project SHALL include an `agent.json` file at the repository root containing: agent name, description, operator wallet, ERC-8004 identity (standard, chain, registration tx), tools list, tech stack, and endpoint definitions.

#### Scenario: Manifest present
- **WHEN** a hackathon judge or agent inspects the repository
- **THEN** `agent.json` is present at the root with all required fields populated
