import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));

export const agentCard = {
  name: 'Spectopus',
  description:
    'AI-powered agent skill generator for smart contracts. Generates SKILL.md files from contract addresses on Base Mainnet.',
  url: process.env.BASE_URL || 'https://spectopus.example.com',
  provider: {
    organization: 'Spectopus',
    url: process.env.BASE_URL || 'https://spectopus.example.com',
  },
  version: pkg.version,
  protocolVersion: '0.3.0',
  capabilities: {
    streaming: false,
    pushNotifications: false,
    stateTransitionHistory: true,
  },
  defaultInputModes: ['text/plain', 'application/json'],
  defaultOutputModes: ['text/plain'],
  skills: [
    {
      id: 'generate_skill',
      name: 'Generate Agent Skill',
      description:
        'Generates a SKILL.md Agent Skills file for a smart contract on Base Mainnet. Provide a contract address to get started.',
      tags: ['smart-contract', 'skill-generation', 'base', 'ethereum', 'agent-skills'],
      examples: [
        'Generate a skill for 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        '{"contractAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"}',
      ],
    },
  ],
};
