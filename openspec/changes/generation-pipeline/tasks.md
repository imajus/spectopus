## 1. Model Configuration

- [ ] 1.1 Install `@ai-sdk/openai`
- [ ] 1.2 Create `src/pipeline/model.js` — export configured OpenAI model via Vercel AI SDK
- [ ] 1.3 Add `OPENAI_API_KEY` to `.env.example`

## 2. Research Stage

- [ ] 2.1 Create `src/pipeline/research.js` — async function that runs `generateText` with research tools and `maxSteps`, returns structured research summary
- [ ] 2.2 Define system prompt for research agent (analyze contract, identify key functions, detect patterns, note gotchas)

## 3. Generate Stage

- [ ] 3.1 Create `src/pipeline/generate.js` — async function that takes research summary and optional validation errors, calls LLM to produce SKILL.md
- [ ] 3.2 Define system prompt with Agent Skills spec format, viem code examples convention, required sections
- [ ] 3.3 Handle retry feedback — include previous validation errors in prompt when retrying

## 4. Validate Stage

- [ ] 4.1 Create `src/pipeline/validate.js` with three check functions
- [ ] 4.2 Implement frontmatter validation — parse YAML, check required fields (name, description, metadata.contractAddress, metadata.chainId, metadata.generator)
- [ ] 4.3 Implement ABI cross-check — LLM call to verify code examples match ABI signatures
- [ ] 4.4 Implement safety check — LLM call to verify warnings for payable functions and approval patterns
- [ ] 4.5 Aggregate results into `{ valid, errors }` object

## 5. Pipeline Orchestrator

- [ ] 5.1 Create `src/pipeline/index.js` — `runPipeline(skillId, contractAddress, chainId, message)` async function
- [ ] 5.2 Wire up stage sequence: research → generate → validate with S3 status updates between stages
- [ ] 5.3 Implement retry loop: on validation failure, retry generate → validate (max 2 retries)
- [ ] 5.4 Implement failure handling: catch errors at any stage, call `markFailed`

## 6. Execution Logging

- [ ] 6.1 Create `src/pipeline/logger.js` — accumulate stage data (timing, tool calls, decisions) during run
- [ ] 6.2 Append JSON log entry to `logs/agent_log.jsonl` on pipeline completion
- [ ] 6.3 Ensure `logs/` directory is created if missing

## 7. Tests

- [ ] 7.1 Test frontmatter validation with valid and invalid SKILL.md content
- [ ] 7.2 Test pipeline orchestrator retry logic with mocked stages
