## Context

Spectopus currently uses `x402-express` (Coinbase v1) with thirdweb facilitator for payment middleware. This was a workaround because thirdweb's facilitator only supported x402Version:1, incompatible with `@x402/express` v2. The workaround removed Bazaar discovery (`@x402/extensions`) and introduced a dependency on thirdweb SDK.

The PayAI facilitator supports x402 v2, enabling us to revert to the `@x402/express` v2 stack and restore Coinbase Bazaar discovery.

Current code: `src/routes/skills.js` uses `paymentMiddleware` from `x402-express` with `createThirdwebClient`/`createFacilitator` from `thirdweb/x402`.

## Goals / Non-Goals

**Goals:**
- Restore `@x402/express` v2 payment middleware with PayAI facilitator
- Restore Coinbase Bazaar discovery via `declareDiscoveryExtension`
- Keep all post-commit improvements (guardrails, JSON responses, logUrl, execution logging)
- Make facilitator URL configurable via environment variable

**Non-Goals:**
- Changing payment amounts ($0.10 generate, $0.01 download)
- Modifying route logic or response formats
- Adding new endpoints

## Decisions

### Use PayAI facilitator via URL
**Rationale**: PayAI supports x402 v2, which is required by `@x402/express` v2. The facilitator URL is configurable via `X402_FACILITATOR_URL` env var, making it easy to switch facilitators later. The `x402ResourceServer` accepts a facilitator URL directly.

### Restore Router pattern
**Rationale**: The pre-commit code used `createSkillsRouter()` returning an Express Router mounted at `/skills`. The current code uses `registerSkillsRoutes(app)` mounting directly on app. Keep the current `registerSkillsRoutes(app)` pattern since all other code references it, and `@x402/express` v2 works with either pattern.

### Keep `@x402/extensions` for Bazaar discovery
**Rationale**: `declareDiscoveryExtension` from `@x402/extensions/bazaar` adds discovery metadata to route configs. The Coinbase Bazaar endpoint auto-indexes resources with this metadata. This is the standard way to make x402 resources discoverable.

## Risks / Trade-offs

- **[PayAI facilitator availability]** → Facilitator URL is configurable; can switch to another v2 facilitator if PayAI has issues.
- **[@x402/express v2 API may have changed since pre-commit version]** → Pin to `^2.7.0` (same version as before). Verify API during implementation.
- **[Bazaar discovery not immediately populated]** → Resources appear after first payment settles through the facilitator. This is expected behavior.
