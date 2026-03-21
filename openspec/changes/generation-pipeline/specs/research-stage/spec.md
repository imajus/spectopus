## ADDED Requirements

### Requirement: Research stage execution
The system SHALL run an AI agent loop that uses research tools (fetchABI, fetchSourceCode, detectERCPatterns) to analyze a smart contract and produce a structured research summary.

#### Scenario: Successful research
- **WHEN** the research stage runs with a valid contract address and chainId
- **THEN** it returns a structured object containing: contract name, detected ERC standards, list of key functions with signatures, identified gotchas, and contract purpose summary

#### Scenario: ABI not available
- **WHEN** the research stage runs for a contract with no verified ABI
- **THEN** it returns a research summary indicating the ABI is unavailable and skill generation cannot proceed

### Requirement: Research uses Vercel AI SDK agent loop
The research stage SHALL use `generateText` with `maxSteps` and the research tools, allowing the LLM to decide which tools to call and in what order.

#### Scenario: Multi-tool research
- **WHEN** the research stage runs
- **THEN** the LLM autonomously calls fetchABI, fetchSourceCode, and detectERCPatterns as needed, then synthesizes results
