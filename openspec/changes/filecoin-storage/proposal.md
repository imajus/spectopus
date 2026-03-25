## Why

S3 (Cloudflare R2) is centralized storage that doesn't align with the decentralized/on-chain thesis of the hackathon. Filecoin Onchain Cloud provides verifiable, content-addressed storage with HTTP access via PDP URLs. The economics are self-sustaining: at ~1KB/skill and $2.5/TiB/month, each $0.10 generation fee covers ~40M months of storage.

## What Changes

- **BREAKING**: Replace all S3 operations with Filecoin warm storage via `@filoz/synapse-sdk`
- Use in-memory index for mutable pipeline state (generating → ready), Filecoin for final artifacts only
- Skills and logs addressed by content ID (CID), served via permanent PDP HTTP URLs
- No restart recovery — in-memory state lost on restart (acceptable for PoC)
- Add storage economics tracking (uploads, bytes, estimated cost vs revenue)

## Capabilities

### New Capabilities
- `filecoin-storage`: Filecoin warm storage integration via Synapse SDK for skill.json and log.json, with in-memory index for pipeline state

### Modified Capabilities

## Impact

- `src/storage.js` — complete rewrite (same export signatures)
- `src/index.js` — call `initStorage()` before server start
- `package.json` — remove `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`; add `@filoz/synapse-sdk`, `viem`
- `.env.example` — replace S3_* vars with `FILECOIN_PRIVATE_KEY`, `FILECOIN_CHAIN`
- No changes to `src/pipeline/index.js` or `src/routes/skills.js` (storage API preserved)
