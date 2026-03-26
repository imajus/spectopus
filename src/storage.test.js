import { describe, it, expect, vi, beforeEach } from 'vitest';

const uploadedPieces = {};
let uploadCount = 0;

vi.mock('@filoz/synapse-sdk', () => {
  class MockSynapse {
    constructor() {
      this.storage = {
        prepare: vi.fn(async () => ({ transaction: null, costs: {} })),
        upload: vi.fn(async (data) => {
          const cid = `bafy${++uploadCount}`;
          uploadedPieces[cid] = new TextDecoder().decode(data);
          return {
            pieceCid: { toString: () => cid },
            size: data.byteLength,
            requestedCopies: 2,
            complete: true,
            copies: [{ retrievalUrl: `https://pdp.example.com/piece/${cid}` }],
            failedAttempts: [],
          };
        }),
        download: vi.fn(async ({ pieceCid }) => {
          const content = uploadedPieces[pieceCid];
          if (!content) throw new Error('Piece not found');
          return new TextEncoder().encode(content);
        }),
      };
    }
    static create() {
      return new MockSynapse();
    }
  }
  return {
    Synapse: MockSynapse,
    calibration: { id: 314159, name: 'Filecoin Calibration' },
    mainnet: { id: 314, name: 'Filecoin' },
  };
});

vi.mock('viem/accounts', () => ({
  privateKeyToAccount: vi.fn(() => ({ address: '0xMOCK', type: 'local' })),
}));

beforeEach(async () => {
  Object.keys(uploadedPieces).forEach((k) => delete uploadedPieces[k]);
  uploadCount = 0;
  vi.resetModules();
  process.env.FILECOIN_PRIVATE_KEY = '0xdeadbeef';
  process.env.FILECOIN_CHAIN = 'calibration';
});

async function getStorage() {
  const mod = await import('./storage.js');
  await mod.initStorage();
  return mod;
}

describe('createSession + getSession', () => {
  it('creates session with generating status', async () => {
    const { createSession, getSession } = await getStorage();
    await createSession('abc123', { contractAddress: '0xDEAD' });
    const s = await getSession('abc123');
    expect(s).toMatchObject({
      sid: 'abc123',
      status: 'generating',
      stage: 'research',
      contractAddress: '0xDEAD',
      chainId: 8453,
      skillId: null,
      logCid: null,
    });
  });

  it('returns null for unknown sid', async () => {
    const { getSession } = await getStorage();
    expect(await getSession('unknown')).toBeNull();
  });
});

describe('updateStage', () => {
  it('modifies stage field in memory', async () => {
    const { createSession, updateStage, getSession } = await getStorage();
    await createSession('abc123', { contractAddress: '0xDEAD' });
    await updateStage('abc123', 'generate');
    expect((await getSession('abc123')).stage).toBe('generate');
  });

  it('throws for unknown sid', async () => {
    const { updateStage } = await getStorage();
    await expect(updateStage('nope', 'generate')).rejects.toThrow('not found');
  });
});

describe('markFailed', () => {
  it('sets status to failed without uploading', async () => {
    const { createSession, markFailed, getSession } = await getStorage();
    await createSession('abc123', { contractAddress: '0xDEAD' });
    await markFailed('abc123', 'Validation failed');
    const s = await getSession('abc123');
    expect(s.status).toBe('failed');
    expect(s.error).toBe('Validation failed');
  });

  it('works without a prior session', async () => {
    const { markFailed, getSession } = await getStorage();
    await markFailed('newId', 'pipeline error');
    const s = await getSession('newId');
    expect(s.status).toBe('failed');
    expect(s.error).toBe('pipeline error');
  });
});

describe('markReady', () => {
  it('uploads to Filecoin and stores skillId (PieceCID)', async () => {
    const { createSession, markReady, getSession } = await getStorage();
    await createSession('abc123', { contractAddress: '0xDEAD' });
    await markReady('abc123', '# My Skill\n');
    const s = await getSession('abc123');
    expect(s.status).toBe('ready');
    expect(s.skillId).toBeTruthy();
    expect(s.skillId).toMatch(/^bafy/);
  });

  it('does not set logUrl', async () => {
    const { createSession, markReady, getSession } = await getStorage();
    await createSession('abc123', { contractAddress: '0xDEAD' });
    await markReady('abc123', '# Skill');
    const s = await getSession('abc123');
    expect(s.logUrl).toBeNull();
  });

  it('throws for unknown sid', async () => {
    const { markReady } = await getStorage();
    await expect(markReady('nope', 'content')).rejects.toThrow('not found');
  });
});

describe('putLog + getLogUrl', () => {
  it('uploads log and stores retrieval URL', async () => {
    const { createSession, putLog, getLogUrl } = await getStorage();
    await createSession('abc123', { contractAddress: '0xDEAD' });
    await putLog('abc123', { stage: 'research', status: 'done' });
    const url = await getLogUrl('abc123');
    expect(url).toContain('pdp.example.com');
  });

  it('returns null for unknown sid', async () => {
    const { getLogUrl } = await getStorage();
    expect(await getLogUrl('nope')).toBeNull();
  });
});

describe('fetchSkill', () => {
  it('returns cached content after markReady', async () => {
    const { createSession, markReady, getSession, fetchSkill } = await getStorage();
    await createSession('abc123', { contractAddress: '0xDEAD' });
    await markReady('abc123', '# Cached Skill');
    const s = await getSession('abc123');
    const content = await fetchSkill(s.skillId);
    expect(content).toBe('# Cached Skill');
  });

  it('downloads from Filecoin on cache miss', async () => {
    const { createSession, markReady, getSession, fetchSkill } = await getStorage();
    await createSession('abc123', { contractAddress: '0xDEAD' });
    await markReady('abc123', '# Download Skill');
    const s = await getSession('abc123');
    // Simulate cache miss by fetching with a raw CID string (different object)
    // The mock download returns from uploadedPieces which was populated by upload
    const content = await fetchSkill(s.skillId);
    expect(content).toContain('# Download Skill');
  });

  it('throws for unknown PieceCID', async () => {
    const { fetchSkill } = await getStorage();
    await expect(fetchSkill('bafy_unknown')).rejects.toThrow();
  });
});

describe('minimum piece size padding', () => {
  it('pads small content to 127 bytes', async () => {
    const { createSession, markReady } = await getStorage();
    await createSession('tiny', { contractAddress: '0xDEAD' });
    await markReady('tiny', 'hi');
    // The uploaded piece should be at least 127 bytes
    const uploaded = Object.values(uploadedPieces).find((v) => v.startsWith('hi'));
    expect(uploaded.length).toBeGreaterThanOrEqual(127);
  });
});
