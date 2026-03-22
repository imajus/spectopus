import { HTTPFacilitatorClient } from '@x402/core/http';
import { withBazaar } from '@x402/extensions/bazaar';

const DEFAULT_BAZAAR_URL = 'https://bazaar.x402.org';

function getBazaarUrl() {
  return process.env.BAZAAR_URL || DEFAULT_BAZAAR_URL;
}

function getBaseUrl() {
  return process.env.BASE_URL || 'http://localhost:3000';
}

/**
 * Build a Bazaar-extended facilitator client for discovery queries.
 */
export function createBazaarClient() {
  const facilitator = new HTTPFacilitatorClient({ url: getBazaarUrl() });
  return withBazaar(facilitator);
}

/**
 * Register the POST /skills/generate endpoint on x402 Bazaar.
 * Non-blocking — caller should catch errors and log warnings.
 */
export async function registerGenerateEndpoint() {
  const bazaarUrl = getBazaarUrl();
  const baseUrl = getBaseUrl();

  const response = await fetch(`${bazaarUrl}/discovery/resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: `${baseUrl}/skills/generate`,
      description: 'Generate an Agent Skill for a smart contract ($0.10 USDC)',
      input: {
        type: 'http',
        method: 'POST',
        bodyType: 'json',
        body: {
          contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
          chainId: 8453,
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Bazaar registration failed (${response.status}): ${text}`);
  }

  return response.json();
}

/**
 * Register a GET /skills/:id endpoint on x402 Bazaar after successful generation.
 *
 * @param {string} id - Skill UUID
 * @param {{ contractAddress: string, chainId: number, description?: string }} metadata
 */
export async function registerSkillEndpoint(id, metadata) {
  const bazaarUrl = getBazaarUrl();
  const baseUrl = getBaseUrl();

  const description =
    metadata.description ||
    `Agent Skill for contract ${metadata.contractAddress} on chain ${metadata.chainId} ($0.01 USDC)`;

  const response = await fetch(`${bazaarUrl}/discovery/resources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: `${baseUrl}/skills/${id}`,
      description,
      input: {
        type: 'http',
        method: 'GET',
      },
      metadata: {
        spectopusSkillId: id,
        contractAddress: metadata.contractAddress,
        chainId: metadata.chainId,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Bazaar skill registration failed (${response.status}): ${text}`);
  }

  return response.json();
}
