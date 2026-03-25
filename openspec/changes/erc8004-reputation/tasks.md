## 1. ERC-8004 Registration File

- [ ] 1.1 Create `src/erc8004/registration-file.js` with `buildRegistrationFile(baseUrl)` returning ERC-8004 registration JSON with services (web, A2A, skill, api)
- [ ] 1.2 Create `src/erc8004/index.js` with `registerERC8004Routes(app)` mounting GET `/agent-registration.json` and reputation endpoints
- [ ] 1.3 Modify `src/app.js`: import and call `registerERC8004Routes(app)` before payment middleware

## 2. On-chain Registry Integration

- [ ] 2.1 Create `src/erc8004/registry.js` with viem public + wallet clients for Base Mainnet
- [ ] 2.2 Implement `getReputation(agentId)`: call `getSummary` and `readAllFeedback` on Reputation Registry (`0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`)
- [ ] 2.3 Implement `submitFeedback(agentId, value, endpoint)`: call `giveFeedback` on Reputation Registry
- [ ] 2.4 Implement `sendUSDCRefund(toAddress, amount)`: USDC transfer on Base from operator wallet

## 3. Sessions

- [ ] 3.1 Create `src/erc8004/sessions.js` with in-memory session store: `createSession(skillId)` → sessionId, `validateSession(sessionId)` → skillId or null, `getSessionBySkill(skillId)` → sessionId or null
- [ ] 3.2 Sessions auto-expire after 60 seconds via `setTimeout`

## 4. Reputation Endpoint

- [ ] 4.1 Implement `POST /reputation` in `src/erc8004/index.js`: validate session, call `submitFeedback`, send USDC refund, invalidate session
- [ ] 4.2 Implement `GET /erc8004/reputation`: call `getReputation` and return aggregated data

## 5. Pipeline Integration

- [ ] 5.1 Modify `src/pipeline/index.js`: after `markReady`, create a reputation session via `createSession(skillId)`
- [ ] 5.2 Modify `src/routes/skills.js`: include `sessionId` in GET response when status is `ready` and session exists

## 6. OpenAPI & Docs

- [ ] 6.1 Create `openapi.json` with OpenAPI 3.0 spec documenting all endpoints
- [ ] 6.2 Serve `openapi.json` as GET `/openapi.json` (static file, not paywalled)
- [ ] 6.3 Update `agent.json` with current techStack and services
- [ ] 6.4 Update `skills/spectopus/SKILL.md` to document the reputation endpoint and refund incentive

## 7. Environment

- [ ] 7.1 Update `.env.example` with `ERC8004_AGENT_ID=35174`, `BASE_PRIVATE_KEY`
