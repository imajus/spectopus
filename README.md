# Spectopus

AI-powered agent skill generator for smart contracts. Generates [Agent Skills](https://agentskills.io) (SKILL.md files) from smart contract addresses, serves them behind [x402](https://x402.org) paywalls, and makes them discoverable for AI agents.

Built for [The Synthesis](https://synthesis.md) hackathon (Theme: Agents that trust), targeting Base Mainnet.

## How it works

1. Pay $0.10 USDC via x402 to `POST /skills/generate` with a contract address
2. Spectopus researches the contract (ABI, source code, ERC patterns) and generates a SKILL.md
3. Pay $0.01 USDC via x402 to `GET /skills/:id` to retrieve the generated skill

## Tech Stack

- Node.js + Express + `x402-express` middleware
- Thirdweb facilitator (`thirdweb/x402`) for x402 payment settlement
- Vercel AI SDK with OpenAI provider
- S3-compatible storage (Cloudflare R2)

## Design Decisions

### Thirdweb facilitator over CDP facilitator

We switched from the Coinbase CDP facilitator (`@coinbase/x402`) to the thirdweb facilitator (`thirdweb/x402`). The CDP facilitator depends on the CDP SDK which requires native crypto modules that fail to build in Claude Code on Linux. The thirdweb facilitator is pure JS and works everywhere.

### Discovery: Thirdweb Nexus (manual registration required)

There are two x402 service discovery systems:

- **CDP Bazaar** — auto-indexes services during payment settlement via the CDP facilitator. Since we use the thirdweb facilitator, this path is unavailable.
- **Thirdweb Nexus** — requires explicit registration via the [Nexus dashboard](https://nexus.thirdweb.com/dashboard). Services appear in the `listPayableServices` API after registration.

Our endpoints are not yet registered on Nexus. To register, add both endpoints at https://nexus.thirdweb.com/dashboard with the server wallet `0xa00587F64801a2D74F4122bd6C94A75333283608` on Base Mainnet.
