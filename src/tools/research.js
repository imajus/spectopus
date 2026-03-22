import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { fetchABI, fetchSourceCode } from './explorer.js';
import { detectERCPatterns } from './erc.js';

export const researchTools = [
  tool(
    async ({ contractAddress }) => {
      const abi = await fetchABI(contractAddress);
      if (!abi) return 'ABI not available for this contract';
      return JSON.stringify(abi);
    },
    {
      name: 'fetchABI',
      description: 'Fetch the ABI of a smart contract from Blockscout (Base Mainnet)',
      schema: z.object({
        contractAddress: z.string().describe('The contract address to fetch ABI for'),
      }),
    }
  ),

  tool(
    async ({ contractAddress }) => {
      const source = await fetchSourceCode(contractAddress);
      if (!source) return 'Source code not available for this contract';
      return typeof source === 'string' ? source : JSON.stringify(source);
    },
    {
      name: 'fetchSourceCode',
      description: 'Fetch the verified source code of a smart contract from Blockscout (Base Mainnet)',
      schema: z.object({
        contractAddress: z.string().describe('The contract address to fetch source code for'),
      }),
    }
  ),

  tool(
    async ({ abi }) => {
      const patterns = detectERCPatterns(abi);
      return JSON.stringify(patterns);
    },
    {
      name: 'detectERCPatterns',
      description: 'Detect ERC standards (ERC-20, ERC-721, ERC-1155, ERC-4626) from a contract ABI',
      schema: z.object({
        abi: z.array(z.any()).describe('The contract ABI as a JSON array'),
      }),
    }
  ),
];
