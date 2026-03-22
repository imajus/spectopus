const ERC_INTERFACES = {
  'ERC-20': ['transfer', 'approve', 'transferFrom', 'balanceOf', 'totalSupply', 'allowance'],
  'ERC-721': ['ownerOf', 'safeTransferFrom', 'getApproved', 'setApprovalForAll'],
  'ERC-1155': ['balanceOfBatch', 'safeBatchTransferFrom', 'safeTransferFrom'],
  'ERC-4626': ['deposit', 'withdraw', 'redeem', 'convertToAssets', 'convertToShares', 'totalAssets'],
};

export function detectERCPatterns(abi) {
  const functionNames = new Set(
    abi.filter((item) => item.type === 'function').map((item) => item.name)
  );

  return Object.entries(ERC_INTERFACES)
    .filter(([, signatures]) => signatures.every((sig) => functionNames.has(sig)))
    .map(([standard]) => standard);
}
