import { describe, it, expect, vi, beforeEach } from 'vitest';

// Track uploaded pieces: cid -> content
const uploadedPieces = {};
let uploadCount = 0;

vi.mock('@filoz/synapse-sdk', () => {
  class MockSynapse {
    constructor() {
      this.storage = {
        upload: vi.fn(async (data) => {
          const cid = `bafy${++uploadCount}`;
          const content = new TextDecoder().decode(data);
          uploadedPieces[cid] = content;
          return {
            pieceCid: { toString: () => cid },
            size: data.byteLength,
            requestedCopies: 1,
            complete: true,
            copies: [{ retrievalUrl: `https://pdp.example.com/piece/${cid}` }],
            failedAttempts: [],
          };
        }),
      };
    }
    static create() {
      return new MockSynapse();
    }
  }
  const calibration = { id: 314159, name: 'Filecoin Calibration' };
  const mainnet = { id: 314, name: 'Filecoin' };
  return { Synapse: MockSynapse, calibration, mainnet };
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

describe('createPlaceholder + getSkill', () => {
  it('creates entry with generating status', async () => {
    const { createPlaceholder, getSkill } = await getStorage();
    await createPlaceholder('abc123', { contractAddress: '0xDEAD' });
    const obj = await getSkill('abc123');
    expect(obj).toMatchObject({
      id: 'abc123',
      status: 'generating',
      stage: 'research',
      contractAddress: '0xDEAD',
      chainId: 8453,
      cid: null,
      logCid: null,
      content: '',
    });
  });

  it('returns null for unknown id', async () => {
    const { getSkill } = await getStorage();
    expect(await getSkill('unknown')).toBeNull();
  });
});

describe('updateStage', () => {
  it('modifies stage field in memory', async () => {
    const { createPlaceholder, updateStage, getSkill } = await getStorage();
    await createPlaceholder('abc123', { contractAddress: '0xDEAD' });
    await updateStage('abc123', 'generate');
    const obj = await getSkill('abc123');
    expect(obj.stage).toBe('generate');
  });

  it('throws for unknown id', async () => {
    const { updateStage } = await getStorage();
    await expect(updateStage('nope', 'generate')).rejects.toThrow('not found');
  });
});

describe('markFailed', () => {
  it('sets status to failed without uploading to Filecoin', async () => {
    const { createPlaceholder, markFailed, getSkill, getEconomics } = await getStorage();
    await createPlaceholder('abc123', { contractAddress: '0xDEAD' });
    const economicsBefore = getEconomics();
    await markFailed('abc123', 'Validation failed after 2 retries');
    const obj = await getSkill('abc123');
    expect(obj.status).toBe('failed');
    expect(obj.content).toBe('Validation failed after 2 retries');
    expect(getEconomics().uploads).toBe(economicsBefore.uploads); // no upload
  });

  it('works even without a prior placeholder', async () => {
    const { markFailed, getSkill } = await getStorage();
    await markFailed('newId', 'pipeline error');
    const obj = await getSkill('newId');
    expect(obj.status).toBe('failed');
  });
});

describe('markReady', () => {
  it('uploads to Filecoin and sets ready status with CID', async () => {
    const { createPlaceholder, markReady, getSkill } = await getStorage();
    await createPlaceholder('abc123', { contractAddress: '0xDEAD' });
    await markReady('abc123', '# My Skill\n');
    const obj = await getSkill('abc123');
    expect(obj.status).toBe('ready');
    expect(obj.content).toBe('# My Skill\n');
    expect(obj.cid).toBeTruthy();
    expect(obj.cid).toMatch(/^bafy/);
  });

  it('increments economics on upload', async () => {
    const { createPlaceholder, markReady, getEconomics } = await getStorage();
    await createPlaceholder('abc123', { contractAddress: '0xDEAD' });
    await markReady('abc123', '# Skill content');
    const econ = getEconomics();
    expect(econ.uploads).toBe(1);
    expect(econ.bytes).toBeGreaterThan(0);
  });

  it('throws for unknown id', async () => {
    const { markReady } = await getStorage();
    await expect(markReady('nope', 'content')).rejects.toThrow('not found');
  });
});

describe('putLog + getLogUrl', () => {
  it('uploads log to Filecoin and stores logCid', async () => {
    const { createPlaceholder, putLog, getLogUrl } = await getStorage();
    await createPlaceholder('abc123', { contractAddress: '0xDEAD' });
    await putLog('abc123', { stage: 'research', status: 'done' });
    const url = await getLogUrl('abc123');
    expect(url).toBeTruthy();
    expect(url).toContain('pdp.example.com');
  });

  it('returns null for unknown skillId', async () => {
    const { getLogUrl } = await getStorage();
    expect(await getLogUrl('nope')).toBeNull();
  });
});

describe('listSkills', () => {
  it('returns only ready entries', async () => {
    const { createPlaceholder, markReady, markFailed, listSkills } = await getStorage();
    await createPlaceholder('skill1', { contractAddress: '0xAAA' });
    await createPlaceholder('skill2', { contractAddress: '0xBBB' });
    await createPlaceholder('skill3', { contractAddress: '0xCCC' });
    await markReady('skill1', '# Skill 1');
    await markReady('skill2', '# Skill 2');
    await markFailed('skill3', 'error');
    const list = listSkills();
    expect(list).toHaveLength(2);
    expect(list.every((s) => s.id === 'skill1' || s.id === 'skill2')).toBe(true);
  });

  it('returns summary fields only', async () => {
    const { createPlaceholder, markReady, listSkills } = await getStorage();
    await createPlaceholder('s1', { contractAddress: '0xAAA' });
    await markReady('s1', '# content');
    const [entry] = listSkills();
    expect(Object.keys(entry).sort()).toEqual(['chainId', 'cid', 'contractAddress', 'createdAt', 'id'].sort());
  });
});

describe('getEconomics', () => {
  it('tracks uploads and bytes across markReady and putLog', async () => {
    const { createPlaceholder, markReady, putLog, getEconomics } = await getStorage();
    await createPlaceholder('s1', { contractAddress: '0xAAA' });
    await markReady('s1', '# Skill content here');
    await putLog('s1', { result: 'ok' });
    const econ = getEconomics();
    expect(econ.uploads).toBe(2);
    expect(econ.bytes).toBeGreaterThan(0);
    expect(econ.estimatedCostUsd).toBeGreaterThan(0);
  });
});
