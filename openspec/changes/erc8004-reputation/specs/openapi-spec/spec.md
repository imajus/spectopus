## ADDED Requirements

### Requirement: OpenAPI 3.0 specification file
The system SHALL serve an OpenAPI 3.0 specification at `GET /openapi.json` describing all REST API endpoints, request/response schemas, and x402 payment requirements.

#### Scenario: OpenAPI spec returned
- **WHEN** a client sends GET `/openapi.json`
- **THEN** the system SHALL respond with 200 and `Content-Type: application/json`
- **THEN** the response SHALL be a valid OpenAPI 3.0 document

#### Scenario: All endpoints documented
- **WHEN** the OpenAPI spec is examined
- **THEN** it SHALL document: POST /skills/generate, GET /skills/:id, GET /skills/catalog, POST /reputation, GET /erc8004/reputation, GET /agent-registration.json, GET /.well-known/agent-card.json, GET /health

#### Scenario: OpenAPI spec not paywalled
- **WHEN** a client sends GET `/openapi.json` without X-PAYMENT header
- **THEN** the system SHALL respond with 200 (not 402)
