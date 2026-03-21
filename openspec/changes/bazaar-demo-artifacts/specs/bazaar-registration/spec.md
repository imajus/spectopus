## ADDED Requirements

### Requirement: Register generate endpoint at startup
The server SHALL register `POST /skills/generate` on x402 Bazaar when the server starts, with `discoverable: true` and endpoint metadata (description, pricing, input schema).

#### Scenario: Startup registration
- **WHEN** the server starts successfully
- **THEN** the generate endpoint is registered on Bazaar and discoverable by agents

#### Scenario: Bazaar unavailable at startup
- **WHEN** Bazaar registration fails at startup
- **THEN** the server logs a warning and continues operating (endpoints still work, just not discoverable)

### Requirement: Register skill endpoints after generation
The server SHALL register `GET /skills/:id` on x402 Bazaar after each successful skill generation, with metadata including contract address, chain ID, and skill description.

#### Scenario: Skill registered on Bazaar
- **WHEN** a skill generation completes successfully
- **THEN** the skill's download endpoint is registered on Bazaar with contract-specific metadata

### Requirement: Bazaar URL configuration
The Bazaar client SHALL use the `BAZAAR_URL` environment variable (default: `https://bazaar.x402.org`).

#### Scenario: Custom Bazaar URL
- **WHEN** `BAZAAR_URL` is set to a custom URL
- **THEN** the Bazaar client uses that URL for registration
