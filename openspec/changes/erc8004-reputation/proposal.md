## Why

Spectopus has a static `agent.json` with a registration tx but no code promotes services or integrates reputation on-chain. ERC-8004 defines registries for identity, services, and reputation — we need to host a registration file listing our services (web, A2A, skill, api) and integrate the Reputation Registry so agents can leave verifiable trust signals. A refund incentive (50% of generation fee) encourages feedback.

## What Changes

- Host ERC-8004 registration file at `GET /agent-registration.json` with custom service types: web, A2A, skill (SKILL.md), api (openapi.json)
- No auto `setAgentURI` on startup — user updates on-chain manually
- Add `POST /reputation` endpoint: validates time-limited session, calls `giveFeedback` on Reputation Registry, sends USDC refund to caller
- Add `GET /erc8004/reputation` endpoint: reads aggregated reputation from on-chain registry
- Create reputation sessions on pipeline completion (1-minute TTL, in-memory)
- Include `sessionId` in `GET /skills/:id` response when status is ready
- Create `openapi.json` for the "api" service type
- Update `skills/spectopus/SKILL.md` to document the reputation endpoint

## Capabilities

### New Capabilities
- `erc8004-registration`: Host ERC-8004 registration file with services (web, A2A, skill, api)
- `reputation-feedback`: Reputation endpoint with session-based refund incentive and on-chain feedback via Reputation Registry
- `openapi-spec`: OpenAPI 3.0 specification for REST API

### Modified Capabilities

## Impact

- New files: `src/erc8004/registry.js`, `src/erc8004/registration-file.js`, `src/erc8004/index.js`, `src/erc8004/sessions.js`, `openapi.json`
- `src/app.js` — mount ERC-8004 routes
- `src/pipeline/index.js` — create reputation session on completion
- `src/routes/skills.js` — include sessionId in GET response
- `agent.json` — update techStack, services
- `.env.example` — add `ERC8004_AGENT_ID`, `BASE_PRIVATE_KEY`
- `skills/spectopus/SKILL.md` — document reputation endpoint
- Depends on `viem` (already added by filecoin-storage change)
- ERC-8004 contracts: Identity `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`, Reputation `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`, Agent ID `35174`
