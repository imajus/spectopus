## Context

Spectopus stores skills and logs in S3 (Cloudflare R2) via `@aws-sdk/client-s3`. The storage module (`src/storage.js`) provides CRUD operations with mutable state (status updates during pipeline execution). Filecoin Onchain Cloud provides decentralized, verifiable, content-addressed storage via the Synapse SDK (`@filoz/synapse-sdk`).

The key challenge is that Filecoin content is immutable (addressed by CID), while the pipeline needs mutable state transitions (`generating` → `ready`/`failed`).

## Goals / Non-Goals

**Goals:**
- Replace S3 with Filecoin warm storage for final skill.json and log.json artifacts
- Maintain identical export signatures from `src/storage.js` — zero changes to callers
- Track storage economics (cost vs revenue) for self-sustaining narrative
- Content-addressed retrieval via permanent PDP HTTP URLs

**Non-Goals:**
- Restart recovery or state persistence (PoC — in-memory state lost on restart)
- Storing intermediate pipeline state on Filecoin (only final artifacts)
- Cross-chain payment automation (operator pre-funds Filecoin wallet)

## Decisions

### In-memory index for mutable state, Filecoin for immutable artifacts
**Rationale**: Pipeline needs mutable status tracking. Filecoin is immutable. Solution: `Map<skillId, SkillEntry>` in memory handles all mutable operations. Only `markReady` and `putLog` upload to Filecoin. Content is cached in the index entry after upload, so `getSkill` reads from memory (no Filecoin fetch latency on reads).

### Use Synapse SDK high-level API
**Rationale**: `new Synapse({ client })` → `synapse.storage.createContext()` → `context.upload()` handles provider selection, dataset management, and payment rails automatically. The SDK uses `viem` as peer dependency (also needed by ERC-8004 change). Files are served via PDP HTTP URLs constructed from CID + provider service URL.

### No restart recovery
**Rationale**: For PoC/hackathon, accepting data loss on restart is a reasonable trade-off. Completed skills exist on Filecoin (retrievable by CID) but the index mapping `skillId → CID` is lost. A production system would persist the index to Redis or a database.

### Single shared dataset
**Rationale**: All Spectopus uploads go into one Filecoin dataset. The dataset has an associated payment rail funded from the operator's USDFC balance. Piece metadata (filename) distinguishes skills from logs.

## Risks / Trade-offs

- **[Synapse SDK maturity (v0.40.0)]** → Wrap all SDK calls in try/catch. The SDK is actively maintained by FilOz. Fallback: revert to S3 by restoring the old `storage.js` from git.
- **[Upload latency]** → Filecoin warm storage uploads may take seconds. This only affects `markReady` and `putLog`, which happen after pipeline completion (not in the hot path).
- **[Operator must pre-fund Filecoin wallet]** → Storage costs are negligible (~$0.000002/skill). A small USDFC deposit covers millions of skills.
- **[In-memory state lost on restart]** → Acceptable for PoC. In-progress pipelines are lost. Completed skills exist on Filecoin but aren't indexed until re-generated.
