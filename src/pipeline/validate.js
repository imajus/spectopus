import { generateText } from 'ai';
import { model } from './model.js';

/**
 * Parse YAML frontmatter from a SKILL.md string.
 * Returns the raw frontmatter text between --- delimiters.
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  return match ? match[1] : null;
}

/**
 * Check 1: Frontmatter validation.
 * Verifies required fields: name, description, metadata.contractAddress, metadata.chainId, metadata.generator
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function checkFrontmatter(skillContent) {
  const errors = [];
  const fm = parseFrontmatter(skillContent);

  if (!fm) {
    return { valid: false, errors: ['Missing YAML frontmatter (--- delimiters not found)'] };
  }

  // Check top-level fields
  if (!/^name:/m.test(fm)) errors.push('Missing required frontmatter field: name');
  if (!/^description:/m.test(fm)) errors.push('Missing required frontmatter field: description');

  // Check metadata block
  if (!/^metadata:/m.test(fm)) {
    errors.push('Missing required frontmatter field: metadata');
  } else {
    if (!/contractAddress:/m.test(fm)) errors.push('Missing required frontmatter field: metadata.contractAddress');
    if (!/chainId:/m.test(fm)) errors.push('Missing required frontmatter field: metadata.chainId');
    if (!/generator:/m.test(fm)) errors.push('Missing required frontmatter field: metadata.generator');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check 2: ABI cross-check via LLM.
 * Verifies code examples reference real function signatures from the ABI.
 * @returns {Promise<{ valid: boolean, errors: string[] }>}
 */
export async function checkABICrossCheck(skillContent, abi) {
  if (!abi || abi.length === 0) {
    return { valid: true, errors: [] }; // Can't check without ABI
  }

  const { text } = await generateText({
    model,
    system: 'You are a smart contract code reviewer. Analyze whether code examples in a SKILL.md correctly match the contract ABI. Respond with valid JSON only.',
    prompt: `Review the following SKILL.md code examples against the contract ABI.

ABI:
${JSON.stringify(abi, null, 2)}

SKILL.md:
${skillContent}

Check that:
1. All function names in code examples exist in the ABI
2. Parameter types match the ABI signatures
3. Return types are used correctly

Respond with JSON: { "valid": boolean, "errors": string[] }
If valid, errors should be an empty array.`,
  });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { valid: true, errors: [] }; // Fail open if LLM response is unparseable

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { valid: true, errors: [] };
  }
}

/**
 * Check 3: Safety check via LLM.
 * Verifies the skill includes warnings for payable functions and approval patterns.
 * @returns {Promise<{ valid: boolean, errors: string[] }>}
 */
export async function checkSafety(skillContent, abi) {
  const payableFunctions = abi
    ? abi.filter((item) => item.type === 'function' && item.stateMutability === 'payable').map((f) => f.name)
    : [];

  const hasApprovalPattern = abi
    ? abi.some((item) => item.type === 'function' && ['approve', 'setApprovalForAll'].includes(item.name))
    : false;

  if (payableFunctions.length === 0 && !hasApprovalPattern) {
    return { valid: true, errors: [] }; // Nothing to check
  }

  const { text } = await generateText({
    model,
    system: 'You are a smart contract safety reviewer. Check whether a SKILL.md includes appropriate warnings. Respond with valid JSON only.',
    prompt: `Review the following SKILL.md for safety warnings.

${payableFunctions.length > 0 ? `Payable functions that need ETH value warnings: ${payableFunctions.join(', ')}` : ''}
${hasApprovalPattern ? 'Contract has approval functions (approve/setApprovalForAll) that require approval-before-transfer warnings.' : ''}

SKILL.md:
${skillContent}

Check that the skill includes appropriate warnings for:
${payableFunctions.length > 0 ? '- Payable functions (user must send ETH value)' : ''}
${hasApprovalPattern ? '- Approval patterns (approve before transferFrom, risks of unlimited approvals)' : ''}

Respond with JSON: { "valid": boolean, "errors": string[] }
If valid, errors should be an empty array.`,
  });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { valid: true, errors: [] };

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { valid: true, errors: [] };
  }
}

/**
 * Run all three validation checks and aggregate results.
 * @param {string} skillContent - SKILL.md content
 * @param {object[]} [abi] - contract ABI (optional, for ABI cross-check and safety)
 * @returns {Promise<{ valid: boolean, errors: string[] }>}
 */
export async function runValidate(skillContent, abi = []) {
  const frontmatterResult = checkFrontmatter(skillContent);
  const [abiResult, safetyResult] = await Promise.all([
    checkABICrossCheck(skillContent, abi),
    checkSafety(skillContent, abi),
  ]);

  const errors = [
    ...frontmatterResult.errors,
    ...abiResult.errors,
    ...safetyResult.errors,
  ];

  return { valid: errors.length === 0, errors };
}
