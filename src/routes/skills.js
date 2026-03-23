import { paymentMiddleware } from 'x402-express';
import { createThirdwebClient } from 'thirdweb';
import { facilitator as createFacilitator } from 'thirdweb/x402';
import { createPlaceholder, getSkill, getLogUrl } from '../storage.js';
import { runPipeline } from '../pipeline/index.js';
import { isValidAddress, sanitizeMessage } from '../guardrails.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function buildPaymentMiddleware(payToAddress) {
  const client = createThirdwebClient({ secretKey: process.env.THIRDWEB_SECRET_KEY });
  const thirdwebFacilitator = createFacilitator({ client, serverWalletAddress: payToAddress });
  return paymentMiddleware(
    payToAddress,
    {
      'POST /skills/generate': {
        price: '$0.10',
        network: 'base',
        config: { description: 'Generate an Agent Skill for a smart contract ($0.10 USDC)' },
      },
      'GET /skills/[id]': {
        price: '$0.01',
        network: 'base',
        config: { description: 'Download a generated Agent Skill ($0.01 USDC)' },
      },
    },
    thirdwebFacilitator,
  );
}

export function registerSkillsRoutes(app) {
  const payToAddress = process.env.THIRDWEB_SERVER_WALLET_ADDRESS;
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
