import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchABI, fetchSourceCode } from './explorer.js';

beforeEach(() => {
  process.env.ETHERSCAN_API_KEY = 'test-key';
});

describe('fetchABI', () => {
  it('returns parsed ABI for a verified contract', async () => {
    const abi = [{ type: 'function', name: 'transfer' }];
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ status: '1', result: JSON.stringify(abi) }),
    });

    const result = await fetchABI('0xabc');
    expect(result).toEqual(abi);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('basescan.org'));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('test-key'));
  });

  it('returns null for unverified contract', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ status: '0', result: 'Contract source code not verified' }),
    });

    const result = await fetchABI('0xabc');
    expect(result).toBeNull();
  });
});

describe('fetchSourceCode', () => {
  it('returns source code string for a verified contract', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          status: '1',
          result: [{ SourceCode: 'pragma solidity ^0.8.0;' }],
        }),
    });

    const result = await fetchSourceCode('0xabc');
    expect(result).toBe('pragma solidity ^0.8.0;');
  });

  it('returns null when no verified source', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ status: '0', result: [] }),
    });

    const result = await fetchSourceCode('0xabc');
    expect(result).toBeNull();
  });
});
