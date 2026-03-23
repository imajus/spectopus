## ADDED Requirements

### Requirement: Agent Card discovery endpoint
The system SHALL serve an A2A Agent Card at `GET /.well-known/agent-card.json` conforming to A2A protocol v0.3.0.

#### Scenario: Successful agent card retrieval
- **WHEN** a client sends `GET /.well-known/agent-card.json`
- **THEN** the system returns HTTP 200 with `Content-Type: application/json` containing a valid A2A Agent Card

### Requirement: Agent Card contains required fields
The Agent Card SHALL include: `name`, `description`, `url`, `provider`, `version`, `protocolVersion` (set to "0.3.0"), `capabilities`, `defaultInputModes`, `defaultOutputModes`, and `skills`.

#### Scenario: Agent card has correct identity
- **WHEN** the agent card is retrieved
- **THEN** `name` is "Spectopus", `version` is the package version, and `protocolVersion` is "0.3.0"

#### Scenario: Agent card declares capabilities
- **WHEN** the agent card is retrieved
- **THEN** `capabilities.streaming` is false, `capabilities.pushNotifications` is false, and `capabilities.stateTransitionHistory` is true

### Requirement: Agent Card declares generate_skill skill
The Agent Card SHALL declare a single skill with id `generate_skill` that describes smart contract skill generation.

#### Scenario: Skill definition is complete
- **WHEN** the agent card is retrieved
- **THEN** the `skills` array contains one entry with `id: "generate_skill"`, a `name`, `description`, `tags` including "smart-contract", and `examples` showing contract address usage
