## Context

Spectopus has REST endpoints with x402 payments but no standard agent-to-agent protocol. The A2A protocol (v0.3.0, Linux Foundation) enables agent interoperability. The a2a-x402 extension (v0.2) adds payment negotiation within A2A via metadata fields.

The official `@a2a-js/sdk` provides Express middleware for A2A Agent Cards and JSON-RPC handling. Payment verification/settlement uses the same `x402` packages as the REST middleware.

## Goals / Non-Goals

**Goals:**
- A2A Agent Card at standard path with x402 extension declared
- JSON-RPC endpoint handling `message/send` and `tasks/get` with x402 payment flow
- Payment required for skill generation (same price as REST: $0.10 USDC)
- Pipeline status events published as A2A task state transitions

**Non-Goals:**
- Streaming support (pipeline is async)
- Push notifications
- Authentication on A2A endpoints beyond x402 payments
- Separate pricing for A2A vs REST

## Decisions

### a2a-x402 Standalone Flow
**Rationale**: The Standalone Flow transports payment requirements and payloads via `task.status.message.metadata` fields (`x402.payment.required`, `x402.payment.payload`, `x402.payment.status`). This is simpler than the Embedded Flow (which nests inside AP2 commerce protocol). The executor handles the full state machine: `payment-required` → `payment-submitted` → `payment-verified` → `payment-completed`.

### Same facilitator as REST endpoints
**Rationale**: The A2A executor uses the same PayAI facilitator and `x402` package functions (`useFacilitator`, `exact.evm.decodePayment`) as the REST payment middleware. This ensures consistent payment handling and settlement.

### InMemoryTaskStore
**Rationale**: The `@a2a-js/sdk` provides `InMemoryTaskStore` for A2A task lifecycle. Actual skill content persists in Filecoin — A2A tasks are ephemeral protocol state. Lost on restart, same as pipeline state.

### Two-step executor: payment then pipeline
**Rationale**: The executor handles two `message/send` calls per skill generation:
1. First message (contract address) → respond with `input-required` + payment requirements
2. Second message (signed payment) → verify, settle, run pipeline, return completed task

This maps to the a2a-x402 state machine cleanly.

### Pipeline onProgress callback
**Rationale**: Adding an optional `onProgress` callback to `runPipeline` is backward compatible (existing callers pass 3 args). The A2A executor uses it to publish `working` status events with stage names.

## Risks / Trade-offs

- **[Long-running executor]** → Pipeline takes minutes. The SDK manages task state; clients poll via `tasks/get`. The `working` state with stage messages provides progress visibility.
- **[@a2a-js/sdk API surface]** → SDK may differ from assumptions. Read SDK source during implementation. The executor pattern is standard — adapt as needed.
- **[Payment before execution]** → Client pays before knowing if generation succeeds. Same as REST flow. Failed pipeline = lost payment (acceptable for PoC).
