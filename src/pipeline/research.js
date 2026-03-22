import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { model } from './model.js';
import { researchTools } from '../tools/research.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SYSTEM_PROMPT = readFileSync(join(__dirname, 'prompts/research-system.md'), 'utf8');

/**
 * Run the research stage for a smart contract.
 * @param {string} contractAddress
 * @returns {Promise<object>} structured research summary
 */
export async function runResearch(contractAddress) {
  const agent = createReactAgent({ llm: model, tools: researchTools });

  const result = await agent.invoke({
    messages: [
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage(
        `Research the smart contract at address ${contractAddress} on Base Mainnet (chainId 8453). Use the tools to fetch the ABI, source code, and detect ERC patterns. Then return a JSON object with your findings.`
      ),
    ],
  });

  const messages = result.messages;
  const lastMessage = messages[messages.length - 1];
  const text = typeof lastMessage.content === 'string' ? lastMessage.content : JSON.stringify(lastMessage.content);

  // Extract JSON from the response text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Research stage did not return valid JSON. Response: ${text.slice(0, 200)}`);
  }

  const summary = JSON.parse(jsonMatch[0]);
  return {
    contractAddress,
    chainId: 8453,
    ...summary,
  };
}
