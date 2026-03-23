## Why

Spectopus currently exposes a custom REST API with x402 payment middleware. The Google A2A (Agent-to-Agent) protocol is an open standard (donated to the Linux Foundation) that enables interoperability between AI agents across frameworks. Adding A2A support makes Spectopus discoverable and usable by any A2A-compatible agent — expanding reach beyond x402-only clients.

## What Changes

- Serve an A2A Agent Card at `/.well-known/agent-card.json` for agent discovery
- Add A2A JSON-RPC endpoint (via `@a2a-js/sdk`) that accepts `SendMessage` requests and maps them to the existing generation pipeline
- Implement an `AgentExecutor` that bridges A2A task lifecycle to Spectopus's async pipeline (submitted → working → completed/failed)
- A2A wraps the existing x402 flow — the executor calls the pipeline internally while x402 endpoints remain untouched
- Keep existing `agent.json` (ERC-8004) as-is — it serves a different purpose

## Capabilities

### New Capabilities
- `a2a-agent-card`: A2A Agent Card served at `/.well-known/agent-card.json` describing Spectopus skills, capabilities, and protocol version
- `a2a-executor`: AgentExecutor implementation that maps A2A SendMessage to the generation pipeline, publishing task status events as stages progress

### Modified Capabilities

(none — existing x402 REST endpoints are unchanged)

## Impact

- **Dependencies**: Add `@a2a-js/sdk` package
- **Code**: New files under `src/a2a/`, minor modification to `src/app.js` (mount A2A handlers) and `src/pipeline/index.js` (optional progress callback)
- **APIs**: New endpoint at `/a2a` (JSON-RPC) + `/.well-known/agent-card.json` (GET)
- **Existing endpoints**: No changes — `POST /skills/generate` and `GET /skills/:id` continue working with x402
