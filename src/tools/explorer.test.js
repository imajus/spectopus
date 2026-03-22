import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchABI, fetchSourceCode } from './explorer.js';

beforeEach(() => {
  process.env.ETHERSCAN_API_KEY = 'test-key';
});

describe('fetchABI', () => {
  it('returns parsed ABI for a verified contract from Etherscan', async () => {
    const abi = [{ type: 'function', name: 'transfer' }];
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ status: '1', result: JSON.stringify(abi) }),
    });

    const result = await fetchABI('0xabc', 8453);
    expect(result).toEqual(abi);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('basescan.org'));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('test-key'));
  });

  it('falls back to Blockscout when Etherscan returns unverified', async () => {
    const abi = [{ type: 'function', name: 'transfer' }];
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ status: '0', result: 'Contract source code not verified' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ abi }),
      });

    const result = await fetchABI('0xabc', 8453);
    expect(result).toEqual(abi);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('blockscout.com'));
  });

  it('returns null when both Etherscan and Blockscout have no ABI', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ status: '0', result: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

    const result = await fetchABI('0xabc', 8453);
    expect(result).toBeNull();
  });

  it('returns null when Blockscout returns non-ok response', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ status: '0', result: null }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

    const result = await fetchABI('0xabc', 8453);
    expect(result).toBeNull();
  });

  it('uses sepolia URL for chainId 84532', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ status: '0', result: null }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

    await fetchABI('0xabc', 84532);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('sepolia'));
  });

  it('throws for unsupported chainId', async () => {
    await expect(fetchABI('0xabc', 1)).rejects.toThrow('Unsupported chainId: 1');
  });
});

describe('fetchSourceCode', () => {
  it('returns source code string for a verified contract from Etherscan', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          status: '1',
          result: [{ SourceCode: 'pragma solidity ^0.8.0;' }],
        }),
    });

    const result = await fetchSourceCode('0xabc', 8453);
    expect(result).toBe('pragma solidity ^0.8.0;');
  });

  it('falls back to Blockscout when Etherscan has no source code', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ status: '0', result: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ source_code: 'pragma solidity ^0.8.0;' }),
      });

    const result = await fetchSourceCode('0xabc', 8453);
    expect(result).toBe('pragma solidity ^0.8.0;');
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('blockscout.com'));
  });

  it('returns null when both Etherscan and Blockscout have no source code', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ status: '0', result: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

    const result = await fetchSourceCode('0xabc', 8453);
    expect(result).toBeNull();
  });

  it('throws for unsupported chainId', async () => {
    await expect(fetchSourceCode('0xabc', 99)).rejects.toThrow('Unsupported chainId: 99');
  });
});
