## ADDED Requirements

### Requirement: ERC-8004 registration file endpoint
The system SHALL serve an ERC-8004 registration file at `GET /agent-registration.json` with `type: "https://eips.ethereum.org/EIPS/eip-8004#registration-v1"`.

#### Scenario: Registration file returned
- **WHEN** a client sends GET `/agent-registration.json`
- **THEN** the system SHALL respond with 200 and `Content-Type: application/json`
- **THEN** the response SHALL include `name: "Spectopus"`, `active: true`, `x402Support: true`

#### Scenario: Registration file not paywalled
- **WHEN** a client sends GET `/agent-registration.json` without X-PAYMENT header
- **THEN** the system SHALL respond with 200 (not 402)

### Requirement: Services list with custom types
The registration file SHALL include a `services` array with entries for: `web` (server root), `A2A` (agent card URL, version 0.3.0), `skill` (Spectopus SKILL.md URL), and `api` (OpenAPI spec URL).

#### Scenario: All service types present
- **WHEN** the registration file is examined
- **THEN** `services` SHALL contain entries with names `web`, `A2A`, `skill`, and `api`
- **THEN** the `A2A` entry SHALL include `version: "0.3.0"`
- **THEN** endpoints SHALL use the configured `BASE_URL`

### Requirement: Agent identity in registration file
The registration file SHALL include `registrations` array with agent ID `35174` and registry `eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`, and `supportedTrust: ["reputation"]`.

#### Scenario: Identity present
- **WHEN** the registration file is examined
- **THEN** `registrations[0].agentId` SHALL be `35174`
- **THEN** `registrations[0].agentRegistry` SHALL be `eip155:8453:0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
