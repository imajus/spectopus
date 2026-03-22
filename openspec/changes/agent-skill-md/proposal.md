## Why

Spectopus generates Agent Skills for smart contracts but lacks its own SKILL.md, so AI agents cannot discover or invoke it. Creating a skill file following the Agent Skills specification lets other agents use Spectopus to generate, explore, and install web3 protocol skills autonomously.

## What Changes

- Add `skills/spectopus/SKILL.md` describing three capabilities: generate a skill from a contract address, explore available skills on x402 Bazaar, and install (download) a generated skill
- Skill file follows the [Agent Skills specification](https://agentskills.io/specification.md) with proper YAML frontmatter and markdown body
- x402 payment details are out of scope — the skill mentions endpoints may require payment but does not detail the payment flow

## Capabilities

### New Capabilities
- `agent-skill`: SKILL.md file for Spectopus covering generate/explore/install capabilities, with API usage examples and code snippets

### Modified Capabilities
<!-- None -->

## Impact

- New file: `skills/spectopus/SKILL.md`
- No code changes — this is a documentation/metadata artifact only
- Enables agent discovery of Spectopus via the Agent Skills ecosystem
