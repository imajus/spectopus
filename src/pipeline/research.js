import { generateText } from 'ai';
import { model } from './model.js';
import { researchTools } from '../tools/research.js';

const SYSTEM_PROMPT = `You are a smart contract analyst. Your job is to thoroughly research a smart contract and produce a structured summary that will be used to generate an Agent Skill documentation file.

Use the available tools to:
1. Fetch the contract ABI using fetchABI
2. Fetch the verified source code using fetchSourceCode
3. Detect ERC standard patterns using detectERCPatterns on the ABI

After gathering all information, produce a structured JSON summary with these fields:
- contractName: string (name of the contract)
- contractAddress: string
- chainId: number
- purpose: string (concise explanation of what the contract does)
- ercPatterns: array of detected ERC standards (e.g. ["ERC-20", "ERC-721"])
- keyFunctions: array of objects with { name, signature, description, isPayable }
- gotchas: array of strings describing potential footguns, risks, or important caveats
- abiAvailable: boolean (false if ABI could not be fetched)

If the ABI is not available, set abiAvailable to false and note that skill generation cannot proceed.`;

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
