# Spectopus — Project Requirements

> AI-powered agent skill generator for smart contracts.
> Built for The Synthesis hackathon (Theme 2: Agents that trust).

## Problem

AI agents need to interact with smart contracts but lack reliable, structured knowledge about how to do so. Currently they either:

- Waste context tokens parsing raw ABIs and docs with unreliable results
- Hallucinate function signatures, causing failed transactions and wasted gas
- Ask the human for help, defeating the purpose of autonomy
- Give up entirely

Agents could generate skills themselves, but it takes time, domain knowledge, and specialized tools. Spectopus provides a cheaper, faster, higher-quality alternative — and builds a growing library of reusable skills that other agents can purchase.

## Target Persona

**Primary: Autonomous AI agents** acting on behalf of developers or end-users.

- Mid-task, encounters a contract it doesn't know how to use
- Needs a working skill immediately, without human intervention
- Pays programmatically via x402 (no accounts, no API keys)
- Context window is precious — needs concise, reliable instructions

**Secondary: Developers** building agent-powered applications.

- Needs skills for multiple contracts, writing each manually takes hours
- Wants predictable quality and cost savings ($0.10/skill vs hours of work)

### Pain Points

- No reliable way to go from "contract address" to "working agent skill"
- Raw ABIs are structured but lack usage context, gotchas, and patterns
- Every failed contract call costs real gas
- No standardized discovery mechanism for agent skills

### Potential Blockers

- A bad skill causes the agent to drain the user's wallet
- Paying for a skill that doesn't actually work
- Platform lock-in (skills should be portable, open-format files)

### What Wins Them Over

- Output is open standard (Agent Skills spec) — no lock-in
- Skills are concise and context-efficient (< 500 lines, < 5000 tokens)
- Generated skills include gotchas, safety warnings, and tested code examples
- Pay-per-use via x402 — no subscriptions, no accounts

## External References

- [x402 — Open Payment Standard](https://docs.x402.org/introduction.md)
- [x402 Bazaar — Discovery Layer](https://docs.x402.org/extensions/bazaar.md)
- [Agent Skills Specification](https://agentskills.io/llms.txt)

## Solution

An HTTP API server that:

1. **Generates** Agent Skills (SKILL.md) from smart contract addresses via a multi-stage AI pipeline
2. **Stores** generated skills in S3-compatible object storage
3. **Serves** skills behind x402 paywalls
4. **Registers** each generated skill on x402 Bazaar for discovery by other agents

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

## API Endpoints

### POST /skills/generate

Generates a new Agent Skill from a smart contract address. Returns immediately; generation runs asynchronously.

**Payment:** $0.10 USDC via x402 (Base Sepolia for PoC).

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
- On completion: replaces placeholder with final SKILL.md and registers `GET /skills/<id>` on Bazaar

### GET /skills/:id

Downloads a previously generated Agent Skill.

**Payment:** $0.01 USDC via x402 (Base Sepolia for PoC).

**Response (200):** SKILL.md content (`text/markdown`).

If generation is still in progress, the response contains a status document instead of the final skill:

```markdown
---
name: pending-skill
description: "Skill generation in progress"
metadata:
  status: "generating"
  stage: "research"
  contractAddress: "0x..."
  chainId: "84532"
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

Generated SKILL.md follow the [Agent Skills specification](https://agentskills.io/specification.md).

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

## Technology Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Payments:** x402 (Express middleware, `@x402/express`, `@x402/evm`)
- **Discovery:** x402 Bazaar (`@x402/extensions`)
- **Storage:** S3-compatible object storage (e.g. Cloudflare R2 or MinIO)
- **LLM:** Claude (via Anthropic SDK) for generation and validation stages
- **Block explorer API:** Basescan/Etherscan API for ABI and source code fetching
- **Network:** Base Sepolia (testnet) only for PoC

## Payment Configuration

- **Network:** Base Sepolia (`eip155:84532`)
- **Token:** USDC (testnet)
- **Facilitator:** `https://x402.org/facilitator` (testnet)
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

## Demo / Onboarding

Ship a demo script (or onboarding skill) that uses `withBazaar` from `@x402/extensions` to:

1. Query x402 Bazaar for Spectopus skills
2. Browse available skills by contract/description
3. Purchase and download a skill

This demonstrates the full agent journey: discover → evaluate → pay → use.

## Hackathon Context

- **Hackathon:** The Synthesis (synthesis.md)
- **Theme:** Agents that trust — open discovery, verifiable service quality, portable agent credentials
- **Agent identity:** Spectopus, registered via ERC-8004 on Base Mainnet
- **Agent harness:** Claude Code
- **Model:** claude-sonnet-4-6
- **Participant ID:** cf5b792c0b414a84a93ebbaccd7ab392
- **Team ID:** dd3f4200c4834220b99b671793469eb4

## Out of Scope (for PoC)

- Base Mainnet deployment (testnet only)
- Support for other chains except Base Sepolia/Mainnet
- Support for HTTP APIs, local tools, or other protocol types
- Custom skill catalog / search endpoint (Bazaar handles discovery)
- On-chain skill registry or attestations
- Rating / reputation system
- Skill versioning or updates
- GUI / dashboard
- Subscription or tiered pricing
- Extra skill artifacts (resources, etc)
