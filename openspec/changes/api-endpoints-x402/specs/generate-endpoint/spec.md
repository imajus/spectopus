## ADDED Requirements

### Requirement: Generate endpoint accepts contract details
`POST /skills/generate` SHALL accept a JSON body with `contractAddress` (string, required), `chainId` (number, required), and `message` (string, optional).

#### Scenario: Valid request
- **WHEN** a POST is made with `{ "contractAddress": "0xabc...", "chainId": 8453 }`
- **THEN** the server responds with 200 and `{ "id": "<uuid>", "url": "<BASE_URL>/skills/<uuid>" }`

#### Scenario: Missing required fields
- **WHEN** a POST is made without `contractAddress` or `chainId`
- **THEN** the server responds with 400 and an error message

### Requirement: Generate endpoint creates placeholder and starts pipeline
The endpoint SHALL create an S3 placeholder, start the pipeline asynchronously, and return immediately without waiting for pipeline completion.

#### Scenario: Async pipeline
- **WHEN** a valid generation request is received
- **THEN** an S3 placeholder is created, the pipeline is started in the background, and the response is returned within milliseconds

### Requirement: Skill ID generation
The endpoint SHALL generate a unique skill ID using `crypto.randomUUID()`.

#### Scenario: Unique IDs
- **WHEN** two generation requests are made
- **THEN** each receives a different skill ID
