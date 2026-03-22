## 1. Rewrite explorer module

- [x] 1.1 Replace `getExplorerUrl` with Blockscout URL map (`{ 8453: 'https://base.blockscout.com', 84532: 'https://base-sepolia.blockscout.com' }`)
- [x] 1.2 Rewrite `fetchABI` to call `GET {baseUrl}/api/v2/smart-contracts/{address}` and return `data.abi` (already parsed JSON, no `JSON.parse` needed)
- [x] 1.3 Rewrite `fetchSourceCode` to call the same Blockscout endpoint and return `data.source_code`
- [x] 1.4 Remove `ETHERSCAN_API_KEY` usage from both functions

## 2. Update tests

- [x] 2.1 Update `explorer.test.js` mocks to return Blockscout v2 response shape (`{ abi: [...], source_code: "...", is_verified: true }`)
- [x] 2.2 Update URL assertions to match `blockscout.com` URLs
- [x] 2.3 Remove `ETHERSCAN_API_KEY` setup from `beforeEach`
- [x] 2.4 Run `npx vitest src/tools/explorer.test.js` and verify all tests pass

## 3. Verify end-to-end

- [x] 3.1 Test `fetchABI('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 8453)` inline — should return USDC ABI array
- [x] 3.2 Test `runResearch('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 8453)` inline — research stage should complete with real contract data
