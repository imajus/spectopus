## ADDED Requirements

### Requirement: Log persistence to S3
The system SHALL store execution logs as JSON at `logs/{skillId}.json` in the S3 bucket via a `putLog(skillId, logData)` function.

#### Scenario: Log written to S3
- **WHEN** `putLog('abc-123', { skillId: 'abc-123', status: 'success', ... })` is called
- **THEN** a JSON object is stored at S3 key `logs/abc-123.json` with `ContentType: application/json`

### Requirement: Presigned URL generation
The system SHALL generate presigned S3 URLs for log files via `getLogUrl(skillId)` with a 24-hour expiry.

#### Scenario: Presigned URL generated
- **WHEN** `getLogUrl('abc-123')` is called
- **THEN** a presigned URL is returned that provides temporary read access to `logs/abc-123.json`

### Requirement: Log URL in skill response
The `GET /skills/:id` endpoint SHALL include a `logUrl` field in the JSON response when the skill status is `ready` or `failed`.

#### Scenario: Completed skill includes log URL
- **WHEN** a client fetches `GET /skills/abc-123` and the skill status is `ready`
- **THEN** the response JSON includes `logUrl` with a presigned S3 URL

#### Scenario: In-progress skill omits log URL
- **WHEN** a client fetches `GET /skills/abc-123` and the skill status is `generating`
- **THEN** the response JSON does NOT include `logUrl`
