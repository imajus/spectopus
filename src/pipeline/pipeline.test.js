import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all dependencies before importing the module under test
vi.mock('../storage.js', () => ({
  updateStage: vi.fn().mockResolvedValue(undefined),
  putSkill: vi.fn().mockResolvedValue(undefined),
  markFailed: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./research.js', () => ({
  runResearch: vi.fn(),
}));

vi.mock('./generate.js', () => ({
  runGenerate: vi.fn(),
}));

vi.mock('./validate.js', () => ({
  runValidate: vi.fn(),
}));

vi.mock('./logger.js', () => ({
  createLogger: vi.fn(() => ({
    startStage: vi.fn(),
    logToolCall: vi.fn(),
    logDecision: vi.fn(),
    endStage: vi.fn(),
    flush: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { runPipeline } from './index.js';
import { updateStage, putSkill, markFailed } from '../storage.js';
import { runResearch } from './research.js';
import { runGenerate } from './generate.js';
import { runValidate } from './validate.js';

const MOCK_RESEARCH = {
  contractName: 'TestToken',
  contractAddress: '0x1234',
  chainId: 8453,
  purpose: 'A test ERC-20 token',
  ercPatterns: ['ERC-20'],
  keyFunctions: [],
  gotchas: [],
  abiAvailable: true,
  abi: [],
};

const VALID_SKILL_MD = `---
name: Test Token
description: A test ERC-20 token
metadata:
  contractAddress: "0x1234"
  chainId: 8453
  generator: "spectopus"
---

## Overview
Test token.
`;

describe('runPipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    runResearch.mockResolvedValue(MOCK_RESEARCH);
    runGenerate.mockResolvedValue(VALID_SKILL_MD);
    runValidate.mockResolvedValue({ valid: true, errors: [] });
  });

  it('runs research → generate → validate in sequence', async () => {
    await runPipeline('skill-1', '0x1234');

    expect(runResearch).toHaveBeenCalledWith('0x1234');
    expect(runGenerate).toHaveBeenCalledWith(MOCK_RESEARCH);
    expect(runValidate).toHaveBeenCalledWith(VALID_SKILL_MD, []);
  });

  it('stores the final skill with status ready', async () => {
    await runPipeline('skill-1', '0x1234');

    expect(putSkill).toHaveBeenCalledWith('skill-1', expect.stringContaining('status: "ready"'));
  });

  it('retries generate+validate on validation failure, up to MAX_RETRIES', async () => {
    const failResult = { valid: false, errors: ['Missing warning for payable function'] };
    const passResult = { valid: true, errors: [] };

    runValidate
      .mockResolvedValueOnce(failResult)   // First attempt fails
      .mockResolvedValueOnce(passResult);  // Retry succeeds

    await runPipeline('skill-1', '0x1234');

    expect(runGenerate).toHaveBeenCalledTimes(2);
    expect(runValidate).toHaveBeenCalledTimes(2);
    // Second generate call should include the validation errors
    expect(runGenerate).toHaveBeenNthCalledWith(2, MOCK_RESEARCH, ['Missing warning for payable function']);
    expect(putSkill).toHaveBeenCalledWith('skill-1', expect.stringContaining('status: "ready"'));
  });

  it('marks skill as failed after max retries exceeded', async () => {
    runValidate.mockResolvedValue({ valid: false, errors: ['Error'] });

    await expect(runPipeline('skill-1', '0x1234')).rejects.toThrow();
    expect(markFailed).toHaveBeenCalledWith('skill-1', expect.stringContaining('Validation failed'));
    expect(putSkill).not.toHaveBeenCalled();
  });

  it('marks skill as failed when research stage throws', async () => {
    runResearch.mockRejectedValue(new Error('API unavailable'));

    await expect(runPipeline('skill-1', '0x1234')).rejects.toThrow('API unavailable');
    expect(markFailed).toHaveBeenCalledWith('skill-1', 'API unavailable');
  });

  it('marks skill as failed when ABI is not available', async () => {
    runResearch.mockResolvedValue({ ...MOCK_RESEARCH, abiAvailable: false });

    await expect(runPipeline('skill-1', '0x1234')).rejects.toThrow();
    expect(markFailed).toHaveBeenCalled();
  });

  it('updates S3 stage at each pipeline transition', async () => {
    await runPipeline('skill-1', '0x1234');

    expect(updateStage).toHaveBeenCalledWith('skill-1', 'research');
    expect(updateStage).toHaveBeenCalledWith('skill-1', 'generate');
    expect(updateStage).toHaveBeenCalledWith('skill-1', 'validate');
  });
});
