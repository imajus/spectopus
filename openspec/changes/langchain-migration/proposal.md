## Why

The Vercel AI SDK (`ai@6`, `@ai-sdk/openai@3`) has critical bugs in multi-step tool calling — after tools return results, the model never gets called for step 2, producing empty text output. Additional issues include silent `parameters` → `inputSchema` rename and Zod v4 incompatibility. The research pipeline stage is completely non-functional. LangChain.js provides a mature, well-tested agentic loop that reliably handles multi-step tool calling.

## What Changes

- **BREAKING**: Replace `ai` and `@ai-sdk/openai` packages with `@langchain/openai`, `@langchain/langgraph`, and `@langchain/core`
- Replace `openai.chat()` model factory with `ChatOpenAI` from `@langchain/openai`
- Replace broken `generateText` + `maxSteps` agentic loop with `createReactAgent` from `@langchain/langgraph/prebuilt` for the research stage
- Replace `generateText` plain calls with `model.invoke()` for generate and validate stages
- Replace `tool()` definitions from `ai` with `tool()` from `@langchain/core/tools`
- Update test mocks from `generateText` mock to `model.invoke` mock

## Capabilities

### New Capabilities

- `langchain-llm`: LLM abstraction layer using LangChain ChatOpenAI and ReAct agent for tool-calling pipeline stages

### Modified Capabilities

## Impact

- **Dependencies**: Remove `ai`, `@ai-sdk/openai`. Add `@langchain/openai`, `@langchain/langgraph`, `@langchain/core`.
- **Code**: `src/pipeline/model.js`, `src/pipeline/research.js`, `src/pipeline/generate.js`, `src/pipeline/validate.js`, `src/tools/research.js`
- **Tests**: `src/pipeline/validate.test.js` mock pattern changes
- **No impact**: `src/tools/explorer.js`, `src/tools/erc.js`, `src/pipeline/index.js`, `src/routes/skills.js`
