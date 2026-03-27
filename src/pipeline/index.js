import { updateStage, markReady, markFailed, putLog } from '../storage.js';
import { runResearch } from './research.js';
import { runGenerate } from './generate.js';
import { runValidate } from './validate.js';
import { scanOutput } from '../guardrails.js';
import { createLogger } from './logger.js';

const MAX_RETRIES = 2;

/**
 * Run the full 3-stage generation pipeline for a skill.
 *
 * @param {string} sessionId - session ID for tracking pipeline progress
 * @param {string} contractAddress - contract address to generate skill for
 * @param {string} [message] - optional user message / extra context
 * @param {Function} [onProgress] - optional callback(stage: string) called at each stage transition
 */
export async function runPipeline(sessionId, contractAddress, message, onProgress) {
  let retries = 0;
  const logger = createLogger(sessionId, contractAddress);
  try {
    // Stage 1: Research
    await updateStage(sessionId, 'research');
    logger.startStage('research');
    onProgress?.('research');

    const research = await runResearch(contractAddress, logger);
    logger.logDecision(`ABI available: ${research.abiAvailable}`);
    if (research.abiAvailable === false) {
      logger.endStage({ abiAvailable: false });
      throw new Error('Contract ABI is not available — skill generation cannot proceed');
    }
    logger.endStage({ abiAvailable: true, contractName: research.contractName });
    // Stage 2: Generate
    await updateStage(sessionId, 'generate');
    logger.startStage('generate');
    onProgress?.('generate');

    let skillContent = await runGenerate(research, [], message, logger);
    logger.endStage({ generated: true });
    // Stage 3: Validate (with retry loop)
    await updateStage(sessionId, 'validate');
    logger.startStage('validate');
    onProgress?.('validate');

    let validation = await runValidate(skillContent, research.abi || [], logger);
    while (!validation.valid && retries < MAX_RETRIES) {
      retries++;
      logger.logDecision(`Validation failed, retrying (attempt ${retries}): ${validation.errors.join('; ')}`);
      logger.endStage({ valid: false, errors: validation.errors });
      // Retry: generate with feedback, then re-validate
      await updateStage(sessionId, 'generate');
      logger.startStage('generate');
      onProgress?.('generate');
      skillContent = await runGenerate(research, validation.errors, message, logger);
      logger.endStage({ generated: true, retry: retries });
      await updateStage(sessionId, 'validate');
      logger.startStage('validate');
      onProgress?.('validate');
      validation = await runValidate(skillContent, research.abi || [], logger);
    }
    if (!validation.valid) {
      logger.endStage({ valid: false, errors: validation.errors });
      throw new Error(`Validation failed after ${MAX_RETRIES} retries: ${validation.errors.join('; ')}`);
    }
    // Output safety scan before storing
    const outputScan = scanOutput(skillContent);
    if (!outputScan.safe) {
      throw new Error(`Output safety scan failed: ${outputScan.reason}`);
    }
    logger.endStage({ valid: true });
    // Finish & upload log data
    await logger.flush('success', null);
    await putLog(sessionId, logger.log);
    // Store final skill with status: ready
    await markReady(sessionId, skillContent);
  } catch (err) {
    // Mark final status: failed
    await markFailed(sessionId, err.message);
    // Finish log
    await logger.flush('failed', err.message).catch(() => {});
    throw err;
  }
}
