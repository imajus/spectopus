## Why

Spectopus needs HTTP endpoints for agents to request skill generation and retrieve generated skills. Both endpoints are monetized via x402 — the open payment standard — so agents pay per-request without accounts or API keys.

## What Changes

- Add `POST /skills/generate` endpoint — accepts contract address, chain ID, optional message; creates S3 placeholder; kicks off pipeline async; returns skill ID and URL
- Add `GET /skills/:id` endpoint — retrieves SKILL.md from S3, returns content (status placeholder or final skill)
- Integrate x402 Express middleware for payment gating on both endpoints
- Configure x402 with USDC on Base, facilitator URL, and pricing

## Capabilities

### New Capabilities
- `generate-endpoint`: POST /skills/generate endpoint with x402 payment, async pipeline trigger, and immediate response
- `download-endpoint`: GET /skills/:id endpoint with x402 payment, S3 retrieval, and status-aware response
- `x402-payments`: x402 middleware configuration for payment gating on skill endpoints

### Modified Capabilities
- `express-server`: Add skill routes to the Express app

## Impact

- New files: `src/routes/skills.js`
- New dependencies: `@x402/express`, `@x402/evm`
- Modified: `src/app.js` (mount skill routes)
- New env vars: `WALLET_PRIVATE_KEY`, `BASE_URL`
