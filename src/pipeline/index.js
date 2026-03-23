import { updateStage, markReady, markFailed } from '../storage.js';
import { runResearch } from './research.js';
import { runGenerate } from './generate.js';
import { runValidate } from './validate.js';
import { scanOutput } from '../guardrails.js';

const MAX_RETRIES = 2;

/**
 * Run the full 3-stage generation pipeline for a skill.
 *
 * @param {string} skillId - UUID for the skill (S3 key)
 * @param {string} contractAddress - contract address to generate skill for
 * @param {string} [message] - optional user message / extra context
 * @param {Function} [onProgress] - optional callback(stage: string) called at each stage transition
 */
export async function runPipeline(skillId, contractAddress, message, onProgress) {
  let retries = 0;

  try {
    // Stage 1: Research
    await updateStage(skillId, 'research');
    onProgress?.('research');

    const research = await runResearch(contractAddress);

    if (research.abiAvailable === false) {
      throw new Error('Contract ABI is not available — skill generation cannot proceed');
    }

    // Stage 2: Generate
    await updateStage(skillId, 'generate');
    onProgress?.('generate');

    let skillContent = await runGenerate(research, [], message);

    // Stage 3: Validate (with retry loop)
    await updateStage(skillId, 'validate');
    onProgress?.('validate');

    let validation = await runValidate(skillContent, research.abi || []);

    while (!validation.valid && retries < MAX_RETRIES) {
      retries++;

      // Retry: generate with feedback, then re-validate
      await updateStage(skillId, 'generate');
      onProgress?.('generate');
      skillContent = await runGenerate(research, validation.errors, message);

      await updateStage(skillId, 'validate');
      onProgress?.('validate');
      validation = await runValidate(skillContent, research.abi || []);
    }

    if (!validation.valid) {
      throw new Error(`Validation failed after ${MAX_RETRIES} retries: ${validation.errors.join('; ')}`);
    }

    // Output safety scan before storing
    const outputScan = scanOutput(skillContent);
    if (!outputScan.safe) {
      throw new Error(`Output safety scan failed: ${outputScan.reason}`);
    }

    // Store final skill with status: ready
    await markReady(skillId, skillContent);

  } catch (err) {
    await markFailed(skillId, err.message);
    throw err;
  }
}

