## ADDED Requirements

### Requirement: Logger creation per pipeline run
The system SHALL create a logger instance at the start of each pipeline run via `createLogger(skillId, contractAddress)`. The logger SHALL accumulate events in memory.

#### Scenario: Logger initialized with run metadata
- **WHEN** `createLogger('abc-123', '0xDEAD')` is called
- **THEN** the logger records `skillId`, `contractAddress`, `chainId: 8453`, and `startedAt` timestamp

### Requirement: Stage lifecycle tracking
The logger SHALL provide `startStage(name)` and `endStage(result)` methods to record stage transitions with timestamps.

#### Scenario: Stage start and end recorded
- **WHEN** `startStage('research')` is called, work is done, then `endStage({ abiAvailable: true })` is called
- **THEN** the log contains a stage entry with `name: 'research'`, `startedAt`, `completedAt`, and `result`

### Requirement: Decision logging
The logger SHALL provide `logDecision(message)` to record pipeline decisions (e.g., retry triggers, ABI availability).

#### Scenario: Retry decision logged
- **WHEN** validation fails and `logDecision('Validation failed, retrying (attempt 1)')` is called
- **THEN** the current stage's events array contains `{ type: 'decision', message: '...', timestamp: '...' }`

### Requirement: Tool call logging
The logger SHALL provide `logToolCall(tool, input)` to record tool invocations.

#### Scenario: Tool call logged
- **WHEN** `logToolCall('fetchABI', '0xDEAD')` is called
- **THEN** the current stage's events array contains `{ type: 'tool_call', tool: 'fetchABI', input: '0xDEAD', timestamp: '...' }`

### Requirement: Log flush to storage
The logger SHALL provide an async `flush(status, error)` method that finalizes the log with `completedAt`, `status`, and `error` fields, then writes the full log object to S3.

#### Scenario: Successful pipeline flush
- **WHEN** `flush('success', null)` is called after pipeline completion
- **THEN** the log is written to S3 at `logs/{skillId}.json` with `status: 'success'`

#### Scenario: Failed pipeline flush
- **WHEN** `flush('failed', 'ABI not available')` is called
- **THEN** the log is written to S3 with `status: 'failed'` and `error: 'ABI not available'`

### Requirement: Pipeline orchestrator integration
The pipeline orchestrator SHALL use the logger to record all stage transitions, ABI availability decisions, retry decisions, and final outcome.

#### Scenario: Full pipeline with retry logged
- **WHEN** a pipeline runs research → generate → validate (fails) → generate (retry) → validate (passes)
- **THEN** the log contains stages for each transition with appropriate decisions and the final status is `success`
