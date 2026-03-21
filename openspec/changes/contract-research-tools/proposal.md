## Why

The generation pipeline's Research stage needs deterministic tools to gather smart contract data. These tools are reusable building blocks that fetch ABI, source code, and detect ERC patterns from block explorer APIs. Without them, the AI agent has nothing to analyze.

## What Changes

- Add Basescan/Etherscan API client for fetching contract data
- Implement `fetchABI(contractAddress, chainId)` — returns parsed ABI JSON
- Implement `fetchSourceCode(contractAddress, chainId)` — returns verified source code string
- Implement `detectERCPatterns(abi)` — analyzes ABI to identify ERC-20, ERC-721, ERC-1155, and other known standards
- Format these as Vercel AI SDK tool definitions for use in the Research stage agent

## Capabilities

### New Capabilities
- `block-explorer-client`: HTTP client for Basescan/Etherscan API with ABI and source code fetching
- `erc-detection`: Pattern matching to identify ERC standards from ABI function signatures
- `ai-sdk-tools`: Vercel AI SDK tool wrappers exposing research functions to the LLM agent

### Modified Capabilities

(none)

## Impact

- New files in `src/tools/` directory
- New dependency: Vercel AI SDK (`ai`)
- Requires `ETHERSCAN_API_KEY` env var
- Updates `.env.example` with new variable
