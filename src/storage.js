import { Synapse, calibration, mainnet } from '@filoz/synapse-sdk';
import { asPieceCID } from '@filoz/synapse-core/piece';
import { privateKeyToAccount } from 'viem/accounts';

const MIN_PIECE_SIZE = 127;
const INITIAL_PREPARE_SIZE = 1024n * 1024n; // 1 MiB

/** @type {Synapse|null} */
let synapse = null;

/** @type {Map<string, Session>} */
const sessions = new Map();

export async function initStorage() {
  const privateKey = process.env.FILECOIN_PRIVATE_KEY;
  if (!privateKey) throw new Error('FILECOIN_PRIVATE_KEY is required');
  const chain = process.env.FILECOIN_CHAIN === 'mainnet' ? mainnet : calibration;
  const account = privateKeyToAccount(/** @type {`0x${string}`} */ (privateKey));
  synapse = Synapse.create({ account, chain, source: 'spectopus' });
  const prep = await synapse.storage.prepare({ dataSize: INITIAL_PREPARE_SIZE });
  if (prep.transaction) {
    const { hash } = await prep.transaction.execute();
    console.log(`Filecoin account funded and approved (tx: ${hash})`);
  }
}

function getSynapse() {
  if (!synapse) throw new Error('Storage not initialized — call initStorage() first');
  return synapse;
}

function padToMinSize(content) {
  const encoded = new TextEncoder().encode(content);
  if (encoded.byteLength >= MIN_PIECE_SIZE) return encoded;
  const padded = new Uint8Array(MIN_PIECE_SIZE);
  padded.set(encoded);
  padded.fill(0x20, encoded.byteLength); // pad with spaces
  return padded;
}

async function uploadToFilecoin(content, meta) {
  const data = padToMinSize(content);
  const result = await getSynapse().storage.upload(data, { pieceMetadata: meta });
  if (!result.complete) {
    console.warn(`Upload incomplete: ${result.failedAttempts.length} copies failed`);
  }
  return { pieceCid: result.pieceCid };
}

// --- Session management (in-memory, ephemeral) ---

export async function createSession(sid, metadata) {
  sessions.set(sid, {
    sid,
    status: 'generating',
    stage: 'research',
    contractAddress: metadata.contractAddress,
    chainId: 8453,
    skillCid: null,
    logCid: null,
    error: null,
    createdAt: new Date().toISOString(),
  });
}

export async function updateStage(sid, stage) {
  const session = sessions.get(sid);
  if (!session) throw new Error(`Session ${sid} not found`);
  session.stage = stage;
}

export async function getSession(sid) {
  return sessions.get(sid) ?? null;
}

export async function markReady(sid, skillContent) {
  const session = sessions.get(sid);
  if (!session) throw new Error(`Session ${sid} not found`);
  const { pieceCid } = await uploadToFilecoin(skillContent, {
    filename: `skills/${sid}.md`,
    contentType: 'text/markdown',
  });
  session.status = 'ready';
  session.skillCid = pieceCid;
}

export async function markFailed(sid, error) {
  const session = sessions.get(sid) ?? {
    sid,
    status: 'failed',
    stage: null,
    contractAddress: '',
    chainId: 8453,
    skillCid: null,
    logCid: null,
    error,
    createdAt: new Date().toISOString(),
  };
  session.status = 'failed';
  session.error = error;
  if (!sessions.has(sid)) sessions.set(sid, session);
}

export async function putLog(sid, logData) {
  const { pieceCid } = await uploadToFilecoin(JSON.stringify(logData), {
    filename: `logs/${sid}.json`,
    contentType: 'application/json',
  });
  const session = sessions.get(sid);
  if (session) session.logCid = pieceCid;
}

export async function getLogUrl(sid) {
  const session = sessions.get(sid);
  if (!session?.logCid) return null;
  const ctx = await getSynapse().storage.getDefaultContext();
  return ctx.getPieceUrl(session.logCid);
}

// --- Skill retrieval (permanent — works after restart via Filecoin PDP URL) ---

export async function getSkillUrl(pieceCidStr) {
  const ctx = await getSynapse().storage.getDefaultContext();
  return ctx.getPieceUrl(asPieceCID(pieceCidStr));
}
