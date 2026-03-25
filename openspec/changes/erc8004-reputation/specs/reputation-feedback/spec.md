## ADDED Requirements

### Requirement: Reputation session created on pipeline completion
When the skill generation pipeline completes successfully, the system SHALL create a reputation session with a unique `sessionId` and a 1-minute TTL. The session SHALL be stored in memory.

#### Scenario: Session created on success
- **WHEN** `runPipeline` completes successfully (markReady called)
- **THEN** a session SHALL be created with a unique `sessionId`, linked to the `skillId`
- **THEN** the session SHALL auto-expire after 60 seconds

#### Scenario: No session on failure
- **WHEN** `runPipeline` fails (markFailed called)
- **THEN** no reputation session SHALL be created

### Requirement: Session ID in skill response
`GET /skills/:id` SHALL include `sessionId` in the JSON response when the skill status is `ready` and a valid (non-expired) session exists for the skill.

#### Scenario: Session ID included when ready
- **WHEN** a client sends GET `/skills/:id` for a ready skill with an active session
- **THEN** the response JSON SHALL include a `sessionId` field

#### Scenario: No session ID after expiry
- **WHEN** a client sends GET `/skills/:id` for a ready skill whose session has expired
- **THEN** the response JSON SHALL NOT include a `sessionId` field

### Requirement: POST /reputation endpoint
The system SHALL provide a `POST /reputation` endpoint (not paywalled) that accepts `{ sessionId, value, walletAddress }` and performs on-chain feedback + USDC refund.

#### Scenario: Valid reputation submission
- **WHEN** a client sends POST `/reputation` with a valid `sessionId`, `value` (0-100), and `walletAddress`
- **THEN** the system SHALL call `giveFeedback` on the Reputation Registry at `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` with agent ID `35174`, the provided `value`, and tag1 `starred`
- **THEN** the system SHALL send $0.05 USDC to `walletAddress` on Base from the operator wallet
- **THEN** the system SHALL invalidate the session (one-time use)
- **THEN** the system SHALL respond with 200 and `{ success: true, txHash, refundTxHash }`

#### Scenario: Expired session
- **WHEN** a client sends POST `/reputation` with an expired `sessionId`
- **THEN** the system SHALL respond with 410 Gone and `{ error: "Session expired" }`

#### Scenario: Invalid session
- **WHEN** a client sends POST `/reputation` with an unknown `sessionId`
- **THEN** the system SHALL respond with 404 and `{ error: "Session not found" }`

#### Scenario: Missing required fields
- **WHEN** a client sends POST `/reputation` without `sessionId`, `value`, or `walletAddress`
- **THEN** the system SHALL respond with 400

### Requirement: GET reputation summary
The system SHALL provide `GET /erc8004/reputation` (not paywalled) that reads aggregated reputation from the on-chain Reputation Registry.

#### Scenario: Reputation summary returned
- **WHEN** a client sends GET `/erc8004/reputation`
- **THEN** the system SHALL call `getSummary(35174, ...)` on the Reputation Registry
- **THEN** the system SHALL respond with 200 and `{ agentId, count, averageValue, feedbacks }`
