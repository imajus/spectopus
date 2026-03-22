/**
 * Spectopus Demo Script
 *
 * Demonstrates the full agent journey: discover → browse → pay → use
 *
 * Prerequisites:
 *   1. A running Spectopus server (npm start or npm run dev)
 *   2. At least one skill already generated (POST /skills/generate)
 *   3. A funded wallet on Base Mainnet with USDC for x402 payments
 *      - Skills cost $0.01 USDC each
 *      - Fund via Coinbase or bridge USDC to Base Mainnet (chain ID: 8453)
 *   4. Set environment variables:
 *        WALLET_PRIVATE_KEY=0x...         # Your funded wallet private key
 *        CDP_API_KEY_ID=...               # Coinbase Developer Platform API key
 *        CDP_API_KEY_SECRET=...           # Coinbase Developer Platform API secret
 *        BASE_URL=http://localhost:3000   # Spectopus server URL
 *
 * Usage:
 *   node scripts/demo.js
 */

import 'dotenv/config';
import { privateKeyToAccount } from 'viem/accounts';
import { HTTPFacilitatorClient } from '@x402/core/http';
import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { registerExactEvmScheme } from '@x402/evm/exact/client';
import { facilitator } from '@coinbase/x402';
import { withBazaar } from '@x402/extensions/bazaar';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function main() {
  console.log('=== Spectopus Demo ===\n');
  console.log(`Server: ${BASE_URL}\n`);

  // ── Step 1: Discover Spectopus skills on Bazaar ──────────────────────────────
  console.log('Step 1: Discovering Spectopus skills on x402 Bazaar...\n');

  const facilitatorClient = new HTTPFacilitatorClient(facilitator);
  const bazaarClient = withBazaar(facilitatorClient);

  let resources;
  try {
    resources = await bazaarClient.extensions.discovery.listResources({ type: 'http' });
  } catch (err) {
    console.error('Failed to query Bazaar:', err.message);
    process.exit(1);
  }

  // Filter for Spectopus skill endpoints by matching our server's BASE_URL
  const allItems = resources.items ?? [];
  const skillResources = allItems.filter(r => r.resource?.startsWith(`${BASE_URL}/skills/`));

  if (skillResources.length === 0) {
    console.log('No Spectopus skills found on Bazaar.');
    console.log('Generate a skill first: POST /skills/generate');
    console.debug('\nShowing all available resources:\n');
    allItems.forEach((r, i) => {
      console.log(`  [${i + 1}] ${r.resource}`);
      const desc = r.accepts?.[0]?.description;
      if (desc) console.log(`       ${desc}`);
    });
    return;
  }

  // ── Step 2: Print available skills ───────────────────────────────────────────
  console.log(`Found ${skillResources.length} Spectopus skill(s):\n`);
  skillResources.forEach((r, i) => {
    const desc = r.accepts?.[0]?.description ?? '(no description)';
    console.log(`  [${i + 1}] ${r.resource}`);
    console.log(`       ${desc}`);
    console.log();
  });

  // ── Step 3: Purchase and download the first skill ────────────────────────────
  const target = skillResources[0];
  const targetUrl = target.resource;
  console.log(`Step 2: Purchasing skill: ${targetUrl}\n`);

  const privateKey = process.env.WALLET_PRIVATE_KEY;
  if (!privateKey) {
    console.log('WALLET_PRIVATE_KEY not set — skipping x402 payment demo.');
    console.log('Set WALLET_PRIVATE_KEY in your .env file to enable payment.');
    return;
  }

  const signer = privateKeyToAccount(privateKey);
  console.log(`Paying from wallet: ${signer.address}\n`);

  const client = new x402Client();
  registerExactEvmScheme(client, { signer });
  const fetchWithPayment = wrapFetchWithPayment(fetch, client);

  const response = await fetchWithPayment(targetUrl);

  if (!response.ok) {
    console.error(`Failed to fetch skill: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const content = await response.text();

  // ── Step 4: Print the SKILL.md content ───────────────────────────────────────
  console.log('=== SKILL.md Content ===\n');
  console.log(content);
  console.log('\n=== Demo Complete ===');
}

main().catch(err => {
  console.error('Demo failed:', err);
  process.exit(1);
});
