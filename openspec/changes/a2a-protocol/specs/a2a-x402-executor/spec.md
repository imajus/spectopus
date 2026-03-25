## ADDED Requirements

### Requirement: Contract address extraction from message
The executor SHALL extract a contract address from the user's message by first attempting JSON parse for `{ contractAddress }`, then falling back to regex matching `0x[a-fA-F0-9]{40}`.

#### Scenario: Address from JSON body
- **WHEN** the user sends `{"contractAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"}`
- **THEN** the executor SHALL extract `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

#### Scenario: Address from plain text
- **WHEN** the user sends `Generate skill for 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **THEN** the executor SHALL extract `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

#### Scenario: No address found
- **WHEN** the user sends `Hello, what can you do?`
- **THEN** the executor SHALL transition the task to `input-required` asking for a contract address

### Requirement: x402 payment required before execution
When a valid contract address is found, the executor SHALL respond with `input-required` state and include `x402.payment.required` in `task.status.message.metadata` containing payment requirements for $0.10 USDC on Base (eip155:8453).

#### Scenario: Payment requirements returned
- **WHEN** a user sends a message with a valid contract address (first interaction)
- **THEN** the task SHALL transition to `input-required`
- **THEN** `metadata["x402.payment.status"]` SHALL be `"payment-required"`
- **THEN** `metadata["x402.payment.required"]` SHALL contain `accepts` with scheme `exact`, network `eip155:8453`, and `maxAmountRequired` for $0.10 USDC

### Requirement: Payment verification and settlement
When the client submits a signed payment payload via `message/send` with the task's `taskId`, the executor SHALL verify and settle the payment via the x402 facilitator.

#### Scenario: Valid payment submitted
- **WHEN** a user sends a message with `x402.payment.payload` in metadata for an existing task
- **THEN** the executor SHALL decode the payment, verify via facilitator, and settle on-chain
- **THEN** `metadata["x402.payment.status"]` SHALL transition to `"payment-verified"` then `"payment-completed"`

#### Scenario: Invalid payment submitted
- **WHEN** a user sends a message with an invalid `x402.payment.payload`
- **THEN** the task SHALL transition to `failed`
- **THEN** `metadata["x402.payment.status"]` SHALL be `"payment-failed"`
- **THEN** `metadata["x402.payment.error"]` SHALL contain an error code

### Requirement: Pipeline execution after payment
After successful payment settlement, the executor SHALL run the skill generation pipeline and publish progress as A2A task status events.

#### Scenario: Pipeline runs after payment
- **WHEN** payment is successfully settled
- **THEN** the executor SHALL create a storage placeholder and run `runPipeline` with an `onProgress` callback
- **THEN** the task SHALL transition to `working` with stage messages (research, generate, validate)

#### Scenario: Pipeline completes successfully
- **WHEN** the pipeline completes with a valid skill
- **THEN** the task SHALL transition to `completed`
- **THEN** the task SHALL include an artifact with the SKILL.md content as `text/markdown`
- **THEN** `metadata["x402.payment.receipts"]` SHALL contain the settlement receipt

#### Scenario: Pipeline fails
- **WHEN** the pipeline fails during execution
- **THEN** the task SHALL transition to `failed` with an error message
- **THEN** `metadata["x402.payment.receipts"]` SHALL still contain the settlement receipt (payment is non-refundable)

### Requirement: Pipeline onProgress callback
`runPipeline` SHALL accept an optional fourth parameter `onProgress` (callback function). Existing callers passing 3 arguments SHALL be unaffected.

#### Scenario: onProgress called per stage
- **WHEN** `runPipeline` is called with an `onProgress` callback
- **THEN** the callback SHALL be invoked before each stage with `{ stage, status: 'working' }`

#### Scenario: Backward compatible without onProgress
- **WHEN** `runPipeline` is called without an `onProgress` callback
- **THEN** it SHALL behave identically to the current implementation
