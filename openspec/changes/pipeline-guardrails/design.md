## Context

Spectopus exposes two x402-paywalled HTTP endpoints that trigger a 3-stage LLM pipeline (research → generate → validate). User-supplied `contractAddress` is interpolated raw into LLM prompts and external API URLs. There is no input validation beyond a presence check, no output scanning, and LLM validation failures default to pass-through. The hackathon judges weight "Guardrails & Safety" at 20%.

## Goals / Non-Goals

**Goals:**
- Prevent prompt injection via user-supplied fields (`contractAddress`, `message`)
- Validate input at the API boundary before it enters the pipeline
- Fail closed when validation LLM responses are unparseable
- Scan generated output for injection patterns before persisting
- Keep changes minimal and pragmatic — no complex frameworks

**Non-Goals:**
- Rate limiting or DDoS protection (x402 payment is a natural rate limiter)
- Authentication beyond x402 payment verification
- Content moderation of generated SKILL.md (beyond injection detection)
- Sandboxed LLM execution environments

## Decisions

### 1. Input validation at route level, not middleware
Validate `contractAddress` format and `message` length directly in the POST handler in `skills.js`. A separate middleware would be over-engineering for two fields.

**Alternative**: Express-validator or Zod middleware — rejected as unnecessary dependency for two simple checks.

### 2. Shared `src/guardrails.js` utility module
Centralize address regex, message sanitizer, and output scanner in one file. Keeps route handler and pipeline code clean.

**Alternative**: Inline validation in each file — rejected for duplication across 3+ files.

### 3. XML delimiter wrapping for user data in prompts
Wrap user-supplied values in `<contract_address>...</contract_address>` tags in LLM prompts, paired with a system prompt instruction to treat tagged content as literal data. This is a well-established prompt injection defense.

**Alternative**: JSON escaping — less effective because LLMs don't consistently treat JSON strings as non-executable.

### 4. Fail-closed validation fallback
When `validate.js` can't parse the LLM's JSON response, return `{ valid: false }` instead of `{ valid: true }`. This triggers a retry (up to MAX_RETRIES) rather than silently accepting potentially broken output.

**Alternative**: Keep fail-open — rejected because it defeats the purpose of validation.

### 5. Blocklist-based output scanning
Scan final SKILL.md for known injection patterns (e.g., `IGNORE PREVIOUS`, `<|im_start|>`, `SYSTEM:`) before `markReady()`. Simple string matching — no regex complexity.

**Alternative**: LLM-based output review — rejected as too slow/expensive for a simple safety check.

### 6. Body size limit via Express
`express.json({ limit: '16kb' })` — contract addresses and short messages don't need more.

## Risks / Trade-offs

- [Blocklist evasion] → Attackers can bypass simple string matching. Mitigation: this is defense-in-depth, not the sole protection layer. Combined with input validation and prompt delimiters, the attack surface is minimal.
- [False positives in output scan] → Legitimate SKILL.md content could match blocklist patterns. Mitigation: keep patterns specific (multi-word phrases, special tokens) rather than single common words.
- [Fail-closed retries increase LLM costs] → Unparseable validation responses trigger retries. Mitigation: MAX_RETRIES is already capped at 2, and this scenario is rare with well-structured prompts.
