## ADDED Requirements

### Requirement: Model singleton exports ChatOpenAI instance
The `src/pipeline/model.js` module SHALL export a `ChatOpenAI` instance configured from `OPENAI_MODEL` env var (defaulting to `gpt-4.1-mini`) with `temperature: 0`.

#### Scenario: Default model creation
- **WHEN** `OPENAI_MODEL` env var is not set
- **THEN** the exported model SHALL be a `ChatOpenAI` with `model: 'gpt-4.1-mini'`

#### Scenario: Custom model from env
- **WHEN** `OPENAI_MODEL` is set to `gpt-5.4`
- **THEN** the exported model SHALL use `gpt-5.4` as the model ID

### Requirement: Research stage uses ReAct agent for multi-step tool calling
The research stage SHALL use `createReactAgent` from `@langchain/langgraph/prebuilt` to orchestrate tool calls. The agent SHALL invoke `fetchABI` and `fetchSourceCode` tools and produce a final text response containing a JSON summary.

#### Scenario: Successful multi-step research
- **WHEN** `runResearch` is called with a valid contract address
- **THEN** the agent SHALL call fetchABI and fetchSourceCode tools, receive results, and produce a final message containing a JSON object with contract research findings

#### Scenario: Agent produces empty or non-JSON response
- **WHEN** the agent's final message does not contain valid JSON
- **THEN** `runResearch` SHALL throw an error with the first 200 characters of the response

### Requirement: Generate stage uses model.invoke for plain text generation
The generate stage SHALL call `model.invoke()` with a system message and user message array. It SHALL return the response content trimmed of whitespace.

#### Scenario: Generate SKILL.md from research
- **WHEN** `runGenerate` is called with a research object
- **THEN** it SHALL invoke the model with the generate system prompt and research JSON, returning the generated SKILL.md text

#### Scenario: Retry with validation errors
- **WHEN** `runGenerate` is called with validation errors
- **THEN** the validation errors SHALL be appended to the user prompt for the model to fix

### Requirement: Validate stage uses model.invoke for ABI and safety checks
The validate stage's `checkABICrossCheck` and `checkSafety` functions SHALL call `model.invoke()` with system + user message arrays and parse JSON from the response content.

#### Scenario: ABI cross-check passes
- **WHEN** `checkABICrossCheck` is called with valid SKILL.md and ABI
- **THEN** it SHALL invoke the model and return `{ valid: true, errors: [] }` if the model confirms correctness

#### Scenario: Unparseable model response fails open
- **WHEN** the model returns non-JSON text in a validation check
- **THEN** the check SHALL return `{ valid: true, errors: [] }` (fail open)

### Requirement: Tool definitions use LangChain tool() with schema parameter
Tool definitions in `src/tools/research.js` SHALL use `tool()` from `@langchain/core/tools` with `name`, `description`, and `schema` (Zod object) parameters. Tool execute functions SHALL return strings.

#### Scenario: fetchABI tool returns stringified ABI
- **WHEN** the fetchABI tool is called with a contract address
- **THEN** it SHALL return `JSON.stringify(abi)` or a descriptive error string if ABI is unavailable
