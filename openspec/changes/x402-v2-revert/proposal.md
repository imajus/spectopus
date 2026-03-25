## Why

The switch to `x402-express` (v1) + thirdweb facilitator in commit `dc3cc42` was a workaround because thirdweb only supported x402Version:1. This broke Bazaar discovery (which requires `@x402/extensions`) and locked us into a deprecated payment stack. PayAI facilitator supports x402 v2, enabling us to revert to `@x402/express` v2 and restore Coinbase Bazaar discovery.

## What Changes

- **BREAKING**: Replace `x402-express` (Coinbase v1) with `@x402/express` v2 payment middleware
- **BREAKING**: Remove `thirdweb` dependency; configure PayAI facilitator via URL
- Restore `declareDiscoveryExtension` from `@x402/extensions/bazaar` on both route configs
- Use `x402ResourceServer` + `ExactEvmScheme` pattern from `@x402/evm`
- Keep all post-commit improvements (guardrails, JSON responses, logUrl, execution logging)

## Capabilities

### New Capabilities
- `x402-v2-payments`: x402 v2 payment middleware with PayAI facilitator, ExactEvmScheme, and Bazaar discovery extensions

### Modified Capabilities

## Impact

- `src/routes/skills.js` — rewrite payment middleware setup
- `package.json` — remove `x402-express`, `thirdweb`; add `@x402/express`, `@x402/evm`, `@x402/extensions`
- `.env.example` — replace `THIRDWEB_SECRET_KEY`, `THIRDWEB_SERVER_WALLET_ADDRESS` with `X402_FACILITATOR_URL`, `PAY_TO_ADDRESS`
- `CLAUDE.md` — update x402/Bazaar documentation
