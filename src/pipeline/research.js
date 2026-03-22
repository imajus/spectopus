import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { generateText } from 'ai';
import { model } from './model.js';
import { researchTools } from '../tools/research.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SYSTEM_PROMPT = readFileSync(join(__dirname, 'prompts/research-system.md'), 'utf8');

/**
 * Run the research stage for a smart contract.
 * @param {string} contractAddress
 * @param {number} chainId
 * @returns {Promise<object>} structured research summary
 */
export async function runResearch(contractAddress, chainId) {
  const { text } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt: `Research the smart contract at address ${contractAddress} on chain ${chainId}. Use the tools to fetch the ABI, source code, and detect ERC patterns. Then return a JSON object with your findings.`,
    tools: researchTools,
    maxSteps: 10,
  });

  // Extract JSON from the response text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Research stage did not return valid JSON. Response: ${text.slice(0, 200)}`);
  }

  const summary = JSON.parse(jsonMatch[0]);
  return {
    contractAddress,
    chainId,
    ...summary,
  };
}
