import { describe, it, expect } from 'vitest';
import { detectERCPatterns } from './erc.js';

const fn = (name) => ({ type: 'function', name });

const ERC20_ABI = [
  fn('transfer'), fn('approve'), fn('transferFrom'),
  fn('balanceOf'), fn('totalSupply'), fn('allowance'),
];

const ERC721_ABI = [
  fn('ownerOf'), fn('safeTransferFrom'), fn('getApproved'), fn('setApprovalForAll'),
];

const ERC1155_ABI = [
  fn('balanceOfBatch'), fn('safeBatchTransferFrom'), fn('safeTransferFrom'),
];

describe('detectERCPatterns', () => {
  it('detects ERC-20', () => {
    expect(detectERCPatterns(ERC20_ABI)).toContain('ERC-20');
  });

  it('detects ERC-721', () => {
    expect(detectERCPatterns(ERC721_ABI)).toContain('ERC-721');
  });

  it('detects ERC-1155', () => {
    expect(detectERCPatterns(ERC1155_ABI)).toContain('ERC-1155');
  });

  it('returns empty array for no recognized standard', () => {
    expect(detectERCPatterns([fn('foo'), fn('bar')])).toEqual([]);
  });

  it('detects multiple standards', () => {
    const combined = [...ERC20_ABI, ...ERC721_ABI];
    const result = detectERCPatterns(combined);
    expect(result).toContain('ERC-20');
    expect(result).toContain('ERC-721');
  });

  it('ignores non-function ABI entries', () => {
    const abiWithEvent = [...ERC20_ABI, { type: 'event', name: 'Transfer' }];
    expect(detectERCPatterns(abiWithEvent)).toContain('ERC-20');
  });
});
