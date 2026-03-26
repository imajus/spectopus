import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));

const A2A_X402_EXTENSION_URI =
  'https://github.com/google-agentic-commerce/a2a-x402/blob/main/spec/v0.2';

/**
 * Build the A2A Agent Card for Spectopus.
 *
 * @param {string} baseUrl - Public base URL of the service (e.g. https://spectopus.example.com)
 * @returns {object} A2A v0.3.0 Agent Card
 */
export function buildAgentCard(baseUrl) {
  const normalizedBase = baseUrl.replace(/\/$/, '');

  return {
    name: 'Spectopus',
    description:
      'AI-powered agent skill generator for smart contracts. Generates SKILL.md files from contract addresses on Base Mainnet.',
    url: `${normalizedBase}/a2a`,
    provider: {
      organization: 'Spectopus',
      url: normalizedBase,
    },
    version: pkg.version,
    protocolVersion: '0.3.0',
    capabilities: {
      streaming: false,
      pushNotifications: false,
      stateTransitionHistory: true,
      extensions: [
        {
          uri: A2A_X402_EXTENSION_URI,
          required: true,
        },
      ],
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
}
