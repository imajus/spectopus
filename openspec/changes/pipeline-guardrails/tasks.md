## 1. Guardrails utility module

- [x] 1.1 Create `src/guardrails.js` with `isValidAddress(addr)` (regex `/^0x[0-9a-fA-F]{40}$/`), `sanitizeMessage(msg, maxLen)` (strip control chars, enforce length), and `scanOutput(content)` (blocklist check returning `{ safe, reason }`)

## 2. Input validation

- [x] 2.1 Add `express.json({ limit: '16kb' })` body size limit in `src/app.js`
- [x] 2.2 Add address format validation and message sanitization in `src/routes/skills.js` POST handler using guardrails utilities
- [x] 2.3 URL-encode `contractAddress` in Blockscout API calls in `src/tools/explorer.js`

## 3. Prompt injection defense

- [x] 3.1 Add anti-injection instruction to `src/pipeline/prompts/research-system.md`
- [x] 3.2 Add anti-injection instruction to `src/pipeline/prompts/generate-system.md`
- [x] 3.3 Wrap `contractAddress` in XML delimiter tags in `src/pipeline/research.js` prompt construction
- [x] 3.4 Wrap user-supplied data in XML delimiter tags in `src/pipeline/generate.js` if `message` is used

## 4. Output safety

- [x] 4.1 Change fail-open defaults to fail-closed in `src/pipeline/validate.js` (lines 80, 85, 127, 132)
- [x] 4.2 Add output scan call in `src/pipeline/index.js` before `markReady()`, using `scanOutput()` from guardrails

## 5. Verification

- [x] 5.1 Test invalid addresses return 400 (non-hex, too short, injection payloads)
- [x] 5.2 Test oversized body returns 413
- [x] 5.3 Test end-to-end with a valid contract address still works
