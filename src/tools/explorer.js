const ETHERSCAN_URLS = {
  8453: 'https://api.basescan.org/api',
  84532: 'https://api-sepolia.basescan.org/api',
};

const BLOCKSCOUT_URLS = {
  8453: 'https://base.blockscout.com/api/v2',
  84532: 'https://base-sepolia.blockscout.com/api/v2',
};

function getEtherscanUrl(chainId) {
  const url = ETHERSCAN_URLS[chainId];
  if (!url) throw new Error(`Unsupported chainId: ${chainId}`);
  return url;
}

function getBlockscoutUrl(chainId) {
  const url = BLOCKSCOUT_URLS[chainId];
  if (!url) throw new Error(`Unsupported chainId: ${chainId}`);
  return url;
}

async function fetchABIFromBlockscout(contractAddress, chainId) {
  const baseUrl = getBlockscoutUrl(chainId);
  const url = `${baseUrl}/smart-contracts/${contractAddress}`;

  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();

  if (!data.abi) return null;
  return data.abi;
}

async function fetchSourceCodeFromBlockscout(contractAddress, chainId) {
  const baseUrl = getBlockscoutUrl(chainId);
  const url = `${baseUrl}/smart-contracts/${contractAddress}`;

  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();

  if (!data.source_code) return null;
  return data.source_code;
}

export async function fetchABI(contractAddress, chainId) {
  const baseUrl = getEtherscanUrl(chainId);
  const apiKey = process.env.ETHERSCAN_API_KEY;
  const url = `${baseUrl}?module=contract&action=getabi&address=${contractAddress}&apikey=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status === '1' && data.result) {
    try {
      return JSON.parse(data.result);
    } catch {
      // fall through to Blockscout
    }
  }

  return fetchABIFromBlockscout(contractAddress, chainId);
}

export async function fetchSourceCode(contractAddress, chainId) {
  const baseUrl = getEtherscanUrl(chainId);
  const apiKey = process.env.ETHERSCAN_API_KEY;
  const url = `${baseUrl}?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status === '1' && data.result?.[0]) {
    const sourceCode = data.result[0].SourceCode;
    if (sourceCode) return sourceCode;
  }

  return fetchSourceCodeFromBlockscout(contractAddress, chainId);
}
