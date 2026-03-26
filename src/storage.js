import { getSynapse, uploadToFilecoin } from './synapse.js';
import { asPieceCID } from '@filoz/synapse-core/piece';

/** @type {Map<string, Session>} */
const sessions = new Map();

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
  const synapse = await getSynapse();
  const ctx = await synapse.storage.getDefaultContext();
  return ctx.getPieceUrl(session.logCid);
}

// --- Skill retrieval (permanent — works after restart via Filecoin PDP URL) ---

export async function getSkillUrl(pieceCidStr) {
  const synapse = await getSynapse();
  const ctx = await synapse.storage.getDefaultContext();
  return ctx.getPieceUrl(asPieceCID(pieceCidStr));
}
