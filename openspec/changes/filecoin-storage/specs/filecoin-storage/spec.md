## ADDED Requirements

### Requirement: Filecoin warm storage for final artifacts
The system SHALL upload completed skill content and execution logs to Filecoin warm storage via `@filoz/synapse-sdk`. Each upload SHALL return a PieceCID used for content-addressed retrieval.

#### Scenario: Skill uploaded on markReady
- **WHEN** `markReady(id, skillContent)` is called
- **THEN** the system SHALL upload `skillContent` as a piece to Filecoin warm storage
- **THEN** the system SHALL store the returned CID in the in-memory index entry

#### Scenario: Log uploaded on putLog
- **WHEN** `putLog(skillId, logData)` is called
- **THEN** the system SHALL upload the JSON-serialized `logData` to Filecoin warm storage
- **THEN** the system SHALL store the returned CID as `logCid` in the index entry

#### Scenario: Failed skills are not uploaded
- **WHEN** `markFailed(id, error)` is called
- **THEN** the system SHALL NOT upload anything to Filecoin
- **THEN** the system SHALL only update the in-memory index

### Requirement: In-memory index for pipeline state
The system SHALL maintain a `Map<skillId, SkillEntry>` in memory for all mutable pipeline operations. SkillEntry SHALL include: `status`, `stage`, `contractAddress`, `chainId`, `cid`, `logCid`, `content`, `error`, `createdAt`.

#### Scenario: Placeholder created in memory
- **WHEN** `createPlaceholder(id, { contractAddress })` is called
- **THEN** the system SHALL create an entry in the in-memory Map with `status: 'generating'`, `stage: 'research'`, and empty `cid`/`logCid`

#### Scenario: Stage updated in memory
- **WHEN** `updateStage(id, stage)` is called
- **THEN** the system SHALL update the `stage` field of the in-memory entry

#### Scenario: Skill retrieved from memory
- **WHEN** `getSkill(id)` is called for a known skill
- **THEN** the system SHALL return the entry from the in-memory Map including content if status is `ready`

#### Scenario: Unknown skill returns null
- **WHEN** `getSkill(id)` is called for an unknown id
- **THEN** the system SHALL return `null`

### Requirement: Permanent PDP HTTP URLs for logs
`getLogUrl(skillId)` SHALL return a permanent Filecoin PDP HTTP URL constructed from the stored `logCid` and the provider's PDP service URL. URLs SHALL NOT expire (unlike the previous 24h presigned S3 URLs).

#### Scenario: Log URL from CID
- **WHEN** `getLogUrl(skillId)` is called for a skill with a stored `logCid`
- **THEN** the system SHALL return an HTTP URL containing the CID that resolves to the log content

### Requirement: List skills for catalog
`listSkills()` SHALL return all entries from the in-memory index with `status: 'ready'`, each including `id`, `contractAddress`, `chainId`, `cid`, and `createdAt`.

#### Scenario: List returns ready skills
- **WHEN** `listSkills()` is called with 2 ready and 1 generating skill in the index
- **THEN** the system SHALL return an array of 2 entries (only the ready ones)

### Requirement: Storage initialization
`initStorage()` SHALL initialize the Synapse SDK client with a viem wallet client using `FILECOIN_PRIVATE_KEY`. The Filecoin chain (calibration or mainnet) SHALL be configurable via `FILECOIN_CHAIN` env var.

#### Scenario: Server startup initializes Filecoin
- **WHEN** the server starts with valid `FILECOIN_PRIVATE_KEY` and `FILECOIN_CHAIN` env vars
- **THEN** `initStorage()` SHALL create a Synapse instance ready for uploads

### Requirement: Economics tracking
The storage module SHALL track upload count, total bytes stored, and estimated storage cost. This data SHALL be exposed via `getEconomics()`.

#### Scenario: Economics updated on upload
- **WHEN** a skill is uploaded to Filecoin
- **THEN** the economics tracker SHALL increment upload count and bytes stored
