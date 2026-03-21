## Context

The two endpoints are the public interface of Spectopus. Both sit behind x402 payment middleware. The generate endpoint kicks off the pipeline asynchronously and returns immediately. The download endpoint serves whatever is in S3 (placeholder or final skill).

## Goals / Non-Goals

**Goals:**
- Two x402-paywalled endpoints matching the Specification
- Async pipeline execution (fire-and-forget from the endpoint's perspective)
- Skill ID generation and URL construction

**Non-Goals:**
- No authentication beyond x402 payment
- No rate limiting beyond x402 cost barrier
- No request validation beyond required fields

## Decisions

**x402 middleware per-route, not global** — Only skill endpoints require payment. Health check remains free. Apply x402 middleware to the skills router only.

**Skill ID generation** — Use `crypto.randomUUID()`. Short, unique, URL-safe.

**URL construction** — `BASE_URL` env var provides the public base URL. Skill URL = `${BASE_URL}/skills/${id}`.

**Routes in separate file** — `src/routes/skills.js` exports an Express router. `src/app.js` mounts it at `/skills`.

**Pipeline called without await** — The generate endpoint calls `runPipeline()` without awaiting. Errors are caught inside the pipeline and written to S3 as failed status.

**x402 configuration** — Use `@x402/express` middleware with `@x402/evm` for Base chain. Wallet from `WALLET_PRIVATE_KEY`. Facilitator from constant or env var.

## Risks / Trade-offs

**No request deduplication** → Same contract address can be submitted multiple times, generating duplicate skills. Acceptable for PoC.

**Pipeline errors are silent to the caller** → The caller gets a 200 with skill ID immediately. They must poll GET to discover failures. This is by design.
