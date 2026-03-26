## 1. Dependencies

- [x] 1.1 Remove `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` from package.json
- [x] 1.2 Add `@filoz/synapse-sdk@^0.40.0` and `viem@^2.0.0` to package.json
- [x] 1.3 Run `npm install`

## 2. Storage Rewrite

- [x] 2.1 Rewrite `src/storage.js`: replace S3 client with Synapse SDK + viem wallet client initialization in `initStorage()`
- [x] 2.2 Implement in-memory `Map<skillId, SkillEntry>` with `createPlaceholder`, `updateStage`, `getSkill` operating on the Map
- [x] 2.3 Implement `markReady(id, content)`: upload to Filecoin via Synapse SDK, store CID + content in index
- [x] 2.4 Implement `markFailed(id, error)`: update in-memory entry only
- [x] 2.5 Implement `putLog(skillId, logData)`: upload to Filecoin, store logCid in index
- [x] 2.6 Implement `getLogUrl(skillId)`: return PDP HTTP URL from stored logCid
- [x] 2.7 Implement `listSkills()`: return ready entries from index
- [x] 2.8 Implement `getEconomics()`: return upload count, bytes, estimated cost

## 3. Type Definitions

- [x] 3.1 Create `src/storage.d.ts` with SkillEntry interface and all function signatures

## 4. Integration

- [x] 4.1 Modify `src/index.js`: call `initStorage()` before `app.listen()`
- [x] 4.2 Update `.env.example` with `FILECOIN_PRIVATE_KEY`, `FILECOIN_CHAIN`

## 5. Tests

- [x] 5.1 Rewrite `src/storage.test.js`: mock `@filoz/synapse-sdk`, test all CRUD operations + listSkills + economics
