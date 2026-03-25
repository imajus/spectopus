## Why

Spectopus is only accessible via custom REST + x402 endpoints. The Google A2A (Agent-to-Agent) protocol is an open standard for agent interoperability. Adding A2A with x402 payments (a2a-x402 Standalone Flow) makes Spectopus usable by any A2A-compatible agent while still requiring payment for inference and generation.

## What Changes

- Serve A2A Agent Card at `GET /.well-known/agent-card.json` (v0.3.0) with x402 extension declared
- Add A2A JSON-RPC endpoint at `POST /a2a` via `@a2a-js/sdk`
- Implement AgentExecutor with x402 payment flow: initial request → payment-required → payment-submitted → verify/settle → pipeline execution → completed with receipts
- Use facilitator verify/settle from `x402` package for A2A payment processing (same facilitator as REST)
- Add optional `onProgress` callback to pipeline for A2A status events

## Capabilities

### New Capabilities
- `a2a-agent-card`: A2A Agent Card with x402 extension, served at standard well-known path
- `a2a-x402-executor`: AgentExecutor implementing a2a-x402 Standalone Flow — payment negotiation, verification, settlement, and pipeline bridging

### Modified Capabilities

## Impact

- New files: `src/a2a/agent-card.js`, `src/a2a/executor.js`, `src/a2a/index.js`
- `src/app.js` — mount A2A routes before payment middleware
- `src/pipeline/index.js` — add optional `onProgress` callback (backward compatible)
- `package.json` — add `@a2a-js/sdk`
- Existing x402 REST endpoints unchanged
