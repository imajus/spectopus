import { randomUUID } from 'crypto';
import { updateStage, putSkill, markFailed } from '../storage.js';
import { runResearch } from './research.js';
import { runGenerate } from './generate.js';
import { runValidate } from './validate.js';
import { createLogger } from './logger.js';

const MAX_RETRIES = 2;

/**
 * Run the full 3-stage generation pipeline for a skill.
 *
 * @param {string} skillId - UUID for the skill (S3 key)
 * @param {string} contractAddress - contract address to generate skill for
 * @param {number} chainId - chain ID (e.g. 8453 for Base Mainnet)
 * @param {string} [message] - optional user message / extra context
 */
export async function runPipeline(skillId, contractAddress, chainId, message) {
  const runId = randomUUID();
  const logger = createLogger(runId, skillId);
  let retries = 0;

  try {
    // Stage 1: Research
    logger.startStage('research');
    await updateStage(skillId, 'research');

    const research = await runResearch(contractAddress, chainId);

    if (research.abiAvailable === false) {
      throw new Error('Contract ABI is not available — skill generation cannot proceed');
    }

    logger.logDecision(`Research complete: ${research.contractName}, patterns: ${(research.ercPatterns || []).join(', ')}`);
    logger.endStage('success');

    // Stage 2: Generate
    logger.startStage('generate');
    await updateStage(skillId, 'generate');

    let skillContent = await runGenerate(research);
    logger.endStage('success');

    // Stage 3: Validate (with retry loop)
    logger.startStage('validate');
    await updateStage(skillId, 'validate');

    let validation = await runValidate(skillContent, research.abi || []);
    logger.logDecision(`Validation result: ${validation.valid ? 'passed' : 'failed'} (${validation.errors.length} errors)`);

    while (!validation.valid && retries < MAX_RETRIES) {
      retries++;
      logger.endStage(`retry-${retries}`);
      logger.logDecision(`Retrying generate+validate (attempt ${retries}/${MAX_RETRIES}): ${validation.errors.join('; ')}`);

      // Retry: generate with feedback, then re-validate
      logger.startStage(`generate-retry-${retries}`);
      await updateStage(skillId, 'generate');
      skillContent = await runGenerate(research, validation.errors);
      logger.endStage('success');

      logger.startStage(`validate-retry-${retries}`);
      await updateStage(skillId, 'validate');
      validation = await runValidate(skillContent, research.abi || []);
      logger.logDecision(`Retry ${retries} validation: ${validation.valid ? 'passed' : 'failed'}`);
    }

    if (!validation.valid) {
      throw new Error(`Validation failed after ${MAX_RETRIES} retries: ${validation.errors.join('; ')}`);
    }

    logger.endStage('success');

    // Store final skill with status: ready
    const finalContent = markReady(skillContent);
    await putSkill(skillId, finalContent);

    await logger.flush('success', retries);
  } catch (err) {
    logger.endStage('error');
    await markFailed(skillId, err.message);
    await logger.flush('failed', retries);
    throw err;
  }
}

/**
 * Update the status frontmatter field to "ready" in a SKILL.md.
 */
function markReady(content) {
  // If frontmatter exists, add/update status; otherwise prepend it
  if (/^---\n/.test(content)) {
    if (/^status:/m.test(content)) {
      return content.replace(/^status:.*$/m, 'status: "ready"');
    }
    return content.replace(/^---\n/, '---\nstatus: "ready"\n');
  }
  return content;
}
