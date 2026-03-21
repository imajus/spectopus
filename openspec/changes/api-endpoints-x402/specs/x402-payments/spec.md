## ADDED Requirements

### Requirement: x402 payment on generate endpoint
`POST /skills/generate` SHALL require a $0.10 USDC payment via x402 before processing the request.

#### Scenario: Payment accepted
- **WHEN** a request includes a valid x402 payment of $0.10 USDC
- **THEN** the request proceeds to the handler

#### Scenario: No payment
- **WHEN** a request lacks x402 payment headers
- **THEN** the x402 middleware responds with 402 Payment Required

### Requirement: x402 payment on download endpoint
`GET /skills/:id` SHALL require a $0.01 USDC payment via x402 before returning skill content.

#### Scenario: Payment accepted
- **WHEN** a request includes a valid x402 payment of $0.01 USDC
- **THEN** the request proceeds to return the skill content

### Requirement: x402 configuration
The x402 middleware SHALL be configured with the server wallet (from `WALLET_PRIVATE_KEY`), USDC token on Base Mainnet, and the x402 facilitator endpoint.

#### Scenario: Wallet configuration
- **WHEN** the server starts
- **THEN** x402 middleware is configured with the wallet derived from `WALLET_PRIVATE_KEY`

### Requirement: Health endpoint exempt from payment
`GET /health` SHALL NOT require x402 payment.

#### Scenario: Free health check
- **WHEN** a GET request is made to `/health` without payment headers
- **THEN** the server responds with 200
