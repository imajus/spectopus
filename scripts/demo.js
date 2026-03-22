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
 *        WALLET_PRIVATE_KEY=0x...   # Your funded wallet private key
 *        BAZAAR_URL=https://bazaar.x402.org  # or override for local dev
 *        BASE_URL=http://localhost:3000       # Spectopus server URL
 *
 * Usage:
 *   node scripts/demo.js
 */

import 'dotenv/config';
import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import { HTTPFacilitatorClient, x402HTTPClient } from '@x402/core/http';
import { x402Client } from '@x402/core/client';
import { ExactEvmScheme } from '@x402/evm/exact/client';
import { withBazaar } from '@x402/extensions/bazaar';

const BAZAAR_URL = process.env.BAZAAR_URL || 'https://bazaar.x402.org';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const NETWORK = 'eip155:8453'; // Base Mainnet

async function main() {
  console.log('=== Spectopus Demo ===\n');
  console.log(`Bazaar: ${BAZAAR_URL}`);
  console.log(`Server: ${BASE_URL}\n`);

  // ── Step 1: Discover Spectopus skills on Bazaar ──────────────────────────────
  console.log('Step 1: Discovering Spectopus skills on x402 Bazaar...\n');

  const facilitator = new HTTPFacilitatorClient({ url: BAZAAR_URL });
  const bazaarClient = withBazaar(facilitator);

  let resources;
  try {
    resources = await bazaarClient.extensions.discovery.listResources({ type: 'http' });
  } catch (err) {
    console.error('Failed to query Bazaar:', err.message);
    process.exit(1);
  }

  // Filter for Spectopus skill endpoints (GET /skills/:id)
  const serverUrl = new URL(BASE_URL);
  const skillResources = (resources.resources ?? resources).filter(r => {
    try {
      const resourceUrl = new URL(r.url ?? r.resourceUrl ?? '');
      return (
        resourceUrl.hostname === serverUrl.hostname &&
        resourceUrl.port === serverUrl.port &&
        /^\/skills\/[^/]+$/.test(resourceUrl.pathname)
      );
    } catch {
      return false;
    }
  });

  if (skillResources.length === 0) {
    console.log('No Spectopus skills found on Bazaar.');
    console.log('Generate a skill first: POST /skills/generate');
    console.log('\nShowing all available resources:\n');
    const all = resources.resources ?? resources;
    all.forEach((r, i) => {
      console.log(`  [${i + 1}] ${r.url ?? r.resourceUrl}`);
      if (r.description) console.log(`       ${r.description}`);
    });
    return;
  }

  // ── Step 2: Print available skills ───────────────────────────────────────────
  console.log(`Found ${skillResources.length} Spectopus skill(s):\n`);
  skillResources.forEach((r, i) => {
    const url = r.url ?? r.resourceUrl;
    const desc = r.description ?? '(no description)';
    const price = r.price ?? r.accepts?.[0]?.price ?? '$0.01 USDC';
    const contract = r.metadata?.contractAddress ?? r.contractAddress ?? 'unknown';
    const chainId = r.metadata?.chainId ?? r.chainId ?? 'unknown';

    console.log(`  [${i + 1}] ${url}`);
    console.log(`       ${desc}`);
    console.log(`       Contract: ${contract}  Chain: ${chainId}  Price: ${price}`);
    console.log();
  });

  // ── Step 3: Purchase and download the first skill ────────────────────────────
  const target = skillResources[0];
  const targetUrl = target.url ?? target.resourceUrl;
  console.log(`Step 2: Purchasing skill: ${targetUrl}\n`);

  const privateKey = process.env.WALLET_PRIVATE_KEY;
  if (!privateKey) {
    console.log('WALLET_PRIVATE_KEY not set — skipping x402 payment demo.');
    console.log('Set WALLET_PRIVATE_KEY in your .env file to enable payment.');
    return;
  }

  // Build viem wallet client for signing
  const account = privateKeyToAccount(privateKey);
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(),
  }).extend(publicActions);

  console.log(`Paying from wallet: ${account.address}\n`);

  // Build x402 client with ExactEvmScheme
  const paymentClient = new x402Client();
  const evmScheme = new ExactEvmScheme(walletClient);
  paymentClient.register(NETWORK, evmScheme);

  const httpClient = new x402HTTPClient(paymentClient);

  // Step 1: Initial fetch (expect 402)
  let response = await fetch(targetUrl);

  if (response.status === 402) {
    console.log('Server returned 402 Payment Required — paying now...\n');

    // Extract payment requirements
    const paymentRequired = httpClient.getPaymentRequiredResponse(
      name => response.headers.get(name),
      await response.clone().json().catch(() => null),
    );

    // Create payment payload
    const paymentPayload = await httpClient.createPaymentPayload(paymentRequired);

    // Retry with payment header
    const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);
    response = await fetch(targetUrl, { headers: paymentHeaders });
  }

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
