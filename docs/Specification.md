# Spectopus — Technical Specification

> Implementation specification for the Spectopus skill generation service.
> Derived from [Requirements](./Requirements.md).

## Architecture

```
┌──────────────────────────────────────────────────┐
│                Spectopus Server                  │
│              (Express + x402 middleware)          │
│                                                  │
│  POST /skills/generate ── $0.10 USDC via x402   │
│    → creates placeholder in S3 (status: pending) │
│    → kicks off generation pipeline (async)       │
│    → returns { id, url } immediately             │
│    → pipeline updates S3 file with progress      │
│    → on completion: registers skill on Bazaar    │
│                                                  │
│  GET /skills/:id ───────── $0.01 USDC via x402   │
│    → fetches SKILL.md from S3                    │
│    → returns content (may include status if      │
│      generation is still in progress)            │
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

- **Runtime:** Node.js
- **Framework:** Express
- **Payments:** x402 (Express middleware, `@x402/express`, `@x402/evm`)
- **Discovery:** x402 Bazaar (`@x402/extensions`)
- **Storage:** S3-compatible object storage (e.g. Cloudflare R2 or MinIO)
- **AI SDK:** Vercel AI SDK (`ai`) — model-agnostic, swappable providers
- **LLM:** OpenAI GPT-5 (via `@ai-sdk/openai`)
- **Block explorer API:** Basescan/Etherscan API for ABI and source code fetching
- **Network:** Base (Mainnet) only for PoC

## API Endpoints

### POST /skills/generate

Generates a new Agent Skill from a smart contract address. Returns immediately; generation runs asynchronously.

**Payment:** $0.10 USDC via x402 (Base).

**Request body:**
```json
{
  "contractAddress": "0x...",
  "chainId": 84532,
  "message": "Optional information about intent or anything extra that may be relevant"
}
```

**Response (200):**
```json
{
  "id": "<random-hash>",
  "url": "https://spectopus.com/skills/<random-hash>"
}
```

**Side effects:**
- Creates a placeholder SKILL.md in S3 with generation status (see below)
- Kicks off the generation pipeline asynchronously
- Pipeline updates the SKILL.md file in S3 as it progresses through stages
- On completion: replaces placeholder with final SKILL.md and registers `https://spectopus.com/skills/<id>` on Bazaar

### GET /skills/:id

Downloads a previously generated Agent Skill.

**Payment:** $0.01 USDC via x402 (Base).

**Response (200):** SKILL.md content (`text/markdown`).

If generation is still in progress, the response contains a status document instead of the final skill:

```markdown
---
name: pending-skill
description: "Skill generation in progress"
---

# Generating skill...

## Current stage: Research

Fetching ABI and analyzing contract...
```

The `metadata.status` field indicates the current state:
- `generating` — pipeline is running, `metadata.stage` shows current stage (`research`, `generate`, `validate`)
- `ready` — generation complete, content is the final SKILL.md
- `failed` — generation failed, body contains error details

Callers can poll `GET /skills/:id` to check progress. No callbacks or webhooks needed.

**Response (404):** Skill not found.

## Generation Pipeline

Three-stage pipeline running asynchronously after `/skills/generate` returns. Each stage updates the SKILL.md placeholder in S3 with current progress.

### Stage 1: Research (AI agent with deterministic tools)

Tools available to the agent:
- **Fetch ABI** — from block explorer API (Basescan/Etherscan) by contract address + chain ID
- **Fetch verified source code** — from block explorer if available
- **Detect ERC patterns** — identify known standards (ERC-20, ERC-721, ERC-1155, etc.) from function signatures

The LLM analyzes tool outputs to:
- Identify key user-facing functions vs internal/admin functions
- Recognize common patterns (approve+transferFrom, swap routes, etc.)
- Note potential gotchas (payable functions, reentrancy patterns, approval requirements)
- Understand the contract's purpose and typical usage flows

### Stage 2: Generate (LLM)

System prompt includes:
- Agent Skills specification (frontmatter format, directory structure, best practices)
- Smart contract skill template with recommended sections

Input: structured research output from Stage 1.

Output: complete SKILL.md following the Agent Skills spec, including:
- Correct frontmatter (name, description)
- Step-by-step instructions for key functions
- Code examples using viem (Base ecosystem standard)
- Gotchas section with contract-specific warnings
- Reference to ABI (bundled or inline)

### Stage 3: Validate (LLM + script)

- **Spec validation:** run `skills-ref validate` against generated SKILL.md (if available, otherwise validate frontmatter programmatically)
- **ABI cross-check (LLM):** verify that code examples reference real function signatures, correct parameter types, and proper return values from the ABI
- **Safety check (LLM):** ensure skill includes warnings for payable functions, approval patterns, and potential footguns

If validation fails, feed errors back to Stage 2 and retry (max 2 loops).

## Output Format

Generated SKILL.md follows the [Agent Skills specification](https://agentskills.io/specification.md).

### SKILL.md Structure

```markdown
---
name: <contract-name>
description: <what it does and when to use it>
metadata:
  contractAddress: "0x..."
  chainId: "84532"
  generator: "spectopus"
---

# <Contract Name>

## When to use this skill
...

## Setup
...

## Key functions

### <function-name>
...

## Gotchas
...
```

## Payment Configuration

- **Network:** Base Mainnet (`eip155:8453`)
- **Token:** USDC
- **Facilitator:** `https://x402.org/facilitator`
- **Pricing:**
  - Skill generation: $0.10
  - Skill download: $0.01

## x402 Bazaar Integration

Both endpoints are registered in Bazaar with `discoverable: true`:

- `POST /skills/generate` — registered at server startup
- `GET /skills/:id` — registered dynamically after each successful generation

Each dynamically registered skill includes Bazaar metadata:
- Description of what the skill covers
- Target contract address and chain ID
- Input/output schema

## Demo Script

Ship a demo script (or onboarding skill) that uses `withBazaar` from `@x402/extensions` to:

1. Query x402 Bazaar for Spectopus skills
2. Browse available skills by contract/description
3. Purchase and download a skill

This demonstrates the full agent journey: discover → evaluate → pay → use.

## Deployment

### Environment Variables

| Variable | Description | Required |
|---|---|---|
| `PORT` | Server listen port | No (default: `3000`) |
| `AI_PROVIDER` | AI SDK provider (`openai`, `anthropic`, etc.) | No (default: `openai`) |
| `OPENAI_API_KEY` | OpenAI API key (when using OpenAI provider) | Yes* |
| `ETHERSCAN_API_KEY` | Basescan/Etherscan API key for ABI fetching | Yes |
| `S3_ENDPOINT` | S3-compatible storage endpoint URL | Yes |
| `S3_BUCKET` | S3 bucket name for skill storage | Yes |
| `S3_ACCESS_KEY` | S3 access key ID | Yes |
| `S3_SECRET_KEY` | S3 secret access key | Yes |
| `S3_REGION` | S3 region | No (default: `auto`) |
| `WALLET_PRIVATE_KEY` | Server wallet private key for x402 payment receiving | Yes |
| `BASE_URL` | Public base URL of the server (for skill URLs and Bazaar registration) | Yes |
| `BAZAAR_URL` | x402 Bazaar endpoint URL | No (default: `https://bazaar.x402.org`) |

### Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "src/index.js"]
```

### Running Locally

```sh
cp .env.example .env
# Fill in environment variables
npm install
npm start
```

## Artifacts

### agent.json

Machine-readable agent manifest required by hackathon tracks 2 and 3.

```json
{
  "name": "Spectopus",
  "description": "AI-powered agent skill generator for smart contracts",
  "operator": {
    "wallet": "<operator-wallet-address>"
  },
  "identity": {
    "standard": "ERC-8004",
    "chain": "base",
    "registrationTx": "0xf0a156cd31094f4e5e36d9bb17a246c3cee19493a668895bc14fa0de1af99f93"
  },
  "tools": [
    "block-explorer-api",
    "llm-inference",
    "s3-storage",
    "x402-bazaar"
  ],
  "techStack": {
    "runtime": "node.js",
    "framework": "express",
    "aiSdk": "vercel-ai-sdk",
    "llm": "openai-gpt-5",
    "payments": "x402"
  },
  "endpoints": {
    "generate": "POST /skills/generate",
    "download": "GET /skills/:id"
  }
}
```

### agent_log.json

Structured execution logs emitted by each pipeline run. Each log entry captures pipeline decisions, tool calls, retries, failures, and outputs.

```json
{
  "runId": "<uuid>",
  "skillId": "<hash>",
  "contractAddress": "0x...",
  "chainId": 84532,
  "startedAt": "<iso-timestamp>",
  "completedAt": "<iso-timestamp>",
  "status": "success | failed",
  "stages": [
    {
      "name": "research",
      "startedAt": "<iso-timestamp>",
      "completedAt": "<iso-timestamp>",
      "toolCalls": [
        {
          "tool": "fetch-abi",
          "input": { "contractAddress": "0x...", "chainId": 84532 },
          "output": { "functionCount": 12, "eventCount": 4 },
          "durationMs": 340
        }
      ],
      "decisions": ["Identified as ERC-20 token", "Found 5 user-facing functions"]
    },
    {
      "name": "generate",
      "startedAt": "<iso-timestamp>",
      "completedAt": "<iso-timestamp>",
      "llmCalls": 1,
      "tokensUsed": { "input": 3200, "output": 2800 }
    },
    {
      "name": "validate",
      "startedAt": "<iso-timestamp>",
      "completedAt": "<iso-timestamp>",
      "checks": [
        { "check": "spec-validation", "passed": true },
        { "check": "abi-cross-check", "passed": true },
        { "check": "safety-check", "passed": true }
      ],
      "retries": 0
    }
  ]
}
```

Logs are appended to a `logs/agent_log.jsonl` file (one JSON object per line).
