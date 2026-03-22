## 1. Create skill directory and SKILL.md

- [ ] 1.1 Create `skills/spectopus/` directory
- [ ] 1.2 Write `skills/spectopus/SKILL.md` with YAML frontmatter (`name: spectopus`, `description`, `metadata` with author/version/chain)
- [ ] 1.3 Write markdown body with Generate section (POST /skills/generate endpoint, request/response format, fetch code example)
- [ ] 1.4 Write markdown body with Explore section (Bazaar discovery using @x402/extensions/bazaar, code example with withBazaar/listResources)
- [ ] 1.5 Write markdown body with Install section (GET /skills/:id endpoint, status polling, download and save code example)
- [ ] 1.6 Add x402 payment notice (HTTP 402, no payment flow details)

## 2. Verification

- [ ] 2.1 Verify frontmatter fields (name matches directory, description under 1024 chars, metadata keys present)
- [ ] 2.2 Verify code examples match actual API from `src/routes/skills.js` and `scripts/demo.js`
- [ ] 2.3 Verify total line count is under 500
