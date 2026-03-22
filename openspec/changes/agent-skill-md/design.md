## Context

Spectopus is an AI-powered skill generator for smart contracts, deployed on Base Mainnet. It exposes two x402-paywalled HTTP endpoints (`POST /skills/generate`, `GET /skills/:id`) and auto-indexes generated skills on x402 Bazaar. The project needs its own SKILL.md so AI agents can discover and use it following the Agent Skills specification.

## Goals / Non-Goals

**Goals:**
- Create a valid SKILL.md per the Agent Skills spec (YAML frontmatter + markdown body)
- Document three agent workflows: generate, explore (Bazaar discovery), install (download + save)
- Provide ready-to-use code examples with `fetch` for HTTP calls and `@x402/extensions/bazaar` for discovery

**Non-Goals:**
- x402 payment flow details (out of scope per user request)
- Modifying any existing source code
- Creating additional skill support files (scripts/, references/, assets/)

## Decisions

1. **Location: `skills/spectopus/SKILL.md`** — The spec requires `name` to match the parent directory. Using a `skills/` top-level directory keeps skills organized and separate from source code.

2. **Code examples use plain `fetch`** — The API is standard REST. No need for specialized HTTP libraries. This keeps examples accessible to any JS-based agent. For Bazaar exploration, reference the `@x402/extensions/bazaar` client as shown in the existing `scripts/demo.js`.

3. **Three-section body structure (Generate / Explore / Install)** — Maps directly to the user's stated capabilities. Each section includes endpoint details, request/response formats, and a code snippet.

4. **Mention x402 without detailing it** — A note that endpoints may return HTTP 402 and require payment keeps agents informed without going into payment mechanics.

## Risks / Trade-offs

- [Bazaar API may change] → Code examples reference `@x402/extensions/bazaar` which is pre-1.0. Keep examples minimal so updates are easy.
- [Skill may become stale if API changes] → The skill references the same endpoints defined in `agent.json` and `src/routes/skills.js`, so changes there should trigger a skill update.
