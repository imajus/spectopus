import { Synapse, calibration, mainnet } from '@filoz/synapse-sdk';
import { privateKeyToAccount } from 'viem/accounts';

/** @type {Synapse|null} */
let synapse = null;

/** @type {Map<string, import('./storage.d.ts').SkillEntry>} */
const index = new Map();

const economics = { uploads: 0, bytes: 0 };

export async function initStorage() {
  const privateKey = process.env.FILECOIN_PRIVATE_KEY;
  if (!privateKey) throw new Error('FILECOIN_PRIVATE_KEY is required');
  const chain = process.env.FILECOIN_CHAIN === 'mainnet' ? mainnet : calibration;
  const account = privateKeyToAccount(/** @type {`0x${string}`} */ (privateKey));
  synapse = Synapse.create({ account, chain, source: 'spectopus' });
}

function getSynapse() {
  if (!synapse) throw new Error('Storage not initialized — call initStorage() first');
  return synapse;
}

async function uploadToFilecoin(content) {
  const data = new TextEncoder().encode(content);
  const result = await getSynapse().storage.upload(data);
  economics.uploads += 1;
  economics.bytes += data.byteLength;
  const retrievalUrl = result.copies[0]?.retrievalUrl ?? null;
  return { cid: result.pieceCid.toString(), retrievalUrl };
}

export async function createPlaceholder(id, metadata) {
  index.set(id, {
    id,
    status: 'generating',
    stage: 'research',
    contractAddress: metadata.contractAddress,
    chainId: 8453,
    cid: null,
    logCid: null,
    logUrl: null,
    content: '',
    error: null,
    createdAt: new Date().toISOString(),
  });
}

export async function updateStage(id, stage) {
  const entry = index.get(id);
  if (!entry) throw new Error(`Skill ${id} not found`);
  entry.stage = stage;
}

export async function getSkill(id) {
  return index.get(id) ?? null;
}

export async function markReady(id, skillContent) {
  const entry = index.get(id);
  if (!entry) throw new Error(`Skill ${id} not found`);
  const { cid, retrievalUrl } = await uploadToFilecoin(skillContent);
  entry.status = 'ready';
  entry.cid = cid;
  entry.content = skillContent;
  if (retrievalUrl) entry.logUrl = retrievalUrl; // store skill retrieval URL temporarily; overwritten by putLog
}

export async function markFailed(id, error) {
  const entry = index.get(id) ?? {
    id,
    status: 'failed',
    stage: null,
    contractAddress: '',
    chainId: 8453,
    cid: null,
    logCid: null,
    logUrl: null,
    content: error,
    error,
    createdAt: new Date().toISOString(),
  };
  entry.status = 'failed';
  entry.content = error;
  entry.error = error;
  if (!index.has(id)) index.set(id, entry);
}

export async function putLog(skillId, logData) {
  const { cid, retrievalUrl } = await uploadToFilecoin(JSON.stringify(logData));
  const entry = index.get(skillId);
  if (entry) {
    entry.logCid = cid;
    if (retrievalUrl) entry.logUrl = retrievalUrl;
  }
}

export async function getLogUrl(skillId) {
  const entry = index.get(skillId);
  if (!entry?.logCid) return null;
  if (entry.logUrl) return entry.logUrl;
  // Fallback: construct PDP URL (requires provider serviceURL — not available without a live provider lookup)
  return null;
}

export function listSkills() {
  return Array.from(index.values())
    .filter((e) => e.status === 'ready')
    .map(({ id, contractAddress, chainId, cid, createdAt }) => ({
      id, contractAddress, chainId, cid, createdAt,
    }));
}

export function getEconomics() {
  const costPerByte = 0.000000002; // ~$0.000002/KB estimate
  return {
    uploads: economics.uploads,
    bytes: economics.bytes,
    estimatedCostUsd: economics.bytes * costPerByte,
  };
}
