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
│    → returns SKILL.md (or generation status)     │
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
- **Payments:** x402 (`@x402/express`, `@x402/evm`) — USDC on Base Mainnet
- **Discovery:** x402 Bazaar (`@x402/extensions`)
- **Storage:** S3-compatible object storage
- **AI SDK:** Vercel AI SDK (`ai`) — model-agnostic, swappable providers
- **LLM (v1):** OpenAI GPT-5 (via `@ai-sdk/openai`)
- **Block explorer:** Basescan/Etherscan API
- **Output format:** [Agent Skills specification](https://agentskills.io/specification.md), code examples use viem

## Generation Pipeline

Three async stages: **Research** (AI agent with tools) → **Generate** (LLM produces SKILL.md) → **Validate** (spec + ABI + safety checks). Validation failure retries Generate (max 2 loops). Progress tracked via SKILL.md status in S3 (`generating` → `ready` | `failed`).

## Key Decisions

- **Status in SKILL.md frontmatter** — no separate database; the SKILL.md file IS the status record
- **Fire-and-forget pipeline** — API returns immediately, caller polls GET for progress
- **Model-agnostic** — Vercel AI SDK abstracts LLM provider; swap by changing one module
- **x402 per-route** — only skill endpoints require payment; health check is free
- **Bazaar registration** — generate endpoint at startup, individual skills after completion

## Hackathon Artifacts

- `agent.json` — machine-readable agent manifest (ERC-8004 identity, tools, endpoints)
