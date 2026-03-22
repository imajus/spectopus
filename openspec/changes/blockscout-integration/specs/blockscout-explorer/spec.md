## ADDED Requirements

### Requirement: Fetch contract ABI via Blockscout
The system SHALL fetch the ABI of a verified smart contract from Blockscout REST API v2 at `GET {baseUrl}/api/v2/smart-contracts/{address}` and return the `abi` field as a parsed JSON array.

#### Scenario: Verified contract on Base Mainnet
- **WHEN** `fetchABI` is called with a verified contract address and chainId `8453`
- **THEN** the system SHALL request `https://base.blockscout.com/api/v2/smart-contracts/{address}` and return the `abi` array from the response

#### Scenario: Verified contract on Base Sepolia
- **WHEN** `fetchABI` is called with a verified contract address and chainId `84532`
- **THEN** the system SHALL request `https://base-sepolia.blockscout.com/api/v2/smart-contracts/{address}` and return the `abi` array from the response

#### Scenario: Unverified contract
- **WHEN** `fetchABI` is called with an address that is not verified on Blockscout
- **THEN** the system SHALL return `null`

#### Scenario: Unsupported chain ID
- **WHEN** `fetchABI` is called with a chainId other than `8453` or `84532`
- **THEN** the system SHALL throw an error with message `Unsupported chainId: {chainId}`

### Requirement: Fetch contract source code via Blockscout
The system SHALL fetch the verified source code of a smart contract from Blockscout REST API v2 at `GET {baseUrl}/api/v2/smart-contracts/{address}` and return the `source_code` field as a string.

#### Scenario: Verified contract with source code
- **WHEN** `fetchSourceCode` is called with a verified contract address and chainId `8453`
- **THEN** the system SHALL return the `source_code` string from the Blockscout response

#### Scenario: Unverified contract
- **WHEN** `fetchSourceCode` is called with an address that is not verified on Blockscout
- **THEN** the system SHALL return `null`

#### Scenario: Unsupported chain ID
- **WHEN** `fetchSourceCode` is called with a chainId other than `8453` or `84532`
- **THEN** the system SHALL throw an error with message `Unsupported chainId: {chainId}`

### Requirement: No API key required
The system SHALL NOT require an API key for Blockscout contract data requests.

#### Scenario: Request without API key
- **WHEN** any Blockscout request is made
- **THEN** the system SHALL NOT include any API key parameter in the request URL or headers
