## 1. Dependencies

- [ ] 1.1 Remove `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` from package.json
- [ ] 1.2 Add `@filoz/synapse-sdk@^0.40.0` and `viem@^2.0.0` to package.json
- [ ] 1.3 Run `npm install`

## 2. Storage Rewrite

- [ ] 2.1 Rewrite `src/storage.js`: replace S3 client with Synapse SDK + viem wallet client initialization in `initStorage()`
- [ ] 2.2 Implement in-memory `Map<skillId, SkillEntry>` with `createPlaceholder`, `updateStage`, `getSkill` operating on the Map
- [ ] 2.3 Implement `markReady(id, content)`: upload to Filecoin via Synapse SDK, store CID + content in index
- [ ] 2.4 Implement `markFailed(id, error)`: update in-memory entry only
- [ ] 2.5 Implement `putLog(skillId, logData)`: upload to Filecoin, store logCid in index
- [ ] 2.6 Implement `getLogUrl(skillId)`: return PDP HTTP URL from stored logCid
- [ ] 2.7 Implement `listSkills()`: return ready entries from index
- [ ] 2.8 Implement `getEconomics()`: return upload count, bytes, estimated cost

## 3. Type Definitions

- [ ] 3.1 Create `src/storage.d.ts` with SkillEntry interface and all function signatures

## 4. Integration

- [ ] 4.1 Modify `src/index.js`: call `initStorage()` before `app.listen()`
- [ ] 4.2 Update `.env.example` with `FILECOIN_PRIVATE_KEY`, `FILECOIN_CHAIN`

## 5. Tests

- [ ] 5.1 Rewrite `src/storage.test.js`: mock `@filoz/synapse-sdk`, test all CRUD operations + listSkills + economics
