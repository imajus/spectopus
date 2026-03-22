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

## Using thirdweb MCP (no-code)

[thirdweb MCP](https://portal.thirdweb.com/ai/mcp) gives your agent an x402-capable
wallet and three tools that cover every Spectopus action — no private keys or
custom code required. Add the remote MCP server to your client config:

```json
{
  "mcpServers": {
    "thirdweb-api": {
      "url": "https://api.thirdweb.com/mcp?secretKey=YOUR_SECRET_KEY"
    }
  }
}
```

Or via Claude Code CLI:

```sh
claude mcp add --transport http "thirdweb-api" "https://api.thirdweb.com/mcp?secretKey=YOUR_SECRET_KEY"
```

### Generate

Use the **`fetchWithPayment`** tool. It posts to `/skills/generate`, detects the
HTTP 402, pays $0.10 USDC automatically, and returns `{ id, url }`.

```json
{
  "tool": "fetchWithPayment",
  "url": "https://spectopus.majus.app/skills/generate",
  "method": "POST",
  "body": {
    "contractAddress": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  },
  "chainId": "eip155:8453",
  "maxValue": "100000"
}
```

> `maxValue` is in USDC base units (6 decimals): `100000` = $0.10.

### Explore

Use the **`listPayableServices`** tool to discover generated skills indexed on
the x402 Bazaar.

```json
{
  "tool": "listPayableServices",
  "query": "spectopus.majus.app",
  "sortBy": "createdAt",
  "sortOrder": "desc"
}
```

Each result includes a `resource` URL you can pass directly to `fetchWithPayment`.

### Install

Use the **`fetchWithPayment`** tool with a GET request. It pays $0.01 USDC and
returns the SKILL.md content. Poll until the response starts with `---`
(valid SKILL.md frontmatter — generation may still be in progress).

```json
{
  "tool": "fetchWithPayment",
  "url": "https://spectopus.majus.app/skills/550e8400-e29b-41d4-a716-446655440000",
  "method": "GET",
  "chainId": "eip155:8453",
  "maxValue": "10000"
}
```

> `maxValue`: `10000` = $0.01 USDC.

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

Discover generated skills via thirdweb's x402 discovery API.

```js
const res = await fetch(
  'https://api.thirdweb.com/v1/payments/x402/discovery/resources?query=spectopus.majus.app',
  { headers: { 'x-secret-key': process.env.THIRDWEB_SECRET_KEY } },
);
const { resources } = await res.json();

resources.forEach(r => {
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
