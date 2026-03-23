import { randomUUID } from 'node:crypto';
import { createPlaceholder } from '../storage.js';
import { runPipeline } from '../pipeline/index.js';
import { isValidAddress } from '../guardrails.js';

const ADDRESS_REGEX = /0x[0-9a-fA-F]{40}/;

/**
 * Extract a contract address from a user message.
 * Supports JSON parts with contractAddress field or plain text containing an Ethereum address.
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
      // Not JSON, continue
    }

    // Try plain text
    const match = text.match(ADDRESS_REGEX);
    if (match && isValidAddress(match[0])) {
      return match[0];
    }
  }

  return null;
}

/**
 * Build a TaskStatusUpdateEvent.
 *
 * @param {string} taskId
 * @param {string} contextId
 * @param {string} state
 * @param {string} messageText
 * @param {boolean} final
 * @returns {import('@a2a-js/sdk/server').AgentExecutionEvent}
 */
function statusEvent(taskId, contextId, state, messageText, final = false) {
  return {
    kind: 'status-update',
    taskId,
    contextId,
    status: {
      state,
      message: {
        role: 'agent',
        parts: [{ kind: 'text', text: messageText }],
        messageId: randomUUID(),
        kind: 'message',
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

export class SpectopusExecutor {
  execute = async (requestContext, eventBus) => {
    const { taskId, contextId } = requestContext;

    const contractAddress = extractContractAddress(requestContext);

    if (!contractAddress) {
      eventBus.publish(
        statusEvent(
          taskId,
          contextId,
          'input-required',
          'Please provide a valid Ethereum contract address on Base Mainnet. ' +
            'You can send it as plain text (e.g. "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913") ' +
            'or as JSON (e.g. {"contractAddress": "0x..."}).',
          true,
        ),
      );
      eventBus.finished();
      return;
    }

    const skillId = randomUUID();

    // Create S3 placeholder so the REST API can also serve this skill
    await createPlaceholder(skillId, { contractAddress });

    eventBus.publish(
      statusEvent(taskId, contextId, 'working', `Starting skill generation for ${contractAddress}...`),
    );

    try {
      await runPipeline(skillId, contractAddress, undefined, (stage) => {
        const msg = STAGE_MESSAGES[stage] ?? `Processing stage: ${stage}`;
        eventBus.publish(statusEvent(taskId, contextId, 'working', msg));
      });

      // Pipeline succeeded — fetch result from storage to get skill content
      const { getSkill } = await import('../storage.js');
      const skill = await getSkill(skillId);
      const skillContent = skill?.content ?? '';

      // Publish artifact
      eventBus.publish({
        kind: 'artifact-update',
        taskId,
        contextId,
        artifact: {
          artifactId: skillId,
          name: 'SKILL.md',
          description: `Agent skill for contract ${contractAddress}`,
          parts: [{ kind: 'text', text: skillContent }],
        },
        final: false,
      });

      // Publish completed status
      eventBus.publish(
        statusEvent(taskId, contextId, 'completed', `Skill generation complete. Skill ID: ${skillId}`, true),
      );
    } catch (err) {
      eventBus.publish(
        statusEvent(taskId, contextId, 'failed', `Skill generation failed: ${err.message}`, true),
      );
    }

    eventBus.finished();
  };

  cancelTask = async (taskId, eventBus) => {
    // Pipeline runs to completion; cancellation just marks the task canceled
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
}
