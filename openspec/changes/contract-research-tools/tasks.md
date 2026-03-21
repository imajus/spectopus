## 1. Block Explorer Client

- [ ] 1.1 Create `src/tools/explorer.js` with chain ID → explorer URL mapping (Base Mainnet 8453, Base Sepolia 84532)
- [ ] 1.2 Implement `fetchABI(contractAddress, chainId)` — GET from explorer API, parse response, return ABI JSON or null
- [ ] 1.3 Implement `fetchSourceCode(contractAddress, chainId)` — GET from explorer API, return source string or null
- [ ] 1.4 Add `ETHERSCAN_API_KEY` to `.env.example`

## 2. ERC Detection

- [ ] 2.1 Create `src/tools/erc.js` with ERC interface definitions (ERC-20, ERC-721, ERC-1155, ERC-4626 function signatures)
- [ ] 2.2 Implement `detectERCPatterns(abi)` — match ABI functions against known interfaces, return array of matched standard names

## 3. AI SDK Tool Wrappers

- [ ] 3.1 Install `ai` and `zod` dependencies
- [ ] 3.2 Create `src/tools/research.js` — export Vercel AI SDK `tool()` definitions for fetchABI, fetchSourceCode, detectERCPatterns with zod parameter schemas

## 4. Tests

- [ ] 4.1 Test `detectERCPatterns` with known ERC-20, ERC-721, ERC-1155 ABIs
- [ ] 4.2 Test `fetchABI` and `fetchSourceCode` with mocked HTTP responses
