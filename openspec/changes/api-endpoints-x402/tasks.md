## 1. x402 Setup

- [ ] 1.1 Install `@x402/express` and `@x402/evm`
- [ ] 1.2 Add `WALLET_PRIVATE_KEY` and `BASE_URL` to `.env.example`

## 2. Skills Router

- [ ] 2.1 Create `src/routes/skills.js` with Express router
- [ ] 2.2 Implement `POST /generate` — validate request body (contractAddress, chainId required), generate UUID, create S3 placeholder, fire pipeline async, return `{ id, url }`
- [ ] 2.3 Implement `GET /:id` — fetch from S3 via `getSkill`, return content as text/markdown or 404

## 3. x402 Middleware Integration

- [ ] 3.1 Configure x402 middleware with wallet from `WALLET_PRIVATE_KEY`, USDC on Base, facilitator URL
- [ ] 3.2 Apply $0.10 payment gate to `POST /generate`
- [ ] 3.3 Apply $0.01 payment gate to `GET /:id`

## 4. Wire Up

- [ ] 4.1 Mount skills router in `src/app.js` at `/skills`
- [ ] 4.2 Ensure health endpoint remains payment-free

## 5. Tests

- [ ] 5.1 Test generate endpoint returns id and url with valid request
- [ ] 5.2 Test generate endpoint returns 400 for missing fields
- [ ] 5.3 Test download endpoint returns skill content or 404
