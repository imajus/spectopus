import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkFrontmatter, runValidate } from './validate.js';

// Mock the model to avoid real API calls
vi.mock('./model.js', () => ({
  model: {
    invoke: vi.fn().mockResolvedValue({ content: '{ "valid": true, "errors": [] }' }),
  },
}));

const VALID_SKILL = `---
name: Test Token
description: A test ERC-20 token skill
metadata:
  contractAddress: "0x1234567890abcdef1234567890abcdef12345678"
  chainId: 8453
  generator: "spectopus"
---

## Overview

This is a test token contract.

## Usage

Use this skill to interact with the test token.

## Code Examples

\`\`\`typescript
const balance = await client.readContract({
  address: '0x1234...',
  abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
  functionName: 'balanceOf',
  args: ['0xuser...'],
})
\`\`\`

## Gotchas

- Always approve before transferFrom
`;

describe('checkFrontmatter', () => {
  it('passes for valid SKILL.md with all required fields', () => {
    const result = checkFrontmatter(VALID_SKILL);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails when frontmatter delimiters are missing', () => {
    const result = checkFrontmatter('# No frontmatter here');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing YAML frontmatter (--- delimiters not found)');
  });

  it('fails when name field is missing', () => {
    const content = VALID_SKILL.replace(/^name:.*\n/m, '');
    const result = checkFrontmatter(content);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required frontmatter field: name');
  });

  it('fails when description field is missing', () => {
    const content = VALID_SKILL.replace(/^description:.*\n/m, '');
    const result = checkFrontmatter(content);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required frontmatter field: description');
  });

  it('fails when metadata block is missing', () => {
    const content = VALID_SKILL.replace(/^metadata:[\s\S]*?generator:.*\n/m, '');
    const result = checkFrontmatter(content);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required frontmatter field: metadata');
  });

  it('fails when metadata.contractAddress is missing', () => {
    const content = VALID_SKILL.replace(/^\s*contractAddress:.*\n/m, '');
    const result = checkFrontmatter(content);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required frontmatter field: metadata.contractAddress');
  });

  it('fails when metadata.chainId is missing', () => {
    const content = VALID_SKILL.replace(/^\s*chainId:.*\n/m, '');
    const result = checkFrontmatter(content);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required frontmatter field: metadata.chainId');
  });

  it('fails when metadata.generator is missing', () => {
    const content = VALID_SKILL.replace(/^\s*generator:.*\n/m, '');
    const result = checkFrontmatter(content);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required frontmatter field: metadata.generator');
  });

  it('collects multiple errors at once', () => {
    const content = VALID_SKILL.replace(/^name:.*\n/m, '').replace(/^description:.*\n/m, '');
    const result = checkFrontmatter(content);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });
});

describe('runValidate', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { model } = await import('./model.js');
    model.invoke.mockResolvedValue({ content: '{ "valid": true, "errors": [] }' });
  });

  it('returns valid: true when all checks pass', async () => {
    const result = await runValidate(VALID_SKILL, []);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns valid: false with errors when frontmatter is invalid', async () => {
    const result = await runValidate('# No frontmatter', []);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
