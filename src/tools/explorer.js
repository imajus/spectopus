const EXPLORER_URL = 'https://api.basescan.org/api';

export async function fetchABI(contractAddress) {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  const url = `${EXPLORER_URL}?module=contract&action=getabi&address=${contractAddress}&apikey=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== '1' || !data.result) return null;
  try {
    return JSON.parse(data.result);
  } catch {
    return null;
  }
}

export async function fetchSourceCode(contractAddress) {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  const url = `${EXPLORER_URL}?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== '1' || !data.result?.[0]) return null;
  const sourceCode = data.result[0].SourceCode;
  return sourceCode || null;
}
