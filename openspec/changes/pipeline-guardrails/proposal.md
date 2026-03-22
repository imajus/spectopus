## Why

The LLM pipeline accepts user input (`contractAddress`, `message`) and interpolates it directly into prompts with no validation or sanitization, creating prompt injection and abuse vectors. The hackathon judging criteria weights "Guardrails & Safety" at 20%, making this a scoring priority.

## What Changes

- Add input validation for `contractAddress` (Ethereum address format) and `message` (length cap, control char stripping)
- Add prompt injection defenses: XML delimiters around user data in prompts, anti-injection instructions in system prompts
- URL-encode user input in external API calls (Blockscout)
- Switch validation fallbacks from fail-open to fail-closed when LLM responses are unparseable
- Add output sanitization to scan generated SKILL.md for injection patterns before storage
- Add Express request body size limit

## Capabilities

### New Capabilities
- `input-validation`: Validate and sanitize all user-supplied input at the API boundary
- `prompt-safety`: Defend LLM prompts against injection via delimiters and system prompt hardening
- `output-sanitization`: Scan LLM-generated output for suspicious patterns before storage

### Modified Capabilities

## Impact

- `src/routes/skills.js` — input validation added to POST handler
- `src/app.js` — body size limit
- `src/pipeline/research.js`, `generate.js` — prompt construction changes
- `src/pipeline/validate.js` — fail-closed fallbacks
- `src/pipeline/prompts/*.md` — system prompt hardening
- `src/tools/explorer.js` — URL encoding
- `src/pipeline/index.js` — output scan before storage
- New file: `src/guardrails.js` — shared validation/sanitization utilities
