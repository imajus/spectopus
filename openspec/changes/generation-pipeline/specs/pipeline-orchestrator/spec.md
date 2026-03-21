## ADDED Requirements

### Requirement: Pipeline execution
The orchestrator SHALL run the 3-stage pipeline (research → generate → validate) for a given skill ID, contract address, chain ID, and optional message.

#### Scenario: Successful pipeline
- **WHEN** the pipeline runs for a valid contract
- **THEN** it executes research, generate, validate in sequence and stores the final SKILL.md with `metadata.status: "ready"`

### Requirement: S3 status updates
The orchestrator SHALL update the S3 placeholder between stages to reflect current progress.

#### Scenario: Stage transitions
- **WHEN** the pipeline moves from research to generate stage
- **THEN** the S3 placeholder is updated with `metadata.stage: "generate"`

### Requirement: Retry on validation failure
The orchestrator SHALL retry the generate → validate cycle when validation fails, up to a maximum of 2 retries, passing validation errors as feedback.

#### Scenario: Retry succeeds
- **WHEN** validation fails on first attempt but succeeds on retry
- **THEN** the final SKILL.md is stored with `status: "ready"`

#### Scenario: Max retries exceeded
- **WHEN** validation fails after 2 retries
- **THEN** the skill is marked as failed with `status: "failed"` and error details

### Requirement: Failure handling
The orchestrator SHALL catch errors at any stage and mark the skill as failed in S3 with error details.

#### Scenario: Research stage fails
- **WHEN** the research stage throws an error
- **THEN** the skill is marked as failed with the error message

### Requirement: Execution logging
The orchestrator SHALL log structured execution data (tool calls, LLM calls, decisions, timing, retries) and append it to `logs/agent_log.jsonl` on pipeline completion.

#### Scenario: Log entry written
- **WHEN** a pipeline run completes (success or failure)
- **THEN** a JSON log entry is appended to `logs/agent_log.jsonl` with runId, skillId, stages, timing, and status

### Requirement: Model configuration
The pipeline SHALL export the LLM model from a single `src/pipeline/model.js` module, using Vercel AI SDK with the configured provider.

#### Scenario: Default provider
- **WHEN** `OPENAI_API_KEY` is set
- **THEN** the model module exports an OpenAI GPT-5 model instance via `@ai-sdk/openai`
