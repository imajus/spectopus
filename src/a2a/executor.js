import { randomUUID } from 'node:crypto';
import { HTTPFacilitatorClient, x402ResourceServer } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import { facilitator as payaiFacilitator } from '@payai/facilitator';
import { createSession } from '../storage.js';
import { runPipeline } from '../pipeline/index.js';
import { isValidAddress } from '../guardrails.js';
import { getPieceUrl } from '#synapse.js';

const ADDRESS_REGEX = /0x[0-9a-fA-F]{40}/;

// In-memory store: taskId → { contractAddress, paymentRequirements }
const taskState = new Map();

/**
 * Extract a contract address from the user message parts.
 * Tries JSON parse first, then plain text regex.
 *
 * @param {import('@a2a-js/sdk/server').RequestContext} requestContext
 * @returns {string|null}
 */
function extractContractAddress(requestContext) {
  const parts = requestContext.userMessage?.parts ?? [];

  for (const part of parts) {
    if (part.kind !== 'text') continue;
    const text = part.text ?? '';

    // Try JSON first
    try {
      const parsed = JSON.parse(text);
      if (parsed.contractAddress && isValidAddress(parsed.contractAddress)) {
        return parsed.contractAddress;
      }
    } catch {
      // Not JSON — fall through to regex
    }

    // Regex fallback
    const match = text.match(ADDRESS_REGEX);
    if (match && isValidAddress(match[0])) {
      return match[0];
    }
  }

  return null;
}

/**
 * Build a TaskStatusUpdateEvent.
 */
function statusEvent(taskId, contextId, state, messageText, metadata, final = false) {
  return {
    kind: 'status-update',
    taskId,
    contextId,
    status: {
      state,
      message: {
        role: 'agent',
        kind: 'message',
        messageId: randomUUID(),
        parts: [{ kind: 'text', text: messageText }],
        ...(metadata ? { metadata } : {}),
      },
      timestamp: new Date().toISOString(),
    },
    final,
  };
}

const STAGE_MESSAGES = {
  research: 'Researching the smart contract: fetching ABI and source code...',
  generate: 'Generating SKILL.md from contract analysis...',
  validate: 'Validating generated skill against spec...',
};

function buildResourceServer(payToAddress) {
  const facilitatorClient = new HTTPFacilitatorClient(payaiFacilitator);
  return new x402ResourceServer(facilitatorClient).register('eip155:8453', new ExactEvmScheme());
}

export class SpectopusExecutor {
  constructor(payToAddress) {
    this.payToAddress = payToAddress ?? process.env.PAY_TO_ADDRESS ?? '';
    this._resourceServer = buildResourceServer(this.payToAddress);
  }

  execute = async (requestContext, eventBus) => {
    const { taskId, contextId, task: existingTask, userMessage } = requestContext;

    // --- Second message: payment payload submission ---
    const paymentPayload = userMessage?.metadata?.['x402.payment.payload'];
    if (paymentPayload && existingTask) {
      await this._handlePaymentSubmission(
        taskId,
        contextId,
        paymentPayload,
        existingTask,
        eventBus,
      );
      return;
    }

    // --- First message: contract address ---
    const contractAddress = extractContractAddress(requestContext);

    if (!contractAddress) {
      eventBus.publish(
        statusEvent(
          taskId,
          contextId,
          'input-required',
          'Please provide a valid Ethereum contract address on Base Mainnet. ' +
            'You can send it as plain text or as JSON: {"contractAddress": "0x..."}',
          { 'x402.payment.status': 'address-required' },
          true,
        ),
      );
      eventBus.finished();
      return;
    }

    // Build payment requirements
    let paymentRequirements;
    try {
      const reqs = await this._resourceServer.buildPaymentRequirements({
        scheme: 'exact',
        network: 'eip155:8453',
        price: '$0.10',
        payTo: this.payToAddress,
      });
      paymentRequirements = reqs[0];
    } catch (err) {
      // If payment setup fails (e.g. no PAY_TO_ADDRESS), proceed without payment gate
      paymentRequirements = null;
    }

    // Store state for the second call
    taskState.set(taskId, { contractAddress, paymentRequirements });

    if (paymentRequirements) {
      eventBus.publish(
        statusEvent(
          taskId,
          contextId,
          'input-required',
          `Contract address accepted: ${contractAddress}. ` +
            'Please submit a signed payment payload of $0.10 USDC on Base to proceed.',
          {
            'x402.payment.status': 'payment-required',
            'x402.payment.required': paymentRequirements,
          },
          true,
        ),
      );
    } else {
      // No payment configured — run pipeline directly
      await this._runPipelineAndPublish(taskId, contextId, contractAddress, null, eventBus);
    }

    eventBus.finished();
  };

  cancelTask = async (taskId, eventBus) => {
    taskState.delete(taskId);
    eventBus.publish({
      kind: 'status-update',
      taskId,
      contextId: '',
      status: {
        state: 'canceled',
        timestamp: new Date().toISOString(),
      },
      final: true,
    });
    eventBus.finished();
  };

  async _handlePaymentSubmission(taskId, contextId, paymentPayload, existingTask, eventBus) {
    const state = taskState.get(taskId);

    if (!state) {
      eventBus.publish(
        statusEvent(taskId, contextId, 'failed', 'Task state not found. Please start a new request.', null, true),
      );
      eventBus.finished();
      return;
    }

    const { contractAddress, paymentRequirements } = state;

    // Verify payment
    eventBus.publish(
      statusEvent(taskId, contextId, 'working', 'Verifying payment...', {
        'x402.payment.status': 'payment-submitted',
      }),
    );

    let settleResponse;
    try {
      const verifyResponse = await this._resourceServer.verifyPayment(
        paymentPayload,
        paymentRequirements,
      );

      if (!verifyResponse.isValid) {
        eventBus.publish(
          statusEvent(
            taskId,
            contextId,
            'failed',
            `Payment verification failed: ${verifyResponse.invalidReason ?? 'unknown reason'}`,
            {
              'x402.payment.status': 'payment-failed',
              'x402.payment.error': verifyResponse.invalidReason ?? 'verification_failed',
            },
            true,
          ),
        );
        eventBus.finished();
        return;
      }

      eventBus.publish(
        statusEvent(taskId, contextId, 'working', 'Payment verified. Settling on-chain...', {
          'x402.payment.status': 'payment-verified',
        }),
      );

      settleResponse = await this._resourceServer.settlePayment(paymentPayload, paymentRequirements);

      if (!settleResponse.success) {
        eventBus.publish(
          statusEvent(
            taskId,
            contextId,
            'failed',
            `Payment settlement failed: ${settleResponse.errorReason ?? 'unknown error'}`,
            {
              'x402.payment.status': 'payment-failed',
              'x402.payment.error': settleResponse.errorReason ?? 'settlement_failed',
            },
            true,
          ),
        );
        eventBus.finished();
        return;
      }
    } catch (err) {
      eventBus.publish(
        statusEvent(
          taskId,
          contextId,
          'failed',
          `Payment processing error: ${err.message}`,
          {
            'x402.payment.status': 'payment-failed',
            'x402.payment.error': err.message,
          },
          true,
        ),
      );
      eventBus.finished();
      return;
    }

    taskState.delete(taskId);

    await this._runPipelineAndPublish(
      taskId,
      contextId,
      contractAddress,
      settleResponse,
      eventBus,
    );

    eventBus.finished();
  }

  async _runPipelineAndPublish(taskId, contextId, contractAddress, settleResponse, eventBus) {
    const sessionId = await createSession({ contractAddress });
    eventBus.publish(
      statusEvent(
        taskId,
        contextId,
        'working',
        `Starting skill generation for ${contractAddress}...`,
        settleResponse ? { 'x402.payment.status': 'payment-completed' } : null,
      ),
    );

    const receipts = settleResponse
      ? [{ transaction: settleResponse.transaction, network: settleResponse.network }]
      : [];

    try {
      await runPipeline(sessionId, contractAddress, undefined, (stage) => {
        const msg = STAGE_MESSAGES[stage] ?? `Processing stage: ${stage}`;
        eventBus.publish(statusEvent(taskId, contextId, 'working', msg, null));
      });

      const session = await getSession(sessionId);
      const skillUrl = await getPieceUrl(session.skillCid);
      const skillContent = await fetch(skillUrl);

      // Publish artifact
      eventBus.publish({
        kind: 'artifact-update',
        taskId,
        contextId,
        artifact: {
          artifactId: sessionId,
          name: 'SKILL.md',
          description: `Agent skill for contract ${contractAddress}`,
          parts: [{ kind: 'text', text: skillContent }],
        },
        final: false,
      });

      eventBus.publish(
        statusEvent(
          taskId,
          contextId,
          'completed',
          `Skill generation complete. Skill ID: ${session.skillCid.toString()}`,
          { 'x402.payment.receipts': receipts },
          true,
        ),
      );
    } catch (err) {
      eventBus.publish(
        statusEvent(
          taskId,
          contextId,
          'failed',
          `Skill generation failed: ${err.message}`,
          { 'x402.payment.receipts': receipts },
          true,
        ),
      );
    }
  }
}
