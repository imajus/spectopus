## ADDED Requirements

### Requirement: x402 v2 payment middleware
The system SHALL use `@x402/express` v2 payment middleware with `x402ResourceServer` and `ExactEvmScheme` from `@x402/evm`. The facilitator URL SHALL be configurable via `X402_FACILITATOR_URL` environment variable, defaulting to `https://facilitator.payai.network/`.

#### Scenario: Payment middleware configured with PayAI facilitator
- **WHEN** the server starts with `X402_FACILITATOR_URL` and `PAY_TO_ADDRESS` env vars set
- **THEN** the payment middleware SHALL create an `x402ResourceServer` with the facilitator URL and register `ExactEvmScheme` for network `eip155:8453`

#### Scenario: POST /skills/generate requires $0.10 USDC payment
- **WHEN** a client sends POST /skills/generate without a valid x402 payment header
- **THEN** the server SHALL respond with 402 and `accepts` containing payment requirements for $0.10 USDC on Base

#### Scenario: GET /skills/:id requires $0.01 USDC payment
- **WHEN** a client sends GET /skills/:id without a valid x402 payment header
- **THEN** the server SHALL respond with 402 and `accepts` containing payment requirements for $0.01 USDC on Base

### Requirement: Bazaar discovery extensions
Each x402-protected route SHALL include `declareDiscoveryExtension` from `@x402/extensions/bazaar` so that routes are indexed on Coinbase Bazaar.

#### Scenario: Generate route has Bazaar discovery metadata
- **WHEN** the POST /skills/generate route config is examined
- **THEN** it SHALL include discovery extension with `bodyType: 'json'` and example `input`

#### Scenario: Download route has Bazaar discovery metadata
- **WHEN** the GET /skills/:id route config is examined
- **THEN** it SHALL include discovery extension metadata

### Requirement: Remove thirdweb dependency
The system SHALL NOT depend on `thirdweb`, `x402-express`, or any v1 x402 packages. All payment functionality SHALL use `@x402/express`, `@x402/evm`, and `@x402/extensions`.

#### Scenario: Package dependencies updated
- **WHEN** `package.json` is examined
- **THEN** it SHALL NOT contain `x402-express` or `thirdweb` in dependencies
- **THEN** it SHALL contain `@x402/express`, `@x402/evm`, and `@x402/extensions`
