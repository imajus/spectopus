import { Router } from 'express';
import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { createThirdwebClient } from 'thirdweb';
import { facilitator as createFacilitator } from 'thirdweb/x402';
import { declareDiscoveryExtension } from '@x402/extensions/bazaar';
import { createPlaceholder, getSkill } from '../storage.js';
import { runPipeline } from '../pipeline/index.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const NETWORK = 'eip155:8453'; // Base Mainnet

function buildResourceServer() {
  const client = createThirdwebClient({ secretKey: process.env.THIRDWEB_SECRET_KEY });
  const serverWalletAddress = process.env.THIRDWEB_SERVER_WALLET_ADDRESS;
  const f = createFacilitator({ client, serverWalletAddress });
  return new x402ResourceServer(f).register(NETWORK, new ExactEvmScheme());
}

function buildPaymentMiddleware(payToAddress) {
  return paymentMiddleware(
    {
      'POST /generate': {
        accepts: {
          scheme: 'exact',
          price: '$0.10',
          network: NETWORK,
          payTo: payToAddress,
        },
        description: 'Generate an Agent Skill for a smart contract ($0.10 USDC)',
        ...declareDiscoveryExtension({
          bodyType: 'json',
          input: { contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
        }),
      },
      'GET /:id': {
        accepts: {
          scheme: 'exact',
          price: '$0.01',
          network: NETWORK,
          payTo: payToAddress,
        },
        description: 'Download a generated Agent Skill ($0.01 USDC)',
        ...declareDiscoveryExtension({}),
      },
    },
    buildResourceServer(),
  );
}

export function createSkillsRouter() {
  const router = Router();

  const payToAddress = process.env.THIRDWEB_SERVER_WALLET_ADDRESS;
  if (payToAddress) {
    router.use(buildPaymentMiddleware(payToAddress));
  }

  // POST /skills/generate
  router.post('/generate', async (req, res) => {
    const { contractAddress, message } = req.body ?? {};

    if (!contractAddress) {
      return res.status(400).json({ error: 'contractAddress is required' });
    }

    const id = crypto.randomUUID();
    const url = `${BASE_URL}/skills/${id}`;

    await createPlaceholder(id, { contractAddress });

    runPipeline(id, contractAddress, message).catch(err => {
      console.error(`Pipeline failed for skill ${id}:`, err);
    });

    return res.json({ id, url });
  });

  // GET /skills/:id
  router.get('/:id', async (req, res) => {
    const { id } = req.params;

    const skill = await getSkill(id);
    if (!skill) return res.status(404).json({ error: 'Skill not found' });
    return res.type('text/markdown').send(skill);
  });

  return router;
}
