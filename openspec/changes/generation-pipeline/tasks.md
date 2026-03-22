## 1. Model Configuration

- [x] 1.1 Install `@ai-sdk/openai`
- [x] 1.2 Create `src/pipeline/model.js` — export configured OpenAI model via Vercel AI SDK
- [x] 1.3 Add `OPENAI_API_KEY` to `.env.example`

## 2. Research Stage

- [x] 2.1 Create `src/pipeline/research.js` — async function that runs `generateText` with research tools and `maxSteps`, returns structured research summary
- [x] 2.2 Define system prompt for research agent (analyze contract, identify key functions, detect patterns, note gotchas)

## 3. Generate Stage

- [x] 3.1 Create `src/pipeline/generate.js` — async function that takes research summary and optional validation errors, calls LLM to produce SKILL.md
- [x] 3.2 Define system prompt with Agent Skills spec format, viem code examples convention, required sections
- [x] 3.3 Handle retry feedback — include previous validation errors in prompt when retrying

## 4. Validate Stage

- [x] 4.1 Create `src/pipeline/validate.js` with three check functions
- [x] 4.2 Implement frontmatter validation — parse YAML, check required fields (name, description, metadata.contractAddress, metadata.chainId, metadata.generator)
- [x] 4.3 Implement ABI cross-check — LLM call to verify code examples match ABI signatures
- [x] 4.4 Implement safety check — LLM call to verify warnings for payable functions and approval patterns
- [x] 4.5 Aggregate results into `{ valid, errors }` object

## 5. Pipeline Orchestrator

- [x] 5.1 Create `src/pipeline/index.js` — `runPipeline(skillId, contractAddress, chainId, message)` async function
- [x] 5.2 Wire up stage sequence: research → generate → validate with S3 status updates between stages
- [x] 5.3 Implement retry loop: on validation failure, retry generate → validate (max 2 retries)
- [x] 5.4 Implement failure handling: catch errors at any stage, call `markFailed`

## 6. Tests

- [x] 7.1 Test frontmatter validation with valid and invalid SKILL.md content
- [x] 7.2 Test pipeline orchestrator retry logic with mocked stages
