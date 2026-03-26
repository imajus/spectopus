import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock storage and pipeline so tests don't hit S3 or LLMs
vi.mock('../storage.js', () => ({
  createPlaceholder: vi.fn().mockResolvedValue(undefined),
  getSkill: vi.fn().mockResolvedValue({ content: '# SKILL' }),
}));

vi.mock('../pipeline/index.js', () => ({
  runPipeline: vi.fn().mockResolvedValue(undefined),
}));

// Shared mock resource server instance (accessible from tests)
const mockResourceServer = {
  register: vi.fn().mockReturnThis(),
  buildPaymentRequirements: vi.fn().mockResolvedValue([
    {
      scheme: 'exact',
      network: 'eip155:8453',
      asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      amount: '100000',
      payTo: '0x0000000000000000000000000000000000000001',
      maxTimeoutSeconds: 300,
      extra: {},
    },
  ]),
  verifyPayment: vi.fn().mockResolvedValue({ isValid: true }),
  settlePayment: vi.fn().mockResolvedValue({
    success: true,
    transaction: '0xabc123',
    network: 'eip155:8453',
  }),
};

vi.mock('@x402/core/server', () => ({
  HTTPFacilitatorClient: class {},
  x402ResourceServer: class {
    constructor() {
      Object.assign(this, mockResourceServer);
    }
  },
}));

vi.mock('@x402/evm/exact/server', () => ({
  ExactEvmScheme: class {},
}));

vi.mock('@payai/facilitator', () => ({
  facilitator: {},
}));

// Import after mocks are set up
const { SpectopusExecutor } = await import('./executor.js');

function makeMessage(text, metadata) {
  return {
    role: 'user',
    kind: 'message',
    messageId: 'msg-1',
    parts: [{ kind: 'text', text }],
    ...(metadata ? { metadata } : {}),
  };
}

function makeContext(userMessage, task = undefined) {
  return {
    taskId: 'task-1',
    contextId: 'ctx-1',
    userMessage,
    task,
  };
}

function makeEventBus() {
  const events = [];
  return {
    events,
    publish: vi.fn((e) => events.push(e)),
    finished: vi.fn(),
  };
}

describe('SpectopusExecutor', () => {
  let executor;

  beforeEach(() => {
    vi.clearAllMocks();
    mockResourceServer.register.mockReturnThis();
    mockResourceServer.buildPaymentRequirements.mockResolvedValue([
      {
        scheme: 'exact', network: 'eip155:8453',
        asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        amount: '100000', payTo: '0x1', maxTimeoutSeconds: 300, extra: {},
      },
    ]);
    mockResourceServer.verifyPayment.mockResolvedValue({ isValid: true });
    mockResourceServer.settlePayment.mockResolvedValue({
      success: true, transaction: '0xabc123', network: 'eip155:8453',
    });
    executor = new SpectopusExecutor('0x0000000000000000000000000000000000000001');
  });

  describe('contract address extraction', () => {
    it('extracts address from JSON body', async () => {
      const eb = makeEventBus();
      await executor.execute(
        makeContext(makeMessage('{"contractAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"}')),
        eb,
      );
      expect(eb.events[0].status.state).toBe('input-required');
      expect(eb.events[0].status.message.metadata['x402.payment.status']).toBe('payment-required');
    });

    it('extracts address from plain text', async () => {
      const eb = makeEventBus();
      await executor.execute(
        makeContext(makeMessage('Generate skill for 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913')),
        eb,
      );
      expect(eb.events[0].status.state).toBe('input-required');
      expect(eb.events[0].status.message.metadata['x402.payment.status']).toBe('payment-required');
    });

    it('transitions to input-required when no address found', async () => {
      const eb = makeEventBus();
      await executor.execute(makeContext(makeMessage('Hello, what can you do?')), eb);
      const event = eb.events[0];
      expect(event.status.state).toBe('input-required');
      expect(event.final).toBe(true);
      expect(eb.finished).toHaveBeenCalled();
    });
  });

  describe('payment flow', () => {
    it('returns payment-required on first message with valid address', async () => {
      const eb = makeEventBus();
      await executor.execute(
        makeContext(makeMessage('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913')),
        eb,
      );
      const event = eb.events[0];
      expect(event.status.state).toBe('input-required');
      expect(event.status.message.metadata['x402.payment.status']).toBe('payment-required');
      expect(event.status.message.metadata['x402.payment.required']).toBeDefined();
    });

    it('verifies and settles payment, then runs pipeline on second message', async () => {
      // First message: establish task state
      const eb1 = makeEventBus();
      await executor.execute(
        makeContext(makeMessage('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913')),
        eb1,
      );

      // Second message: payment submission (taskId must match)
      const fakeTask = { id: 'task-1', status: { state: 'input-required' } };
      const eb2 = makeEventBus();
      await executor.execute(
        makeContext(
          makeMessage('paying', { 'x402.payment.payload': { x402Version: 2, payload: {} } }),
          fakeTask,
        ),
        eb2,
      );

      const states = eb2.events.map((e) => e.status?.state);
      expect(states).toContain('working');
      expect(states).toContain('completed');

      const completedEvent = eb2.events.find((e) => e.status?.state === 'completed');
      expect(completedEvent.status.message.metadata['x402.payment.receipts']).toHaveLength(1);
    });

    it('transitions to failed on invalid payment', async () => {
      mockResourceServer.verifyPayment.mockResolvedValueOnce({
        isValid: false,
        invalidReason: 'bad_signature',
      });

      // First message
      const eb1 = makeEventBus();
      await executor.execute(
        makeContext(makeMessage('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913')),
        eb1,
      );

      const fakeTask = { id: 'task-1', status: { state: 'input-required' } };
      const eb2 = makeEventBus();
      await executor.execute(
        makeContext(
          makeMessage('paying', { 'x402.payment.payload': { x402Version: 2, payload: {} } }),
          fakeTask,
        ),
        eb2,
      );

      const failedEvent = eb2.events.find((e) => e.status?.state === 'failed');
      expect(failedEvent).toBeDefined();
      expect(failedEvent.status.message.metadata['x402.payment.status']).toBe('payment-failed');
    });
  });
});
