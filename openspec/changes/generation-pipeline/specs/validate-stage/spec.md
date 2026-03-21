## ADDED Requirements

### Requirement: Frontmatter validation
The validate stage SHALL check that the generated SKILL.md has valid YAML frontmatter with required fields: `name`, `description`, and `metadata` containing `contractAddress`, `chainId`, and `generator`.

#### Scenario: Valid frontmatter
- **WHEN** a SKILL.md with all required frontmatter fields is validated
- **THEN** the frontmatter check passes

#### Scenario: Missing fields
- **WHEN** a SKILL.md is missing required frontmatter fields
- **THEN** the frontmatter check fails with a list of missing fields

### Requirement: ABI cross-check
The validate stage SHALL use the LLM to verify that code examples in the generated SKILL.md reference real function signatures, correct parameter types, and proper return values from the contract's ABI.

#### Scenario: Code matches ABI
- **WHEN** all code examples reference valid ABI functions with correct signatures
- **THEN** the ABI cross-check passes

#### Scenario: Code references non-existent function
- **WHEN** a code example references a function not in the ABI
- **THEN** the ABI cross-check fails with details of the mismatch

### Requirement: Safety check
The validate stage SHALL use the LLM to verify that the skill includes appropriate warnings for payable functions, approval patterns, and potential footguns.

#### Scenario: Warnings present
- **WHEN** the contract has payable functions and the skill includes corresponding warnings
- **THEN** the safety check passes

#### Scenario: Missing warnings
- **WHEN** the contract has payable functions but the skill lacks warnings
- **THEN** the safety check fails with details of missing warnings

### Requirement: Aggregate validation result
The validate stage SHALL return a combined result with pass/fail status and collected errors from all three checks.

#### Scenario: All checks pass
- **WHEN** frontmatter, ABI cross-check, and safety check all pass
- **THEN** validation returns `{ valid: true, errors: [] }`

#### Scenario: Some checks fail
- **WHEN** one or more checks fail
- **THEN** validation returns `{ valid: false, errors: [...] }` with all failure details
