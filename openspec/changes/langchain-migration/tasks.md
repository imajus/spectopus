## 1. Dependencies

- [ ] 1.1 Install `@langchain/openai`, `@langchain/langgraph`, `@langchain/core`
- [ ] 1.2 Uninstall `ai`, `@ai-sdk/openai`

## 2. Model layer

- [ ] 2.1 Rewrite `src/pipeline/model.js` to export `ChatOpenAI` instance from `@langchain/openai`

## 3. Tool definitions

- [ ] 3.1 Rewrite `src/tools/research.js` to use `tool()` from `@langchain/core/tools` with `name`, `description`, `schema` params
- [ ] 3.2 Ensure tool execute functions return strings (`JSON.stringify` for objects, descriptive message for null)
- [ ] 3.3 Export `researchTools` as array (not dict)

## 4. Pipeline stages

- [ ] 4.1 Rewrite `src/pipeline/research.js` to use `createReactAgent` from `@langchain/langgraph/prebuilt`
- [ ] 4.2 Rewrite `src/pipeline/generate.js` to use `model.invoke([system, user])` instead of `generateText`
- [ ] 4.3 Rewrite `src/pipeline/validate.js` — replace two `generateText` calls with `model.invoke()`

## 5. Tests

- [ ] 5.1 Update `src/pipeline/validate.test.js` mocks: replace `generateText` mock with `model.invoke` mock
- [ ] 5.2 Run `npx vitest` and verify all tests pass

## 6. End-to-end verification

- [ ] 6.1 Test `fetchABI` via Blockscout inline
- [ ] 6.2 Test `runResearch('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913')` — multi-step completes with JSON
- [ ] 6.3 Test `runGenerate(researchResult)` — produces SKILL.md content
- [ ] 6.4 Test full pipeline via HTTP API
