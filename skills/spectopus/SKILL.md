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

All endpoints require x402 payment (HTTP 402). Choose an approach below.

---

## Using Payments MCP (no-code)

Install [Coinbase Payments MCP](https://docs.cdp.coinbase.com/payments-mcp/welcome.md)
once and your agent handles all x402 payments automatically — no API keys,
no private keys, just email sign-in.

```sh
npx @coinbase/payments-mcp install
```

### Generate

Ask your agent to generate a skill for a contract address. The agent posts to
`POST https://spectopus.majus.app/skills/generate`, pays the $0.10 USDC fee,
and returns the skill ID and URL.

```
Generate a Spectopus skill for contract 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
```

Optional — add a focus hint:

```
Generate a Spectopus skill for 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48, focus on transfer functions
```

### Explore

Ask your agent to discover generated skills indexed on x402 Bazaar.

```
List available Spectopus skills on x402 Bazaar
```

```
What x402 services are available at spectopus.majus.app?
```

### Install

Ask your agent to download a skill by ID (from a Generate response or Bazaar
listing) and save it locally. The agent pays the $0.01 USDC fee and polls
until generation is complete.

```
Download Spectopus skill 550e8400-e29b-41d4-a716-446655440000 and save it to skills/
```

```
Install the Spectopus skill at https://spectopus.majus.app/skills/550e8400-e29b-41d4-a716-446655440000
```

---

## Using Code (`@x402/fetch`)

Use `wrapFetchWithPayment` to handle x402 in your own JavaScript. Requires a
funded wallet on Base Mainnet with USDC.

### Generate

**Endpoint:** `POST https://spectopus.majus.app/skills/generate`
**Cost:** $0.10 USDC

**Request body**

| Field             | Type     | Required | Description                                         |
|-------------------|----------|----------|-----------------------------------------------------|
| `contractAddress` | `string` | Yes      | EVM contract address (0x…)                          |
| `message`         | `string` | No       | Optional hint (e.g. "focus on swap functions")      |

**Response**

```json
{ "id": "550e8400-e29b-41d4-a716-446655440000", "url": "https://spectopus.majus.app/skills/550e8400-e29b-41d4-a716-446655440000" }
```

**Code example**

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

Generation is asynchronous — poll `GET /skills/:id` until content is ready.

### Explore

Discover generated skills indexed on x402 Bazaar.

```js
import { HTTPFacilitatorClient } from '@x402/core/http';
import { facilitator } from '@coinbase/x402';
import { withBazaar } from '@x402/extensions/bazaar';

const facilitatorClient = new HTTPFacilitatorClient(facilitator);
const bazaarClient = withBazaar(facilitatorClient);

const resources = await bazaarClient.extensions.discovery.listResources({ type: 'http' });

const BASE_URL = 'https://spectopus.majus.app';
const skills = (resources.items ?? []).filter(r =>
  r.resource?.startsWith(`${BASE_URL}/skills/`)
);

skills.forEach(r => {
  console.log(r.resource);
  console.log(r.accepts?.[0]?.description);
});
```

### Install

**Endpoint:** `GET https://spectopus.majus.app/skills/:id`
**Cost:** $0.01 USDC
**Response:** `text/markdown`

Poll until the response starts with `---` (valid SKILL.md frontmatter).

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
    if (text.startsWith('---')) return text;
    console.log(`Still generating… (attempt ${i + 1}/${maxAttempts})`);
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error('Timed out waiting for skill generation');
}

const skillId = '550e8400-e29b-41d4-a716-446655440000';
const content = await pollSkill(`https://spectopus.majus.app/skills/${skillId}`);

mkdirSync('skills/downloaded', { recursive: true });
writeFileSync(`skills/downloaded/${skillId}.md`, content);
console.log('Skill saved.');
```
