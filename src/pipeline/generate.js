import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { model } from './model.js';
import { createLangChainCallbacks } from './logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SYSTEM_PROMPT = readFileSync(join(__dirname, 'prompts/generate-system.md'), 'utf8');

/**
 * Run the generate stage to produce a SKILL.md.
 * @param {object} research - structured research summary from runResearch
 * @param {string[]} [validationErrors] - errors from previous validation attempt (for retries)
 * @param {string} [message] - optional user-supplied context message
 * @param {object} logger
 * @returns {Promise<string>} SKILL.md content
 */
export async function runGenerate(research, validationErrors = [], message, logger) {
  let userContent = `Generate a complete SKILL.md for the following smart contract research:\n\n${JSON.stringify(research, null, 2)}`;

  if (message) {
    userContent += `\n\nAdditional context from user: <user_message>${message}</user_message>`;
  }

  if (validationErrors.length > 0) {
    userContent += `\n\nIMPORTANT: The previous generation attempt failed validation with these errors. Fix all of them:\n${validationErrors.map((e) => `- ${e}`).join('\n')}`;
  }

  const response = await model.invoke([
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(userContent),
  ], {
    callbacks: logger ? createLangChainCallbacks(logger) : [],
  });

  const output = response.content.trim();
  return output;
}
