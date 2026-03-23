## Context

Spectopus is an Express server that generates SKILL.md files for smart contracts via a 3-stage async pipeline. It currently uses x402 payment middleware on REST endpoints. The Google A2A protocol (v0.3.0, Linux Foundation) provides a standardized way for agents to discover and interact with each other via Agent Cards and JSON-RPC.

The official `@a2a-js/sdk` package provides Express middleware for serving A2A Agent Cards and handling JSON-RPC requests, with built-in task store and request handling.

## Goals / Non-Goals

**Goals:**
- Make Spectopus discoverable by any A2A-compatible agent
- Map the existing async pipeline to A2A task lifecycle
- Keep existing x402 REST endpoints working unchanged
- Quick, minimal implementation using the official SDK

**Non-Goals:**
- Streaming support (pipeline is async, not suitable for SSE streaming)
- Push notifications
- Authentication on A2A endpoints (keeping it open for hackathon)
- Replacing x402 payment flow with A2A

## Decisions

### Use `@a2a-js/sdk` official SDK
**Rationale**: Official JS SDK from the a2aproject org, implements spec v0.3.0, provides Express middleware out of the box. Alternatives like hand-rolling JSON-RPC handlers would be more work with no benefit.

### Mount A2A at `/a2a` subpath
**Rationale**: Keeps A2A JSON-RPC separate from existing REST routes. The agent card is at `/.well-known/agent-card.json` (standard path). The JSON-RPC handler is at `/a2a` to avoid conflicts with existing `POST /` or payment middleware.

### Use InMemoryTaskStore (not S3)
**Rationale**: The SDK provides `InMemoryTaskStore` for task lifecycle tracking. The actual SKILL.md content is already stored in S3. Using in-memory for A2A task state keeps it simple — tasks are ephemeral protocol state, not persistent data. Acceptable for a hackathon.

### Synchronous executor with polling
**Rationale**: The existing pipeline is async (fire-and-forget). The A2A executor will run the pipeline to completion within `execute()`, publishing status events as stages progress. Since the SDK manages the task lifecycle, we publish submitted → working (per stage) → completed/failed events via the EventBus. Clients poll via `GetTask`.

### Keep `agent.json` (ERC-8004) separate
**Rationale**: Different standard, different purpose. A2A Agent Card has its own schema and lives at a different path. No reason to merge or replace.

## Risks / Trade-offs

- **[In-memory task store lost on restart]** → Acceptable for hackathon. Tasks are ephemeral; actual skills persist in S3.
- **[No auth on A2A endpoints]** → For hackathon demo. Production would add API key or OAuth via SDK's `UserBuilder`.
- **[Long-running execute()]** → Pipeline takes minutes. The SDK handles this — the task stays in "working" state while the executor runs. Clients poll via GetTask.
