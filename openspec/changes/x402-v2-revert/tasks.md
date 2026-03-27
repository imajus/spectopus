## 1. Dependencies

- [x] 1.1 Remove `x402-express` and `thirdweb` from package.json
- [x] 1.2 Add `@x402/express@^2.7.0`, `@x402/evm@^2.7.0`, `@x402/extensions@^2.7.0` to package.json
- [x] 1.3 Run `npm install` and verify no version conflicts

## 2. Payment Middleware

- [x] 2.1 Rewrite `buildPaymentMiddleware` in `src/routes/skills.js` to use `x402ResourceServer` + `ExactEvmScheme` with PayAI facilitator URL from `X402_FACILITATOR_URL` env var
- [x] 2.2 Update route configs to use `@x402/express` v2 format (`accepts: { scheme, price, network, payTo }`)
- [x] 2.3 Add `declareDiscoveryExtension` from `@x402/extensions/bazaar` to both route configs
- [x] 2.4 Remove all thirdweb imports (`createThirdwebClient`, `facilitator`)

## 3. Environment & Docs

- [x] 3.1 Update `.env.example`: replace `THIRDWEB_SECRET_KEY`, `THIRDWEB_SERVER_WALLET_ADDRESS` with `X402_FACILITATOR_URL`, `PAY_TO_ADDRESS`
- [x] 3.2 Update `CLAUDE.md` x402/Bazaar notes to reflect v2 + PayAI facilitator
- [x] 3.3 Update `docs/Specification.md` tech stack section

## 4. Verification

- [x] 4.1 Run `npm test` — existing tests pass
- [x] 4.2 Start server with `npm run dev` — verify no startup errors
