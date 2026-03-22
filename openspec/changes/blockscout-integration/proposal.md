## Why

Etherscan/Basescan deprecated their V1 API and the V2 unified API requires a paid plan for Base Mainnet. The `fetchABI` and `fetchSourceCode` functions in `src/tools/explorer.js` currently return `null` for all requests, breaking the entire skill generation pipeline at the research stage. Blockscout provides a free, no-API-key alternative with full Base Mainnet support.

## What Changes

- Replace Etherscan/Basescan API calls with Blockscout REST API v2 (`/api/v2/smart-contracts/{address}`)
- Remove dependency on `ETHERSCAN_API_KEY` environment variable for contract data fetching
- Both `fetchABI` and `fetchSourceCode` will use the same Blockscout endpoint (returns ABI and source in one response)
- Update unit tests to mock Blockscout response shape

## Capabilities

### New Capabilities
- `blockscout-explorer`: Contract data fetching via Blockscout API v2 — covers ABI retrieval, source code retrieval, and chain-specific endpoint routing for Base Mainnet and Base Sepolia

### Modified Capabilities

## Impact

- `src/tools/explorer.js` — full rewrite of API integration (Etherscan → Blockscout)
- `src/tools/explorer.test.js` — updated mocks and assertions
- `.env.example` — `ETHERSCAN_API_KEY` no longer required for contract data (may keep for other uses)
- No breaking changes to the `fetchABI`/`fetchSourceCode` function signatures — callers are unaffected
