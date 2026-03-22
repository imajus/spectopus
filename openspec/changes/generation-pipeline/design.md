## Context

The pipeline runs asynchronously — it's kicked off by the API endpoint and runs in the background, updating S3 as it progresses. It depends on research tools (CR2) and S3 storage (CR3). The LLM provider is OpenAI GPT-5 via Vercel AI SDK, but the abstraction allows easy swapping.

## Goals / Non-Goals

**Goals:**
- 3-stage pipeline: research → generate → validate
- Retry loop: validation failure feeds errors to generate stage (max 2 retries)
- S3 status updates between stages
- Model-agnostic via Vercel AI SDK

**Non-Goals:**
- No streaming or real-time progress updates (polling via GET endpoint is sufficient)
- No parallel pipeline runs management (no queue, no worker pool)
- No prompt engineering optimization (get it working first)

## Decisions

**Pipeline as async function** — `runPipeline(skillId, contractAddress, chainId, message)` is a plain async function. The API endpoint calls it without awaiting. No job queue for PoC — just fire and forget with error handling.

**LLM provider configuration** — `src/pipeline/model.js` exports a configured model instance. Imports `@ai-sdk/openai` and creates the model from `OPENAI_API_KEY`. To switch providers, only this file changes.

**Research stage uses maxSteps** — Vercel AI SDK's `generateText` with `maxSteps` handles the agent tool-calling loop automatically. The research tools from CR2 are passed directly.

**Generate stage receives structured research output** — The research stage produces a structured summary (contract name, detected standards, key functions, gotchas). This is passed as user message context to the generate stage, along with the Agent Skills spec as system prompt.

**Validate stage is 3 checks in sequence** — Frontmatter validation (programmatic), ABI cross-check (LLM), safety check (LLM). If any fail, collect all errors and retry generate stage.

## Risks / Trade-offs

**No job queue** → If the server restarts mid-pipeline, the skill stays in "generating" forever. Acceptable for PoC.

**LLM output quality depends on prompts** → Prompts will need iteration. Start simple, refine based on output quality.

**Max 2 retries may not be enough** → Start with 2, adjust if needed. Each retry costs LLM tokens.
