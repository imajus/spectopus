import { Synapse, calibration, mainnet, TOKENS, formatUnits } from '@filoz/synapse-sdk';
import { privateKeyToAccount } from 'viem/accounts';

const MIN_PIECE_SIZE = 127;
const INITIAL_PREPARE_SIZE = 1024n * 1024n; // 1 MiB

/** @type {Promise<Synapse>} */
let instance = null;

export async function getSynapse() {
  return instance ||= initStorage();
}

// Check current USDFC balance
async function checkBalance(synapse) {
  const walletBalance = await synapse.payments.walletBalance({ token: TOKENS.USDFC });
  const formattedBalance = formatUnits(walletBalance, { digits: 2 });
  console.log(`Balance: ${formattedBalance} USDFC`);
}

// Prepare account — computes exact deposit + approval for your data size
async function prepareAccount(synapse) {
  const prep = await synapse.storage.prepare({
    dataSize: INITIAL_PREPARE_SIZE,
  });
  const formattedDeposit = formatUnits(prep.costs.depositNeeded, { digits: 2 });
  const formattedRate = formatUnits(prep.costs.rate.perMonth);
  console.log(`Deposit needed: ${formattedDeposit} USDFC`);
  console.log(`Size: ${INITIAL_PREPARE_SIZE} bytes`);
  console.log(`Rate per SIZE month: ${formattedRate} USDFC`);
  console.log(`Ready to upload: ${prep.costs.ready}`);
  // Execute the transaction if needed (handles deposit + approval in one tx)
  if (prep.transaction) {
    const { hash } = await prep.transaction.execute();
    console.log(`Account funded and approved: ${hash}`);
  }
}

async function initStorage() {
  const privateKey = process.env.FILECOIN_PRIVATE_KEY;
  if (!privateKey) throw new Error('FILECOIN_PRIVATE_KEY is required');
  const chain = process.env.FILECOIN_CHAIN === 'mainnet' ? mainnet : calibration;
  const account = privateKeyToAccount(/** @type {`0x${string}`} */ (privateKey));
  console.log(`Account: ${account.address}`);
  const synapse = Synapse.create({ account, chain, source: 'spectopus', withCDN: true });
  console.log(`Initialize Synapse on ${chain.name}`);
  await checkBalance(synapse);
  await prepareAccount(synapse);
  return synapse;
}

export function padToMinSize(content) {
  const encoded = new TextEncoder().encode(content);
  if (encoded.byteLength >= MIN_PIECE_SIZE) return encoded;
  const padded = new Uint8Array(MIN_PIECE_SIZE);
  padded.set(encoded);
  padded.fill(0x20, encoded.byteLength); // pad with spaces
  return padded;
}

export async function uploadToFilecoin(content, meta) {
  const data = padToMinSize(content);
  const synapse = await getSynapse();
  const result = await synapse.storage.upload(data, { pieceMetadata: meta, withCDN: true });
  if (!result.complete) {
    console.warn(`Upload incomplete: ${result.failedAttempts.length} copies failed`);
  }
  return { pieceCid: result.pieceCid };
}