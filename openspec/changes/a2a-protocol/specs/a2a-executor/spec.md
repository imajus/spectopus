## ADDED Requirements

### Requirement: A2A JSON-RPC endpoint
The system SHALL expose an A2A JSON-RPC endpoint at `POST /a2a` that handles `message/send`, `tasks/get`, and `tasks/cancel` methods.

#### Scenario: SendMessage creates a task
- **WHEN** a client sends a JSON-RPC `message/send` request with a user message containing a contract address
- **THEN** the system creates a new task, starts the generation pipeline, and returns the task object with status "submitted" or "working"

#### Scenario: GetTask returns current state
- **WHEN** a client sends a JSON-RPC `tasks/get` request with a valid task ID
- **THEN** the system returns the task with its current status and any completed artifacts

### Requirement: Contract address extraction from messages
The executor SHALL extract a contract address from the user message, supporting both JSON-formatted parts (`{"contractAddress": "0x..."}`) and plain text containing an Ethereum address.

#### Scenario: JSON input with contractAddress
- **WHEN** the user message contains a text part with `{"contractAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"}`
- **THEN** the executor extracts `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` as the contract address

#### Scenario: Plain text with Ethereum address
- **WHEN** the user message contains "Generate a skill for 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
- **THEN** the executor extracts `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` as the contract address

#### Scenario: No contract address found
- **WHEN** the user message does not contain a valid Ethereum address
- **THEN** the task transitions to `input-required` state with a message asking for a contract address

### Requirement: Pipeline stages map to task status updates
The executor SHALL publish A2A task status events as the pipeline progresses through stages.

#### Scenario: Pipeline stage progression
- **WHEN** the pipeline moves through research, generate, and validate stages
- **THEN** the executor publishes `working` status updates with stage-specific messages for each transition

#### Scenario: Pipeline completes successfully
- **WHEN** the pipeline finishes with a valid SKILL.md
- **THEN** the executor publishes an artifact containing the SKILL.md content and sets task status to `completed`

#### Scenario: Pipeline fails
- **WHEN** the pipeline encounters an error
- **THEN** the executor sets task status to `failed` with an error message
