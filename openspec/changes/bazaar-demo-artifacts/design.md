## Context

x402 Bazaar is the discovery layer where agents find services. Spectopus must register its endpoints there. The demo script is both a hackathon deliverable and a proof that the system works end-to-end. `agent.json` is a static manifest required by hackathon tracks.

## Goals / Non-Goals

**Goals:**
- Automatic Bazaar registration at startup (generate endpoint) and after each successful generation (individual skill endpoints)
- Working demo script that an agent can run to discover and download skills
- Complete `agent.json` for hackathon submission

**Non-Goals:**
- No Bazaar deregistration or cleanup
- No agent_log.json changes (already handled in pipeline CR)

## Decisions

**Bazaar module** — `src/bazaar.js` exports `registerGenerateEndpoint()` and `registerSkillEndpoint(id, metadata)`. Uses `@x402/extensions` Bazaar client.

**Startup registration** — `src/index.js` calls `registerGenerateEndpoint()` after the server starts listening. Non-blocking — server starts even if Bazaar registration fails (log warning).

**Post-generation registration** — Pipeline orchestrator calls `registerSkillEndpoint()` after storing the final SKILL.md. Includes contract address, chain ID, and description in Bazaar metadata.

**Demo script** — `scripts/demo.js` is a standalone Node.js script. Uses `withBazaar` from `@x402/extensions` to query Bazaar, list skills, and fetch one. Requires a funded wallet for x402 payments.

**Static agent.json** — Committed to repo root. Contains agent name, operator wallet, ERC-8004 identity, tools, tech stack, and endpoints. Manually maintained.

## Risks / Trade-offs

**Bazaar API may change** → Using `@x402/extensions` abstracts this. Track package updates.

**Demo requires funded wallet** → Document wallet funding in demo instructions.
