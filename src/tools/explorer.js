const EXPLORER_URLS = {
  8453: 'https://api.basescan.org/api',
  84532: 'https://api-sepolia.basescan.org/api',
};

function getExplorerUrl(chainId) {
  const url = EXPLORER_URLS[chainId];
  if (!url) throw new Error(`Unsupported chainId: ${chainId}`);
  return url;
}

export async function fetchABI(contractAddress, chainId) {
  const baseUrl = getExplorerUrl(chainId);
  const apiKey = process.env.ETHERSCAN_API_KEY;
  const url = `${baseUrl}?module=contract&action=getabi&address=${contractAddress}&apikey=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== '1' || !data.result) return null;
  try {
    return JSON.parse(data.result);
  } catch {
    return null;
  }
}

export async function fetchSourceCode(contractAddress, chainId) {
  const baseUrl = getExplorerUrl(chainId);
  const apiKey = process.env.ETHERSCAN_API_KEY;
  const url = `${baseUrl}?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== '1' || !data.result?.[0]) return null;
  const sourceCode = data.result[0].SourceCode;
  return sourceCode || null;
}
