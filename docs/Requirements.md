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

See [Specification](./Specification.md) for architecture, API details, pipeline stages, and deployment.

## Hackathon Context

- **Hackathon:** The Synthesis (synthesis.md)
- **Theme:** Agents that trust — open discovery, verifiable service quality, portable agent credentials
- **Agent identity:** Spectopus, registered via ERC-8004 on Base Mainnet
- **Agent harness:** Claude Code
- **Model:** claude-sonnet-4-6
- **Participant ID:** cf5b792c0b414a84a93ebbaccd7ab392
- **Team ID:** dd3f4200c4834220b99b671793469eb4

## Target Tracks

### 1. Agent Services on Base (Base) — Primary

> Build an agent service (an agent that provides services to other agents or humans) which can be easily discovered on Base and accepts payments via x402 for its services. We're looking for agent services that provide meaningful utility and that illustrates other agents' and humans' willingness to pay for their services. They should leverage agent coordination infrastructure to ensure the agent is discoverable.

**Why it fits:** Spectopus is exactly this — a discoverable agent service on Base that generates skills for other agents, accepts x402 payments, and registers on Bazaar for discovery. Zero changes needed.

**What judges want to see:**
- Discoverable via agent coordination infrastructure (x402 Bazaar)
- Accepts x402 payments for services
- Provides meaningful utility to other agents/humans
- Demonstrates willingness to pay (real value proposition)

### 2. Let the Agent Cook — No Humans Required (Protocol Labs)

> Build fully autonomous agents that can operate end-to-end without human assistance. Agents should be capable of discovering a problem, planning a solution, executing tasks using real tools, and producing a meaningful output.

**Why it fits:** The generation pipeline IS an autonomous agent loop — research → generate → validate, using real tools (block explorer APIs, LLM inference), with safety guardrails (validation stage) and ERC-8004 identity.

**Required capabilities (and how we meet them):**
1. Autonomous Execution — full decision loop: discover contract → research ABI → generate skill → validate → deliver
2. Agent Identity — ERC-8004 identity already registered on Base Mainnet
3. Agent Capability Manifest — provide `agent.json` with agent name, operator wallet, ERC-8004 identity, supported tools, tech stack
4. Structured Execution Logs — provide `agent_log.json` showing pipeline decisions, tool calls, retries, failures, and outputs
5. Tool Use — block explorer API, LLM inference, S3 storage, x402 Bazaar registration; multi-tool orchestration
6. Safety and Guardrails — validation stage cross-checks generated code against ABI, spec validation, retry loop with max attempts
7. Compute Budget Awareness — bounded LLM calls (max 2 validation retries), pipeline timeout

**Judging criteria:** Autonomy (35%), Tool Use (25%), Guardrails & Safety (20%), Impact (15%), ERC-8004 Integration (Bonus 5%)

**Extra deliverables needed:**
- `agent.json` — machine-readable agent manifest
- `agent_log.json` — structured execution logs from pipeline runs

### 3. Agents With Receipts — ERC-8004 (Protocol Labs)

> Build agents that can be trusted. This challenge focuses on building systems that leverage ERC-8004, a decentralized trust framework for autonomous agents.

**Why it fits:** Spectopus is an agent marketplace where agents can discover skills based on verifiable on-chain identity. Each generated skill is tied to Spectopus's ERC-8004 identity — a verifiable receipt of agent work.

**Required capabilities (and how we meet them):**
1. ERC-8004 Integration — Spectopus registered with ERC-8004 identity on Base; generated skills metadata references this identity
2. Autonomous Agent Architecture — planning (research), execution (generation), verification (validation), decision loops (retry on failure)
3. Agent Identity + Operator Model — ERC-8004 identity linked to operator wallet, reputation through quality of generated skills
4. Onchain Verifiability — registration transaction on Base, potentially skill generation receipts
5. DevSpot Agent Compatibility — provide `agent.json` and `agent_log.json`

**Example project ideas from track description that align with Spectopus:**
- "Agent Marketplace: A marketplace where agents can be discovered based on reputation and verified skills"
- "Agent Validation Workflows: A system that allows third parties to verify an agent's capabilities through transparent attestations"

**Extra deliverables needed:**
- `agent.json` — DevSpot agent manifest
- `agent_log.json` — structured execution logs
- Demonstrate ERC-8004 registry interactions (identity, optionally reputation)

### 4. Synthesis Open Track (Synthesis Community) — Bonus

> A community-funded open track. Judges contribute to the prize pool.

**Why submit:** No requirements beyond building something good. Free to enter alongside other tracks.

## Out of Scope (for PoC)

- Support for other chains except Base Mainnet
- Support for HTTP APIs, local tools, or other protocol types
- Custom skill catalog / search endpoint (Bazaar handles discovery)
- On-chain skill registry or attestations
- Rating / reputation system
- Skill versioning or updates
- GUI / dashboard
- Subscription or tiered pricing
- Extra skill artifacts (resources, etc)
