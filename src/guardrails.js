const ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/;

const OUTPUT_BLOCKLIST = [
  'IGNORE PREVIOUS',
  'IGNORE ALL PREVIOUS',
  '<|im_start|>',
  '<|im_end|>',
  '<|system|>',
  'SYSTEM:',
  'USER:',
  'ASSISTANT:',
  '###INSTRUCTION',
  'Ignore above',
  'Disregard previous',
];

/**
 * Check if a string is a valid Ethereum address.
 * @param {string} addr
 * @returns {boolean}
 */
export function isValidAddress(addr) {
  return typeof addr === 'string' && ADDRESS_REGEX.test(addr);
}

/**
 * Strip control characters and enforce max length on a message string.
 * @param {string} msg
 * @param {number} maxLen
 * @returns {string}
 */
export function sanitizeMessage(msg, maxLen) {
  if (typeof msg !== 'string') return '';
  // Strip control characters (except newline/tab which are legitimate)
  const stripped = msg.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return stripped.slice(0, maxLen);
}

/**
 * Scan generated output for known prompt injection patterns.
 * @param {string} content
 * @returns {{ safe: boolean, reason: string | null }}
 */
export function scanOutput(content) {
  if (typeof content !== 'string') return { safe: false, reason: 'Output is not a string' };

  for (const pattern of OUTPUT_BLOCKLIST) {
    if (content.toUpperCase().includes(pattern.toUpperCase())) {
      return { safe: false, reason: `Output contains blocked pattern: "${pattern}"` };
    }
  }

  return { safe: true, reason: null };
}
