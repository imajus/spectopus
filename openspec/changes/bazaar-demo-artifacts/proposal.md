## Why

For Spectopus to be discoverable by other agents, its endpoints must be registered on x402 Bazaar. A demo script proves the full agent journey (discover → pay → use). Hackathon tracks 2 and 3 require `agent.json` and `agent_log.json` artifacts.

## What Changes

- Register `POST /skills/generate` on Bazaar at server startup
- Dynamically register `GET /skills/:id` on Bazaar after each successful generation
- Create demo script that discovers and purchases skills via Bazaar
- Create `agent.json` manifest file
- Integrate agent_log.jsonl output format (logging already implemented in pipeline CR)

## Capabilities

### New Capabilities
- `bazaar-registration`: Register endpoints on x402 Bazaar for discovery at startup and after generation
- `demo-script`: Script demonstrating Bazaar discovery, browse, and purchase flow
- `agent-manifest`: Static `agent.json` file for hackathon submission

### Modified Capabilities
- `pipeline-orchestrator`: Add Bazaar registration call after successful pipeline completion

## Impact

- New files: `src/bazaar.js`, `scripts/demo.js`, `agent.json`
- New dependency: `@x402/extensions`
- Modified: `src/index.js` (Bazaar registration at startup), pipeline orchestrator (register after completion)
- New env var: `BAZAAR_URL` (optional, default: `https://bazaar.x402.org`)
