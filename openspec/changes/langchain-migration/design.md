## Context

Spectopus uses a 3-stage LLM pipeline (research → generate → validate) to produce Agent Skills from smart contract addresses. The pipeline currently depends on Vercel AI SDK (`ai@6`, `@ai-sdk/openai@3`). The research stage uses `generateText` with `tools` and `maxSteps: 10` for agentic tool calling, but this is broken — the model executes tools once and never continues to produce a final text response. The generate and validate stages use `generateText` for plain LLM calls.

## Goals / Non-Goals

**Goals:**
- Fix the broken research stage by replacing the agentic loop with LangChain's `createReactAgent`
- Replace all `generateText` calls with LangChain `model.invoke()` for consistency
- Maintain identical pipeline behavior (same prompts, same JSON parsing, same retry logic)

**Non-Goals:**
- Changing the pipeline architecture or prompt engineering
- Adding structured output / JSON mode (current regex parsing is sufficient)
- Switching away from OpenAI models
- Modifying the HTTP API, storage layer, or x402 payment logic

## Decisions

### Use `ChatOpenAI` from `@langchain/openai`
Direct OpenAI integration with automatic `OPENAI_API_KEY` env var reading. Same model ID format. Alternative considered: `@langchain/community` generic provider — rejected because `@langchain/openai` is the maintained first-party integration.

### Use `createReactAgent` from `@langchain/langgraph/prebuilt` for research stage
Provides a battle-tested ReAct loop that handles multi-step tool calling automatically. The agent loops until the model stops calling tools and emits a final text response. Alternative considered: manual tool-calling loop with `model.bindTools()` + custom while loop — rejected as unnecessary complexity when the prebuilt agent works.

### Use `model.invoke([messages])` for generate and validate stages
These stages need no tools — just system + user message → text response. `model.invoke()` is the simplest LangChain API for this. Alternative considered: `model.call()` or `RunnableSequence` — rejected as over-engineering.

### Keep `zod@3` for tool schemas
LangChain's `tool()` uses Zod for `schema` parameter. The project already has `zod@^3.25.76` which is compatible. No version change needed.

## Risks / Trade-offs

- **[Risk] `stateModifier` vs `messageModifier` naming** → Check installed LangGraph version; both names have appeared across versions. Fall back to the other if one doesn't work.
- **[Risk] Agent final message content type** → OpenAI can return `content` as string or array of blocks. Normalize in research.js.
- **[Trade-off] Larger dependency footprint** → LangChain pulls in more packages than the AI SDK. Acceptable for a hackathon project where reliability matters more than bundle size.
