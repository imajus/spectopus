import { Router } from 'express';
import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { privateKeyToAccount } from 'viem/accounts';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const FACILITATOR_URL = 'https://x402.org/facilitator';
const NETWORK = 'eip155:8453'; // Base Mainnet

function buildResourceServer() {
  return new x402ResourceServer().register(NETWORK, new ExactEvmScheme());
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
      },
      'GET /:id': {
        accepts: {
          scheme: 'exact',
          price: '$0.01',
          network: NETWORK,
          payTo: payToAddress,
        },
        description: 'Download a generated Agent Skill ($0.01 USDC)',
      },
    },
    buildResourceServer(),
  );
}

export function createSkillsRouter() {
  const router = Router();

  const privateKey = process.env.WALLET_PRIVATE_KEY;
  if (privateKey) {
    const account = privateKeyToAccount(privateKey);
    router.use(buildPaymentMiddleware(account.address));
  }

  // POST /skills/generate
  router.post('/generate', async (req, res) => {
    const { contractAddress, chainId, message } = req.body ?? {};

    if (!contractAddress || chainId == null) {
      return res.status(400).json({ error: 'contractAddress and chainId are required' });
    }

    const id = crypto.randomUUID();
    const url = `${BASE_URL}/skills/${id}`;

    // TODO: Create S3 placeholder once storage layer is implemented
    // await createSkillPlaceholder(id, { contractAddress, chainId, message });

    // TODO: Start generation pipeline async (fire-and-forget) once pipeline is implemented
    // runPipeline(id, contractAddress, chainId, message).catch(err => {
    //   console.error(`Pipeline failed for skill ${id}:`, err);
    // });

    return res.json({ id, url });
  });

  // GET /skills/:id
  router.get('/:id', async (req, res) => {
    const { id } = req.params;

    // TODO: Fetch skill content from S3 once storage layer is implemented
    // const skill = await getSkill(id);
    // if (!skill) return res.status(404).json({ error: 'Skill not found' });
    // return res.type('text/markdown').send(skill);

    return res.status(404).json({ error: 'Skill not found' });
  });

  return router;
}
