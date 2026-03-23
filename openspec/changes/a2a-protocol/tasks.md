## 1. Setup

- [ ] 1.1 Install `@a2a-js/sdk` dependency
- [ ] 1.2 Create `src/a2a/` directory

## 2. Agent Card

- [ ] 2.1 Create `src/a2a/agent-card.js` with A2A Agent Card definition (name, description, url, provider, version, protocolVersion, capabilities, skills)

## 3. Executor

- [ ] 3.1 Add optional `onProgress` callback parameter to `runPipeline()` in `src/pipeline/index.js`
- [ ] 3.2 Create `src/a2a/executor.js` implementing `AgentExecutor` interface — extract contract address from user message (JSON or plain text), create S3 placeholder, run pipeline, publish status/artifact events via EventBus
- [ ] 3.3 Handle missing contract address case — transition to `input-required` state

## 4. Express Integration

- [ ] 4.1 Modify `src/app.js` to import and mount A2A agent card handler at `/.well-known/agent-card.json`
- [ ] 4.2 Mount A2A JSON-RPC handler at `/a2a` path

## 5. Verification

- [ ] 5.1 Verify `GET /.well-known/agent-card.json` returns valid A2A Agent Card
- [ ] 5.2 Verify `POST /a2a` with `message/send` creates a task and starts the pipeline
- [ ] 5.3 Verify existing x402 endpoints still work unchanged
- [ ] 5.4 Run existing test suite (`npm test`)
