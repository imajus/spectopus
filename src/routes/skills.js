import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { facilitator as payaiFacilitator } from '@payai/facilitator';
import { declareDiscoveryExtension } from '@x402/extensions/bazaar';
import { createSession, getSession, getLogUrl, fetchSkill } from '../storage.js';
import { runPipeline } from '../pipeline/index.js';
import { isValidAddress, sanitizeMessage } from '../guardrails.js';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function buildPaymentMiddleware(payToAddress) {
  const facilitatorClient = new HTTPFacilitatorClient(payaiFacilitator);
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
    const sessionId = crypto.randomUUID();
    const statusUrl = `${BASE_URL}/skills/status/${sessionId}`;
    await createSession(sessionId, { contractAddress });
    runPipeline(sessionId, contractAddress, sanitizedMessage).catch(err => {
      console.error(`Pipeline failed for session ${sessionId}:`, err);
    });
    return res.json({ sessionId, statusUrl });
  });

  app.get('/skills/status/:sid', async (req, res) => {
    const { sid } = req.params;
    const session = await getSession(sid);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const status = session.status === 'generating' ? 'processing' : session.status;
    const response = { sessionId: sid, status, stage: session.stage };
    if (session.skillId) response.skillId = session.skillId;
    if (session.status === 'ready' || session.status === 'failed') {
      response.logUrl = await getLogUrl(sid);
    }
    if (session.error) response.error = session.error;
    return res.json(response);
  });

  app.get('/skills/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const content = await fetchSkill(id);
      return res.type('text/markdown').send(content);
    } catch (err) {
      return res.status(404).json({ error: 'Skill not found on Filecoin' });
    }
  });
}
