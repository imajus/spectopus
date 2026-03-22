import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { generateText } from 'ai';
import { model } from './model.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SYSTEM_PROMPT = readFileSync(join(__dirname, 'prompts/generate-system.md'), 'utf8');

/**
 * Run the generate stage to produce a SKILL.md.
 * @param {object} research - structured research summary from runResearch
 * @param {string[]} [validationErrors] - errors from previous validation attempt (for retries)
 * @returns {Promise<string>} SKILL.md content
 */
export async function runGenerate(research, validationErrors = []) {
  let prompt = `Generate a complete SKILL.md for the following smart contract research:\n\n${JSON.stringify(research, null, 2)}`;

  if (validationErrors.length > 0) {
    prompt += `\n\nIMPORTANT: The previous generation attempt failed validation with these errors. Fix all of them:\n${validationErrors.map((e) => `- ${e}`).join('\n')}`;
  }

  const { text } = await generateText({
    model,
    system: SYSTEM_PROMPT,
    prompt,
  });

  return text.trim();
}
