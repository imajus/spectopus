import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { declareDiscoveryExtension } from '@x402/extensions/bazaar';
import { createPlaceholder, getSkill, getLogUrl } from '../storage.js';
import { runPipeline } from '../pipeline/index.js';
import { isValidAddress, sanitizeMessage } from '../guardrails.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DEFAULT_FACILITATOR_URL = 'https://facilitator.payai.network/';

function buildPaymentMiddleware(payToAddress) {
  const facilitatorUrl = process.env.X402_FACILITATOR_URL || DEFAULT_FACILITATOR_URL;
  const facilitatorClient = new HTTPFacilitatorClient({ url: facilitatorUrl });
  const resourceServer = new x402ResourceServer(facilitatorClient)
    .register('eip155:8453', new ExactEvmScheme());

  return paymentMiddleware(
    {
      'POST /skills/generate': {
        accepts: {
          scheme: 'exact',
          price: '$0.10',
          network: 'eip155:8453',
          payTo: payToAddress,
        },
        description: 'Generate an Agent Skill for a smart contract ($0.10 USDC)',
        ...declareDiscoveryExtension({
          bodyType: 'json',
          input: { contractAddress: '0x...', message: 'optional context' },
        }),
      },
      'GET /skills/:id': {
        accepts: {
          scheme: 'exact',
          price: '$0.01',
          network: 'eip155:8453',
          payTo: payToAddress,
        },
        description: 'Download a generated Agent Skill ($0.01 USDC)',
        ...declareDiscoveryExtension({}),
      },
    },
    resourceServer,
  );
}

export function registerSkillsRoutes(app) {
  const payToAddress = process.env.PAY_TO_ADDRESS;
  if (payToAddress) {
    app.use(buildPaymentMiddleware(payToAddress));
  }

  app.post('/skills/generate', async (req, res) => {
    const { contractAddress, message } = req.body ?? {};

    if (!contractAddress) {
      return res.status(400).json({ error: 'contractAddress is required' });
    }

    if (!isValidAddress(contractAddress)) {
      return res.status(400).json({ error: 'contractAddress must be a valid Ethereum address (0x followed by 40 hex characters)' });
    }

    const sanitizedMessage = message != null ? sanitizeMessage(message, 500) : undefined;

    const id = crypto.randomUUID();
    const url = `${BASE_URL}/skills/${id}`;

    await createPlaceholder(id, { contractAddress });

    runPipeline(id, contractAddress, sanitizedMessage).catch(err => {
      console.error(`Pipeline failed for skill ${id}:`, err);
    });

    return res.json({ id, url });
  });

  app.get('/skills/:id', async (req, res) => {
    const { id } = req.params;

    const skill = await getSkill(id);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    const status = skill.status === 'generating' ? 'processing' : skill.status;
    const response = { ...skill, status };
    if (skill.status === 'ready' || skill.status === 'failed') {
      response.logUrl = await getLogUrl(id);
    }
    return res.json(response);
  });
}
