import { describe, it, expect, vi } from 'vitest';
import { fetchABI, fetchSourceCode } from './explorer.js';

describe('fetchABI', () => {
  it('returns parsed ABI for a verified contract', async () => {
    const abi = [{ type: 'function', name: 'transfer' }];
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ abi, source_code: 'pragma solidity ^0.8.0;', is_verified: true }),
    });

    const result = await fetchABI('0xabc');
    expect(result).toEqual(abi);
    expect(fetch).toHaveBeenCalledWith('https://base.blockscout.com/api/v2/smart-contracts/0xabc');
  });

  it('returns null for unverified contract', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ is_verified: false }),
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
          abi: [],
          source_code: 'pragma solidity ^0.8.0;',
          is_verified: true,
        }),
    });

    const result = await fetchSourceCode('0xabc');
    expect(result).toBe('pragma solidity ^0.8.0;');
  });

  it('returns null when no verified source', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ is_verified: false }),
    });

    const result = await fetchSourceCode('0xabc');
    expect(result).toBeNull();
  });
});
