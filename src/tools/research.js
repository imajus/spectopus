import { tool } from 'ai';
import { z } from 'zod';
import { fetchABI, fetchSourceCode } from './explorer.js';
import { detectERCPatterns } from './erc.js';

export const researchTools = {
  fetchABI: tool({
    description: 'Fetch the ABI of a smart contract from Basescan (Base Mainnet)',
    parameters: z.object({
      contractAddress: z.string().describe('The contract address to fetch ABI for'),
    }),
    execute: async ({ contractAddress }) => {
      return await fetchABI(contractAddress);
    },
  }),

  fetchSourceCode: tool({
    description: 'Fetch the verified source code of a smart contract from Basescan (Base Mainnet)',
    parameters: z.object({
      contractAddress: z.string().describe('The contract address to fetch source code for'),
    }),
    execute: async ({ contractAddress }) => {
      return await fetchSourceCode(contractAddress);
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
