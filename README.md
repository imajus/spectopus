# Spectopus

<img width="256" height="256" alt="IMG_SEGMENT_20260323_001020" src="./assets/logo.png" />

**AI-powered skill generator for smart contracts.** Give it a contract address, get back a ready-to-use [Agent Skill](https://agentskills.io) — a portable SKILL.md file any AI agent can consume. Pay per use via [x402](https://x402.org), no accounts needed.

Built for [The Synthesis](https://synthesis.md) hackathon (Theme: Agents that trust) on Base Mainnet.

## The Problem

AI agents interacting with smart contracts today either hallucinate function signatures (wasting gas), burn context tokens parsing raw ABIs, or simply give up. There's no reliable way to go from a contract address to a working, structured skill an agent can use.

An agent *could* generate skills itself — but it lacks the specialized tools, domain knowledge, and validation pipeline to do it reliably. It's cheaper and faster to pay $0.10 to a specialist agent than to spend tokens and gas figuring it out locally.

## The Solution

Spectopus is an autonomous agent service that researches any smart contract and produces a high-quality Agent Skill — complete with typed function signatures, usage examples, gotchas, and safety warnings. Skills follow an open standard, so there's zero lock-in.

```mermaid
flowchart LR
    A["Agent or Developer"] -->|"POST /skills/generate\n+ $0.10 USDC via x402"| B["Spectopus"]
    B -->|"Returns skill ID"| A
    A -->|"GET /skills/:id\n+ $0.01 USDC via x402"| B
    B -->|"Returns SKILL.md"| A
    B <-->|"Store & retrieve"| S["S3 Storage"]
    B <-->|"Auto-index"| D["x402 Bazaar\n(Discovery)"]
```

## How It Works

The generation pipeline is a fully autonomous AI agent loop — no human in the loop.

```mermaid
flowchart TD
    subgraph Pipeline["Generation Pipeline"]
        R["1. Research\nAI agent with tools"] --> G["2. Generate\nProduce SKILL.md"]
        G --> V["3. Validate\nSpec + ABI + safety checks"]
        V -->|"Pass"| Done["Ready"]
        V -->|"Fail (max 2 retries)"| G
    end

    subgraph Tools["Research Tools"]
        T1["Fetch ABI\n(Basescan)"]
        T2["Fetch Source Code"]
        T3["Detect ERC Patterns\n(ERC-20, 721, 1155...)"]
    end

    R --- T1 & T2 & T3
```

**Research** — An AI agent uses block explorer APIs to fetch the ABI, source code, and detect ERC patterns (ERC-20, 721, 1155, etc.)

**Generate** — An LLM produces a SKILL.md following the Agent Skills spec, with viem code examples

**Validate** — Cross-checks generated functions against the real ABI, runs spec validation, and scans for safety issues. Failures trigger a retry with feedback

## Vision: Beyond Smart Contracts

The PoC targets smart contracts on Base, but the architecture is niche-agnostic. The same research-generate-validate pipeline can produce skills for REST APIs, CLI tools, SDKs, or any domain where an expert agent with the right tools outperforms a generalist doing it from scratch. This makes Spectopus a foundation for a **generic skills marketplace** — with built-in x402 incentivization for builders (humans or AI agents) to contribute and monetize skills.

## Key Strengths

| | |
|---|---|
| **Autonomous end-to-end** | No human intervention — research, generate, validate, deliver |
| **Open standard output** | Agent Skills spec (SKILL.md) — portable, no vendor lock-in |
| **x402 native payments** | Pay-per-use with USDC, no API keys or accounts |
| **Discoverable** | Auto-indexed on x402 Bazaar for agent-to-agent discovery |
| **Safety-first** | Input validation, output scanning, fail-closed validation, prompt injection defenses |
| **Structured logging** | Full execution logs for every pipeline run (tool calls, LLM I/O, decisions) |
| **ERC-8004 identity** | On-chain agent identity on Base Mainnet |

## Architecture

```mermaid
graph TD
    Client["AI Agent / Developer"]
    subgraph Server["Spectopus Server (Express)"]
        MW["x402 Middleware\n(thirdweb facilitator)"]
        Routes["Routes"]
        Guard["Guardrails\n(input validation, output scanning)"]
        Pipeline["Generation Pipeline"]
        Logger["Execution Logger"]
    end
    S3["S3 Storage\n(Cloudflare R2)"]
    Bazaar["x402 Bazaar"]
    Explorer["Basescan API"]
    LLM["LLM Provider\n(GPT-5 via LangChain)"]

    Client --> MW --> Routes
    Routes --> Guard --> Pipeline
    Pipeline --> Explorer
    Pipeline --> LLM
    Pipeline --> Logger
    Pipeline --> S3
    MW --> Bazaar
```

## Tech Stack

- **Runtime:** Node.js (ES modules) + Express
- **Payments:** x402 via thirdweb facilitator — USDC on Base Mainnet
- **AI:** LangChain + LangGraph (ReAct agent) with OpenAI provider (GPT-5)
- **Storage:** S3-compatible (Cloudflare R2)
- **Block Explorer:** Basescan API for ABI/source code
- **Identity:** ERC-8004 on Base Mainnet

## Design Decisions

**S3 storage, no database.** For the PoC, skills are stored as JSON objects in S3-compatible storage (Cloudflare R2) — the skill file IS the status record, no separate DB needed. In production this will be replaced with Filecoin on-chain storage using a self-funded storage economic model, where skill generation fees cover permanent decentralized storage.

**Reputation and validation deferred.** On-chain reputation scoring and community validation for generated skills are natural extensions — the pay-per-use model and open skill format make them a perfect fit. Deferred for time constraints, not design ones.

**Skills published on Bazaar, not ERC-8004.** ERC-8004 is designed for agent identity and trust (Spectopus itself is registered there). For skill discovery, x402 Bazaar is the better fit — it's purpose-built for discovering and paying for services, which is what skills are.

## Demo: Agent-to-Agent Skill Generation

Real conversation between an AI agent (Claude Code with thirdweb MCP) and Spectopus. The agent discovers the Spectopus skill, uses it to generate a skill for BasePaint, and receives a structured result — all paid autonomously via x402.

> **Human:** Generate a skill for BasePaint — collaborative pixel art project native to Base Mainnet. Contract: `0xBa5e05cb26b78eDa3A2f8e3b3814726305dcAc83`

> **Agent:** *Reads the Spectopus SKILL.md from `https://spectopus.majus.app/` to learn available actions and payment details.*

> **Agent:** *Calls `POST /skills/generate` with x402 payment ($0.10 USDC), passing the contract address and context message.*
> ```json
> { "id": "793b50b5-...", "url": "https://spectopus.majus.app/skills/793b50b5-..." }
> ```

> **Agent:** *Polls `GET /skills/:id` with x402 payment ($0.01 USDC). First two attempts return `"status": "processing"`. After ~45 seconds, the skill is ready.*

> **Agent:** The BasePaint skill was generated successfully.
>
> | Action | Function | Notes |
> |---|---|---|
> | Check current day | `today()` | Canvas resets daily |
> | Paint on canvas | `paint(day, tokenId, pixels)` | Requires owning a brush NFT |
> | Mint editions | `mint(day, count)` | Previous day only, payable in ETH |
> | Check contributions | `contribution(day, author)` | Determines artist revenue share |
> | Withdraw earnings | `authorWithdraw(indexes)` | For completed days only |
> | Read balances/URIs | `balanceOf`, `uri` | Standard ERC-1155 |
>
> Key gotchas the skill documents:
> - Minting window is one day only — miss it and it's gone
> - Painting requires an external brush NFT with limited usage
> - `authorWithdraw` only works for days strictly before `today() - 1`
> - Overpayment on mint is not refunded
>
> **Total cost: $0.11 USDC** (generate + fetch). Time: ~2 minutes.

## API Response Example

`GET /skills/:id` returns a JSON object with the skill status and content:

```json
{
  "id": "793b50b5-490e-45f4-a80a-13a602cef023",
  "status": "ready",
  "stage": "validate",
  "contractAddress": "0xBa5e05cb26b78eDa3A2f8e3b3814726305dcAc83",
  "chainId": 8453,
  "content": "---\nname: BasePaint\ndescription: Interact with a daily collaborative ERC-1155 onchain art contract on Base...\nmetadata:\n  contractAddress: \"0xBa5e05cb26b78eDa3A2f8e3b3814726305dcAc83\"\n  chainId: 8453\n  generator: \"spectopus\"\n---\n\n## Overview\n\nBasePaint is a Base Mainnet ERC-1155 collaborative pixel art contract...\n",
  "logUrl": "https://r2.example.com/logs/793b50b5-490e-45f4-a80a-13a602cef023.json?X-Amz-Expires=86400&..."
}
```

| Field | Description |
|---|---|
| `id` | Unique skill identifier (UUID), used in the `GET /skills/:id` URL. |
| `status` | `processing` — pipeline still running. `ready` — skill generated successfully. `failed` — pipeline failed after retries. |
| `stage` | Last completed pipeline stage (`research`, `generate`, `validate`). Shows progress while processing. |
| `contractAddress` | The smart contract address the skill was generated for. |
| `chainId` | EVM chain ID (`8453` = Base Mainnet). |
| `content` | The full SKILL.md text — YAML frontmatter (name, description, contract metadata) + markdown body (overview, functions, code examples, gotchas) conforming to the [Agent Skills spec](https://agentskills.io). Empty string while processing. |
| `logUrl` | Pre-signed S3 URL (24h TTL) to the structured execution log. Present only when `status` is `ready` or `failed`. Contains full pipeline trace: stage transitions, tool calls, LLM inputs/outputs, decisions. |

## Agent Log Example

See [agent_log.json](./agent_log.json).

## Hackathon Tracks

1. **Agent Services on Base** (Base) — Spectopus is a discoverable agent service on Base that accepts x402 micropayments for skill generation. Any agent can find it via Bazaar, pay with USDC, and get a working skill back — no accounts, no API keys, pure agent-to-agent commerce.

2. **Let the Agent Cook** (Protocol Labs) — The generation pipeline is a fully autonomous agent loop: it discovers contract capabilities, plans a research strategy, executes using real tools (block explorer APIs, LLM inference), validates its own output, and retries on failure. Structured execution logs capture every decision and tool call.

3. **Synthesis Open Track** — community track

## Development Logs

The `logs/` directory contains full Claude Code conversation logs (JSONL format) from the development of this project. These are raw, unedited transcripts showing how the entire codebase was built through human-AI collaboration — from initial scaffolding to pipeline implementation to deployment. Useful for understanding design decisions and the iterative development process.

## Links

- [Agent Skills Specification](https://agentskills.io)
- [x402 Payment Standard](https://x402.org)
- [On-chain registration tx](https://basescan.org/tx/0xf0a156cd31094f4e5e36d9bb17a246c3cee19493a668895bc14fa0de1af99f93)
- [Requirements](docs/Requirements.md) | [Specification](docs/Specification.md)
