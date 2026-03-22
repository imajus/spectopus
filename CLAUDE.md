# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Spectopus is an AI-powered agent skill generator for smart contracts. It exposes an HTTP API that generates Agent Skills (SKILL.md files) from smart contract addresses, stores them in S3, serves them behind x402 paywalls, and registers them on x402 Bazaar for discovery.

Built for The Synthesis hackathon (Theme: Agents that trust) targeting Base Mainnet.

## Architecture

Express server with two x402-paywalled endpoints:
- `POST /skills/generate` ($0.10 USDC) — kicks off async 3-stage pipeline, returns skill ID
- `GET /skills/:id` ($0.01 USDC) — returns SKILL.md content (or generation status if in progress)

### Generation Pipeline (async, 3 stages)
1. **Research** — AI agent with tools (fetch ABI, fetch source code, detect ERC patterns) analyzes the contract
2. **Generate** — LLM produces SKILL.md following Agent Skills spec
3. **Validate** — spec validation + ABI cross-check + safety check; retries Stage 2 on failure (max 2 loops)

Pipeline progress is tracked by updating the SKILL.md placeholder in S3. Completed skills are auto-indexed on thirdweb's x402 Bazaar via the thirdweb facilitator during payment settlement.

## Tech Stack

- Node.js + Express + x402 middleware (`@x402/express`, `@x402/evm`)
- thirdweb facilitator (`thirdweb/x402`) — requires `THIRDWEB_SECRET_KEY` + `THIRDWEB_SERVER_WALLET_ADDRESS`
- Vercel AI SDK (`ai`) with swappable providers — currently `@ai-sdk/openai` (GPT-5)
- S3-compatible object storage
- Basescan/Etherscan API for ABI fetching
- x402 Bazaar (`@x402/extensions`) for skill discovery

## x402 / Bazaar Notes

- The Bazaar has no POST registration API — resources are auto-indexed by the facilitator during payment verification
- `declareDiscoveryExtension()` in route configs embeds discovery metadata in 402 responses for the facilitator to catalog
- thirdweb facilitator docs: https://portal.thirdweb.com/x402/facilitator — thirdweb x402 API: https://api.thirdweb.com/llms.txt
- `ThirdwebX402Facilitator` is directly compatible with `x402ResourceServer` from `@x402/express` (no `HTTPFacilitatorClient` wrapper needed)

## Key Documentation

- `docs/Requirements.md` — problem, personas, hackathon tracks, out-of-scope
- `docs/Specification.md` — architecture, API schemas, pipeline details, deployment, artifact schemas (`agent.json`, `agent_log.json`)

## Conventions

- JavaScript (ES modules), not TypeScript
- Use `*.d.ts` files for type definitions (no JSDoc, no `export` in .d.ts)
- Vitest for testing
- Generated skills follow the [Agent Skills specification](https://agentskills.io/specification.md)
- Code examples in generated skills use viem (Base ecosystem standard)
- Spectopus SKILL.md (self-describing skill for agents): `skills/spectopus/SKILL.md`
