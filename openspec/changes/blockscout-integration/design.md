## Context

The skill generation pipeline's research stage calls `fetchABI` and `fetchSourceCode` from `src/tools/explorer.js` to gather contract data. These functions currently use the Etherscan V2 API (`api.etherscan.io/v2/api`) which requires a paid plan for Base Mainnet (chain 8453). Blockscout operates a free Base Mainnet explorer at `base.blockscout.com` with a REST API v2 that returns both ABI and source code from a single endpoint.

## Goals / Non-Goals

**Goals:**
- Restore working contract data fetching for Base Mainnet and Base Sepolia
- Remove dependency on paid Etherscan API key for contract queries
- Maintain identical function signatures so callers are unaffected

**Non-Goals:**
- Supporting chains beyond Base Mainnet (8453) and Base Sepolia (84532)
- Caching or rate-limiting Blockscout requests
- Removing `ETHERSCAN_API_KEY` from `.env.example` entirely (may be used elsewhere)

## Decisions

### Use Blockscout REST API v2 instead of Etherscan-compatible RPC API

Blockscout offers two APIs: an Etherscan-compatible RPC-style API (`/api?module=contract&action=getabi`) and a native REST API v2 (`/api/v2/smart-contracts/{address}`).

**Choice: REST API v2**
- Returns both ABI and source code in one request (vs two separate Etherscan calls)
- Richer response with verification status, compiler info, and additional sources
- No API key required
- Alternative (Etherscan-compatible API) would be a smaller diff but still requires two requests and may have less reliable support

### Single endpoint, extract both ABI and source code

Both `fetchABI` and `fetchSourceCode` will call the same Blockscout endpoint. Each extracts the field it needs (`abi` or `source_code`). This doubles the requests if both are called for the same contract, but keeps the function signatures simple and avoids shared state. The AI agent typically calls both tools for the same contract, but the overhead of an extra HTTP call is negligible compared to LLM inference time.

### Chain-to-URL mapping

```
8453  → https://base.blockscout.com
84532 → https://base-sepolia.blockscout.com
```

## Risks / Trade-offs

- [Blockscout downtime] → Low risk; Blockscout is widely used for Base. No fallback planned.
- [Contract not verified on Blockscout] → Same limitation as Etherscan. Functions return `null` for unverified contracts.
- [Two HTTP requests for same contract] → Acceptable tradeoff for API simplicity. Could optimize later with a shared cache if needed.
