## 1. Rewrite explorer module

- [ ] 1.1 Replace `getExplorerUrl` with Blockscout URL map (`{ 8453: 'https://base.blockscout.com', 84532: 'https://base-sepolia.blockscout.com' }`)
- [ ] 1.2 Rewrite `fetchABI` to call `GET {baseUrl}/api/v2/smart-contracts/{address}` and return `data.abi` (already parsed JSON, no `JSON.parse` needed)
- [ ] 1.3 Rewrite `fetchSourceCode` to call the same Blockscout endpoint and return `data.source_code`
- [ ] 1.4 Remove `ETHERSCAN_API_KEY` usage from both functions

## 2. Update tests

- [ ] 2.1 Update `explorer.test.js` mocks to return Blockscout v2 response shape (`{ abi: [...], source_code: "...", is_verified: true }`)
- [ ] 2.2 Update URL assertions to match `blockscout.com` URLs
- [ ] 2.3 Remove `ETHERSCAN_API_KEY` setup from `beforeEach`
- [ ] 2.4 Run `npx vitest src/tools/explorer.test.js` and verify all tests pass

## 3. Verify end-to-end

- [ ] 3.1 Test `fetchABI('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 8453)` inline — should return USDC ABI array
- [ ] 3.2 Test `runResearch('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 8453)` inline — research stage should complete with real contract data
