## Why

The core value of Spectopus is the 3-stage pipeline that transforms a contract address into a high-quality Agent Skill. This pipeline orchestrates the research tools, LLM calls, and validation logic into an autonomous workflow that runs asynchronously after a generation request.

## What Changes

- Implement Stage 1 (Research): AI agent loop using Vercel AI SDK `generateText` with research tools to analyze the contract
- Implement Stage 2 (Generate): LLM call to produce SKILL.md from research output, following Agent Skills spec
- Implement Stage 3 (Validate): Spec validation (frontmatter check), ABI cross-check (LLM), safety check (LLM)
- Implement retry logic: on validation failure, feed errors back to Stage 2 (max 2 retries)
- Implement pipeline orchestrator that sequences stages and updates S3 status between stages
- Implement execution logging for agent_log.jsonl

## Capabilities

### New Capabilities
- `research-stage`: AI agent loop that uses research tools to analyze a smart contract
- `generate-stage`: LLM call that produces SKILL.md from research output
- `validate-stage`: Multi-check validation with retry feedback loop
- `pipeline-orchestrator`: Sequences the 3 stages, manages retries, updates S3 status, writes execution logs

### Modified Capabilities

(none)

## Impact

- New files: `src/pipeline/research.js`, `src/pipeline/generate.js`, `src/pipeline/validate.js`, `src/pipeline/index.js`, `src/pipeline/logger.js`
- New dependency: `@ai-sdk/openai` (LLM provider)
- Depends on: research tools (CR2), storage layer (CR3)
- New env vars: `OPENAI_API_KEY`
