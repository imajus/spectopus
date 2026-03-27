## 1. Dependencies

- [x] 1.1 Add `@a2a-js/sdk` to package.json and run `npm install`

## 2. Agent Card

- [x] 2.1 Create `src/a2a/agent-card.js` with `buildAgentCard(baseUrl)` returning A2A v0.3.0 card JSON with x402 extension and `generate_skill` skill

## 3. A2A Executor

- [x] 3.1 Create `src/a2a/executor.js` with `SpectopusExecutor` class implementing contract address extraction (JSON parse + regex fallback)
- [x] 3.2 Implement x402 payment negotiation: build PaymentRequirements, return `input-required` with `x402.payment.required` metadata
- [x] 3.3 Implement payment verification: decode payload via `x402/schemes`, verify + settle via facilitator from `x402/verify`
- [x] 3.4 Implement pipeline bridge: on successful payment, run `runPipeline` with `onProgress` callback publishing A2A task status events
- [x] 3.5 Handle error states: invalid payment → `payment-failed`, pipeline failure → `failed` with receipt

## 4. A2A Routing

- [x] 4.1 Create `src/a2a/index.js` with `registerA2A(app, baseUrl)` wiring `@a2a-js/sdk` middleware, `InMemoryTaskStore`, and executor to Express
- [x] 4.2 Modify `src/app.js`: import and call `registerA2A(app, BASE_URL)` before `registerSkillsRoutes`

## 5. Pipeline Callback

- [x] 5.1 Modify `src/pipeline/index.js`: add optional `onProgress` parameter to `runPipeline`, call it before each stage

## 6. Tests

- [x] 6.1 Create `src/a2a/executor.test.js`: test address extraction (JSON, plain text, missing), test payment flow mocking facilitator
