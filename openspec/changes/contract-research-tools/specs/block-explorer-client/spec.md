## ADDED Requirements

### Requirement: Fetch ABI
The system SHALL provide a `fetchABI(contractAddress, chainId)` function that retrieves the contract ABI as parsed JSON from the Basescan/Etherscan API.

#### Scenario: Verified contract
- **WHEN** `fetchABI` is called with a valid contract address that has a verified ABI
- **THEN** it returns the parsed ABI as a JSON array of function/event definitions

#### Scenario: Unverified contract
- **WHEN** `fetchABI` is called with a contract address that has no verified ABI
- **THEN** it returns `null`

### Requirement: Fetch source code
The system SHALL provide a `fetchSourceCode(contractAddress, chainId)` function that retrieves the verified source code from the Basescan/Etherscan API.

#### Scenario: Verified source available
- **WHEN** `fetchSourceCode` is called with a contract that has verified source code
- **THEN** it returns the source code as a string

#### Scenario: No verified source
- **WHEN** `fetchSourceCode` is called with a contract that has no verified source
- **THEN** it returns `null`

### Requirement: Chain ID mapping
The client SHALL support Base Mainnet (8453) and Base Sepolia (84532) by mapping chain IDs to their respective block explorer API base URLs.

#### Scenario: Supported chain
- **WHEN** a function is called with chainId `8453`
- **THEN** it uses the Basescan mainnet API URL

#### Scenario: Unsupported chain
- **WHEN** a function is called with an unmapped chainId
- **THEN** it throws an error indicating the chain is not supported

### Requirement: API key configuration
The client SHALL use the `ETHERSCAN_API_KEY` environment variable for authentication with the block explorer API.

#### Scenario: API key used
- **WHEN** any API call is made
- **THEN** the request includes the API key from `ETHERSCAN_API_KEY`
