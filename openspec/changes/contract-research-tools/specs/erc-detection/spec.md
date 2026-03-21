## ADDED Requirements

### Requirement: Detect ERC standards
The system SHALL provide a `detectERCPatterns(abi)` function that identifies known ERC standards by matching function signatures in the ABI.

#### Scenario: ERC-20 token
- **WHEN** `detectERCPatterns` is called with an ABI containing `transfer`, `approve`, `transferFrom`, `balanceOf`, `totalSupply`, `allowance`
- **THEN** it returns an array including `"ERC-20"`

#### Scenario: ERC-721 NFT
- **WHEN** `detectERCPatterns` is called with an ABI containing `ownerOf`, `safeTransferFrom`, `getApproved`, `setApprovalForAll`
- **THEN** it returns an array including `"ERC-721"`

#### Scenario: ERC-1155 multi-token
- **WHEN** `detectERCPatterns` is called with an ABI containing `balanceOfBatch`, `safeBatchTransferFrom`, `safeTransferFrom`
- **THEN** it returns an array including `"ERC-1155"`

#### Scenario: No recognized standard
- **WHEN** `detectERCPatterns` is called with an ABI matching no known standards
- **THEN** it returns an empty array

#### Scenario: Multiple standards
- **WHEN** `detectERCPatterns` is called with an ABI matching multiple standards
- **THEN** it returns all matched standards
