## Context

Spectopus has a static `agent.json` with an ERC-8004 registration tx on Base Mainnet (agent ID 35174), but no code promotes services or interacts with the on-chain registries. ERC-8004 defines Identity, Reputation, and Validation registries. The Identity Registry's `agentURI` resolves to a registration file listing services. The Reputation Registry allows non-agent addresses to leave verifiable feedback.

Contracts on Base Mainnet:
- Identity Registry: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- Reputation Registry: `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`
- Agent ID: `35174`

## Goals / Non-Goals

**Goals:**
- Host ERC-8004 registration file with custom service types (web, A2A, skill, api)
- Integrate Reputation Registry: submit feedback on-chain + read aggregated reputation
- Incentivize feedback via USDC refund (50% of generation fee)
- Time-limited sessions (1 minute from pipeline completion) for refund eligibility
- Create OpenAPI spec for programmatic API discovery

**Non-Goals:**
- Auto-updating `agentURI` on startup (user updates manually, one-off)
- Validation Registry integration (out of scope)
- Persistent session storage (in-memory with TTL, lost on restart)
- Reputation-based access control or pricing

## Decisions

### Custom ERC-8004 service types
**Rationale**: The ERC-8004 spec doesn't enforce a strict schema for the `services` array in the registration file. Beyond standard types (web, A2A), we add:
- `skill`: points to Spectopus SKILL.md — agents can consume this to learn how to interact with us
- `api`: points to OpenAPI spec — programmatic discovery of REST endpoints

### Session from pipeline completion
**Rationale**: The 1-minute TTL starts when the pipeline completes and the session is created. The `sessionId` is included in `GET /skills/:id` responses when status is `ready`. This gives the agent time to review the skill and submit feedback. In-memory `Map<sessionId, data>` with `setTimeout` cleanup.

### Reputation refund incentive
**Rationale**: `POST /reputation` with a valid `sessionId` triggers two actions:
1. On-chain: `giveFeedback(agentId, value, ...)` on the Reputation Registry
2. Financial: USDC transfer from operator wallet to caller's `walletAddress` (50% of $0.10 = $0.05)

The caller provides `walletAddress` in the request body. The operator wallet (`BASE_PRIVATE_KEY`) signs the USDC transfer. This creates a verifiable on-chain feedback loop — real trust signals backed by financial incentive.

### Read-only reputation endpoint
**Rationale**: `GET /erc8004/reputation` calls `getSummary` on the Reputation Registry and returns aggregated data. Transparent reputation for anyone to verify.

### No auto setAgentURI
**Rationale**: Updating `agentURI` on-chain is a one-off operation. The user will call `setAgentURI(35174, registrationFileUrl)` manually after deploying. The server just hosts the registration file.

## Risks / Trade-offs

- **[USDC refund requires operator funds]** → Operator wallet must hold USDC on Base. Each refund is $0.05. Monitor balance.
- **[Session TTL too short]** → 1 minute may be tight if agent needs time to process the skill. Could make configurable via env var.
- **[Reputation gaming]** → ERC-8004 only allows non-agent addresses to give feedback. But callers could be Sybil addresses. Acceptable for PoC — the on-chain record is transparent.
- **[Payer address unknown]** → The refund goes to `walletAddress` from the request body, not necessarily the original payer. For PoC this is acceptable.
