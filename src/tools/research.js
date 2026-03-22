import { tool } from 'ai';
import { z } from 'zod';
import { fetchABI, fetchSourceCode } from './explorer.js';
import { detectERCPatterns } from './erc.js';

export const researchTools = {
  fetchABI: tool({
    description: 'Fetch the ABI of a smart contract from Basescan/Etherscan, with Blockscout as fallback',
    parameters: z.object({
      contractAddress: z.string().describe('The contract address to fetch ABI for'),
      chainId: z.number().describe('The chain ID (8453 for Base Mainnet, 84532 for Base Sepolia)'),
    }),
    execute: async ({ contractAddress, chainId }) => {
      return await fetchABI(contractAddress, chainId);
    },
  }),

  fetchSourceCode: tool({
    description: 'Fetch the verified source code of a smart contract from Basescan/Etherscan, with Blockscout as fallback',
    parameters: z.object({
      contractAddress: z.string().describe('The contract address to fetch source code for'),
      chainId: z.number().describe('The chain ID (8453 for Base Mainnet, 84532 for Base Sepolia)'),
    }),
    execute: async ({ contractAddress, chainId }) => {
      return await fetchSourceCode(contractAddress, chainId);
    },
  }),

  detectERCPatterns: tool({
    description: 'Detect ERC standards (ERC-20, ERC-721, ERC-1155, ERC-4626) from a contract ABI',
    parameters: z.object({
      abi: z.array(z.any()).describe('The contract ABI as a JSON array'),
    }),
    execute: async ({ abi }) => {
      return detectERCPatterns(abi);
    },
  }),
};
