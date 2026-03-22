---
name: spectopus
description: >
  Generate, explore, and install AI-powered Agent Skills for smart contracts.
  Spectopus analyzes a contract address, produces a SKILL.md following the
  Agent Skills specification, and makes it available for download via x402
  paywall. Use it to turn any EVM smart contract into a discoverable,
  agent-ready skill in seconds.
metadata:
  author: spectopus
  version: 1.0.0
  chain: eip155:8453
---

# Spectopus

Spectopus generates Agent Skills (SKILL.md files) from smart contract addresses
on Base Mainnet. Provide a contract address; Spectopus researches the contract,
generates a conformant skill file, and stores it for download.

> **Note:** All endpoints require x402 payment. Requests without a valid payment
> will receive HTTP 402. Use an x402-capable client (e.g. `@x402/fetch`) to
> handle payment automatically.

## Generate

Start the async pipeline that produces a SKILL.md for a smart contract.

**Endpoint:** `POST /skills/generate`
**Cost:** $0.10 USDC
**Content-Type:** `application/json`

### Request body

| Field             | Type     | Required | Description                                         |
|-------------------|----------|----------|-----------------------------------------------------|
| `contractAddress` | `string` | Yes      | EVM contract address (0x…)                          |
| `message`         | `string` | No       | Optional hint for the generator (e.g. "focus on swap functions") |

### Response body

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://spectopus.majus.app/skills/550e8400-e29b-41d4-a716-446655440000"
}
```

### Code example

```js
import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { privateKeyToAccount } from 'viem/accounts';

const signer = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY);
const client = new x402Client();
registerExactEvmScheme(client, { signer });
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const res = await fetchWithPayment('https://spectopus.majus.app/skills/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  }),
});

const { id, url } = await res.json();
console.log('Skill ID:', id);
console.log('Skill URL:', url);
```

Generation is asynchronous. Poll `GET /skills/:id` to check when the skill is ready.

---

## Explore

Discover generated skills on x402 Bazaar using the `@x402/extensions/bazaar` client.

```js
import { HTTPFacilitatorClient } from '@x402/core/http';
import { facilitator } from '@coinbase/x402';
import { withBazaar } from '@x402/extensions/bazaar';

const facilitatorClient = new HTTPFacilitatorClient(facilitator);
const bazaarClient = withBazaar(facilitatorClient);

const resources = await bazaarClient.extensions.discovery.listResources({ type: 'http' });

// Filter for Spectopus skill endpoints
const BASE_URL = 'https://spectopus.majus.app';
const skills = (resources.items ?? []).filter(r =>
  r.resource?.startsWith(`${BASE_URL}/skills/`)
);

skills.forEach(r => {
  console.log(r.resource);
  console.log(r.accepts?.[0]?.description);
});
```

Skills are auto-indexed on Bazaar after generation. Each entry has a `resource`
URL you can pass directly to `GET /skills/:id`.

---

## Install

Download a generated SKILL.md and save it locally.

**Endpoint:** `GET /skills/:id`
**Cost:** $0.01 USDC
**Response:** `text/markdown`

If generation is still in progress, the response will contain a status
placeholder. Poll until the content is a valid SKILL.md (starts with `---`).

### Code example

```js
import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { privateKeyToAccount } from 'viem/accounts';
import { writeFileSync, mkdirSync } from 'node:fs';

const signer = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY);
const client = new x402Client();
registerExactEvmScheme(client, { signer });
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

async function pollSkill(skillUrl, maxAttempts = 20, intervalMs = 5000) {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetchWithPayment(skillUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    if (text.startsWith('---')) return text; // complete SKILL.md

    console.log(`Still generating… (attempt ${i + 1}/${maxAttempts})`);
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error('Timed out waiting for skill generation');
}

const skillId = '550e8400-e29b-41d4-a716-446655440000';
const skillUrl = `https://spectopus.majus.app/skills/${skillId}`;

const content = await pollSkill(skillUrl);

mkdirSync('skills/downloaded', { recursive: true });
writeFileSync(`skills/downloaded/${skillId}.md`, content);
console.log('Skill saved.');
```
