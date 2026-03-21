## ADDED Requirements

### Requirement: Vercel AI SDK tool definitions
The system SHALL export research tools as Vercel AI SDK `tool()` definitions with zod parameter schemas, suitable for use with `generateText({ tools })`.

#### Scenario: Tools usable in generateText
- **WHEN** the exported tools object is passed to Vercel AI SDK's `generateText({ tools })`
- **THEN** the LLM can invoke `fetchABI`, `fetchSourceCode`, and `detectERCPatterns` tools

### Requirement: Tool parameter schemas
Each tool definition SHALL include a zod schema defining its parameters (contractAddress as string, chainId as number where applicable).

#### Scenario: Schema validation
- **WHEN** the LLM invokes a tool with incorrect parameter types
- **THEN** the AI SDK rejects the call based on the zod schema
