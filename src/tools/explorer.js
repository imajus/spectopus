const BLOCKSCOUT_URL = 'https://base.blockscout.com';

export async function fetchABI(contractAddress) {
  const url = `${BLOCKSCOUT_URL}/api/v2/smart-contracts/${encodeURIComponent(contractAddress)}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.abi) return null;
  return data.abi;
}

export async function fetchSourceCode(contractAddress) {
  const url = `${BLOCKSCOUT_URL}/api/v2/smart-contracts/${encodeURIComponent(contractAddress)}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.source_code) return null;
  return data.source_code;
}
