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

### Pipeline Guardrails
- `src/guardrails.js` — central utility: `isValidAddress` (regex), `sanitizeMessage` (strip control chars, 500-char limit), `scanOutput` (blocklist check)
- Input validation at route level: address format (400 on invalid), message sanitization, 16kb body size limit
- `contractAddress` URL-encoded in Blockscout API calls (`encodeURIComponent`)
- User data wrapped in XML delimiter tags in prompts (`<contract_address>`, `<user_message>`) with anti-injection system instructions
- Validation LLM failures are fail-closed (`valid: false`) not fail-open
- Output scanned via `scanOutput()` before `markReady()` — throws on blocked patterns

### Execution Logging
Each pipeline run creates a structured log via `src/pipeline/logger.js` (`createLogger(skillId, contractAddress)`). The logger accumulates stage transitions, decisions, tool calls, LLM inputs/outputs, and errors in memory, then writes to S3 at `logs/{skillId}.json` on `flush()`. `GET /skills/:id` includes a `logUrl` (24h presigned S3 URL) when status is `ready` or `failed`.

Logger methods: `startStage(name)`, `endStage(result)`, `logDecision(message)`, `logToolCall(tool, input)`, `logLLMCall(label, input, output)`, `flush(status, error?)`.

LLM calls are logged per stage: `research-agent` (full ReAct message chain including tool calls/results), `generate`, `validate-abi`, `validate-safety`. Each stage function (`runResearch`, `runGenerate`, `runValidate`) accepts an optional `logger` parameter — pass it from `runPipeline` so calls are captured.

## Tech Stack

- Node.js + Express + `x402-express` middleware (Coinbase v1, compatible with thirdweb)
- thirdweb facilitator (`thirdweb/x402`) — requires `THIRDWEB_SECRET_KEY` + `THIRDWEB_SERVER_WALLET_ADDRESS`
- Vercel AI SDK (`ai`) with swappable providers — currently `@ai-sdk/openai` (GPT-5)
- S3-compatible object storage (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`)
- Basescan/Etherscan API for ABI fetching

## x402 / Bazaar Notes

- The Bazaar has no POST registration API — resources are auto-indexed by the facilitator during payment settlement
- thirdweb facilitator docs: https://portal.thirdweb.com/x402/facilitator — thirdweb x402 API: https://api.thirdweb.com/llms.txt
- **Do NOT use `@x402/express` with the thirdweb facilitator** — `@x402/core` v2.7.0 uses x402Version:2 but thirdweb API returns x402Version:1 (incompatible)
- Use `x402-express` (Coinbase v1) instead: `paymentMiddleware(payToAddress, routes, thirdwebFacilitator)`
- `x402-express` route format: `{ price: '$0.10', network: 'base', config: { description: '...' } }` — NOT `{ accepts: {...} }`
- `x402-express` dynamic path segments: use `[id]` not `:id` in route patterns (Express routing still uses `/:id`)

## Key Documentation

- `docs/Requirements.md` — problem, personas, hackathon tracks, out-of-scope
- `docs/Specification.md` — architecture, API schemas, pipeline details, deployment, artifact schemas (`agent.json`, `agent_log.json`)

## External References

- [x402 — Open Payment Standard](https://docs.x402.org/introduction.md)
- [x402 Bazaar — Discovery Layer](https://docs.x402.org/extensions/bazaar.md)
- [Agent Skills Specification](https://agentskills.io/llms.txt)
- [Thirdweb Documentation](https://portal.thirdweb.com/llms.txt)

## Conventions

- JavaScript (ES modules), not TypeScript
- Use `*.d.ts` files for type definitions (no JSDoc, no `export` in .d.ts)
- Vitest for testing
- Generated skills follow the [Agent Skills specification](https://agentskills.io/specification.md)
- Code examples in generated skills use viem (Base ecosystem standard)
- Spectopus SKILL.md (self-describing skill for agents): `skills/spectopus/SKILL.md`
