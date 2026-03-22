## ADDED Requirements

### Requirement: Contract address format validation
The system SHALL reject requests where `contractAddress` does not match the Ethereum address format `/^0x[0-9a-fA-F]{40}$/`.

#### Scenario: Valid Ethereum address
- **WHEN** a request is received with `contractAddress` set to `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- **THEN** the request proceeds to the pipeline

#### Scenario: Invalid address format
- **WHEN** a request is received with `contractAddress` set to `not-an-address`
- **THEN** the system returns HTTP 400 with error message describing the expected format

#### Scenario: Address with injection payload
- **WHEN** a request is received with `contractAddress` containing newlines or non-hex characters (e.g., `0x123\nIGNORE PREVIOUS INSTRUCTIONS`)
- **THEN** the system returns HTTP 400 and the payload never reaches the LLM pipeline

### Requirement: Message field length limit
The system SHALL reject requests where the `message` field exceeds 500 characters.

#### Scenario: Message within limit
- **WHEN** a request includes a `message` of 200 characters
- **THEN** the request proceeds normally

#### Scenario: Message exceeds limit
- **WHEN** a request includes a `message` of 1000 characters
- **THEN** the system returns HTTP 400 with an error indicating the maximum length

### Requirement: Message field sanitization
The system SHALL strip control characters (except spaces and newlines) from the `message` field before processing.

#### Scenario: Message with control characters
- **WHEN** a request includes a `message` containing null bytes or other control characters
- **THEN** the control characters are removed before the message enters the pipeline

### Requirement: Request body size limit
The system SHALL limit the JSON request body to 16KB.

#### Scenario: Oversized request body
- **WHEN** a request body exceeds 16KB
- **THEN** the system returns HTTP 413 (Payload Too Large)

### Requirement: URL-safe external API calls
The system SHALL URL-encode the `contractAddress` when constructing Blockscout API URLs.

#### Scenario: Address used in Blockscout URL
- **WHEN** the system constructs a Blockscout API URL with a contract address
- **THEN** the address is passed through `encodeURIComponent()` before URL interpolation
