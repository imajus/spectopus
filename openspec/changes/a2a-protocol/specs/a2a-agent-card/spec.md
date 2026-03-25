## ADDED Requirements

### Requirement: A2A Agent Card at well-known path
The system SHALL serve an A2A Agent Card JSON at `GET /.well-known/agent-card.json` conforming to A2A protocol v0.3.0.

#### Scenario: Agent Card returned
- **WHEN** a client sends GET `/.well-known/agent-card.json`
- **THEN** the system SHALL respond with 200 and `Content-Type: application/json`
- **THEN** the response SHALL include `name: "Spectopus"`, `protocolVersion: "0.3.0"`, and `url` pointing to the `/a2a` endpoint

### Requirement: x402 extension declared in capabilities
The Agent Card SHALL declare the a2a-x402 extension in `capabilities.extensions` with URI `https://github.com/google-agentic-commerce/a2a-x402/blob/main/spec/v0.2` and `required: true`.

#### Scenario: x402 extension present
- **WHEN** the Agent Card is examined
- **THEN** `capabilities.extensions` SHALL contain an entry with the a2a-x402 v0.2 URI and `required: true`

### Requirement: Skill definition in Agent Card
The Agent Card SHALL include one skill with `id: "generate_skill"` describing the contract skill generation capability.

#### Scenario: Skill listed
- **WHEN** the Agent Card is examined
- **THEN** `skills` SHALL contain an entry with `id: "generate_skill"` and a description mentioning smart contract and Base Mainnet

### Requirement: Agent Card not paywalled
The `GET /.well-known/agent-card.json` endpoint SHALL NOT require x402 payment.

#### Scenario: Agent Card accessible without payment
- **WHEN** a client sends GET `/.well-known/agent-card.json` without X-PAYMENT header
- **THEN** the system SHALL respond with 200 (not 402)
