# Spectopus — Technical Specification

> Core architectural decisions for the Spectopus skill generation service.
> Implementation details live in [OpenSpec changes](../openspec/changes/).
> Derived from [Requirements](./Requirements.md).

## Architecture

```
┌──────────────────────────────────────────────────┐
│                Spectopus Server                  │
│              (Express + x402 middleware)          │
│                                                  │
│  POST /skills/generate ── $0.10 USDC via x402   │
│    → kicks off async generation pipeline         │
│    → returns { id, url } immediately             │
│    → on completion: registers skill on Bazaar    │
│                                                  │
│  GET /skills/:id ───────── $0.01 USDC via x402   │
│    → returns JSON with skill content or status   │
│                                                  │
│  Both endpoints registered in x402 Bazaar        │
│  for discovery by any agent.                     │
└──────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
   S3-compatible              x402 Bazaar
   object storage          (discovery layer)
```

## Technology Stack

- **Runtime:** Node.js (ES modules)
- **Framework:** Express
- **Payments:** `x402-express` (Coinbase v1, compatible with thirdweb facilitator) — USDC on Base Mainnet
- **Discovery:** x402 Bazaar (auto-indexed by thirdweb facilitator during payment settlement)
- **Storage:** S3-compatible object storage (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
- **AI:** LangChain (`@langchain/core`, `@langchain/openai`) + LangGraph (`@langchain/langgraph`) for ReAct agent
- **LLM:** OpenAI GPT-5
- **Block explorer:** Blockscout API v2 (free, no API key required)
- **Output format:** [Agent Skills specification](https://agentskills.io/specification.md), code examples use viem

## Generation Pipeline

Three async stages: **Research** (LangGraph ReAct agent with tools) → **Generate** (LLM produces SKILL.md) → **Validate** (spec + ABI cross-check + safety check). Validation failure retries Generate (max 2 loops). Progress tracked via JSON status in S3 (`generating` → `ready` | `failed`).

### Research Tools
- `fetchABI(contractAddress)` — fetches parsed ABI JSON from Blockscout API v2
- `fetchSourceCode(contractAddress)` — fetches verified source code from Blockscout
- `detectERCPatterns(abi)` — identifies ERC-20, ERC-721, ERC-1155, and other standards from ABI signatures

### Storage Format
Skills are stored as JSON files (`skills/{id}.json`) in S3 with structured status/content fields. The `GET /skills/:id` endpoint returns `application/json`.

### Execution Logging
Each pipeline run creates a structured log via `src/pipeline/logger.js`. The logger accumulates stage transitions, decisions, tool calls, LLM inputs/outputs, and errors in memory, then writes to S3 at `logs/{skillId}.json`. `GET /skills/:id` includes a `logUrl` (24h presigned S3 URL) when status is `ready` or `failed`.

### Guardrails
- Input validation: address format check (400 on invalid), message sanitization (control char stripping, 500-char limit), 16kb body size limit
- Prompt safety: user data wrapped in XML delimiter tags (`<contract_address>`, `<user_message>`), anti-injection system instructions
- Output sanitization: `scanOutput()` checks for blocked patterns before storing
- Validation failures are fail-closed (not fail-open)
- `contractAddress` URL-encoded in Blockscout API calls

## Key Decisions

- **JSON storage, no database** — skill status and content stored as JSON in S3; no separate database
- **Fire-and-forget pipeline** — API returns immediately, caller polls GET for progress
- **LangChain over Vercel AI SDK** — migrated due to critical multi-step tool-calling bugs in `ai@6`; LangGraph ReAct agent handles the research loop reliably
- **Blockscout over Etherscan** — Etherscan V1 API deprecated, V2 requires paid plan for Base; Blockscout is free with no API key
- **Coinbase x402 v1 over @x402/core v2** — thirdweb facilitator returns x402Version:1, incompatible with `@x402/core` v2.7.0's x402Version:2
- **x402 per-route** — only skill endpoints require payment; health check is free
- **Bazaar auto-indexed** — no POST registration API; thirdweb facilitator indexes resources during payment settlement

## Hackathon Artifacts

- `agent.json` — machine-readable agent manifest (ERC-8004 identity, tools, endpoints)
- `logs/{skillId}.json` — structured execution logs per pipeline run (stage transitions, tool calls, LLM I/O, errors)
- `skills/spectopus/SKILL.md` — self-describing Agent Skill for Spectopus itself (generate/explore/install capabilities)
