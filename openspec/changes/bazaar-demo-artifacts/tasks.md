## 1. Bazaar Integration

- [x] 1.1 Install `@x402/extensions`
- [x] 1.2 Create `src/bazaar.js` — export `registerGenerateEndpoint()` and `registerSkillEndpoint(id, metadata)`
- [x] 1.3 Add `BAZAAR_URL` to `.env.example` (optional, default: `https://bazaar.x402.org`)
- [x] 1.4 Call `registerGenerateEndpoint()` in `src/index.js` after server starts (non-blocking, log warning on failure)
- [x] 1.5 Call `registerSkillEndpoint()` in pipeline orchestrator after successful completion

## 2. Demo Script

- [x] 2.1 Create `scripts/demo.js` — standalone script using `withBazaar` to discover Spectopus skills on Bazaar
- [x] 2.2 Add skill listing: query Bazaar, print descriptions, contract addresses, pricing
- [x] 2.3 Add skill purchase: select first result, make x402 payment, download and print SKILL.md content
- [x] 2.4 Document demo prerequisites (funded wallet, running server) in script comments

## 3. Hackathon Artifacts

- [x] 3.1 Create `agent.json` at repo root with agent name, description, operator wallet, ERC-8004 identity, tools, tech stack, endpoints
