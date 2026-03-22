import { describe, it, expect, vi, beforeEach } from 'vitest';

const store = {};

vi.mock('@aws-sdk/client-s3', () => {
  class S3Client {
    send(cmd) {
      if (cmd.type === 'put') {
        store[cmd.params.Key] = cmd.params.Body;
        return Promise.resolve({});
      }
      if (cmd.type === 'get') {
        const body = store[cmd.params.Key];
        if (body === undefined) {
          const err = new Error('NoSuchKey');
          err.name = 'NoSuchKey';
          return Promise.reject(err);
        }
        return Promise.resolve({
          Body: { transformToString: () => Promise.resolve(body) },
        });
      }
    }
  }

  function PutObjectCommand(params) { return { type: 'put', params }; }
  function GetObjectCommand(params) { return { type: 'get', params }; }

  return { S3Client, PutObjectCommand, GetObjectCommand };
});

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  vi.resetModules();
});

async function getStorage() {
  return import('./storage.js');
}

describe('createPlaceholder', () => {
  it('produces correct JSON object', async () => {
    const { createPlaceholder, getSkill } = await getStorage();
    await createPlaceholder('abc123', { contractAddress: '0xDEAD' });
    const obj = await getSkill('abc123');
    expect(obj).toMatchObject({
      id: 'abc123',
      status: 'generating',
      stage: 'research',
      contractAddress: '0xDEAD',
      chainId: 8453,
      content: '',
    });
  });
});

describe('updateStage', () => {
  it('modifies stage field', async () => {
    const { createPlaceholder, updateStage, getSkill } = await getStorage();
    await createPlaceholder('abc123', { contractAddress: '0xDEAD' });
    await updateStage('abc123', 'generate');
    const obj = await getSkill('abc123');
    expect(obj.stage).toBe('generate');
  });
});

describe('markFailed', () => {
  it('sets status to failed and stores error in content', async () => {
    const { createPlaceholder, markFailed, getSkill } = await getStorage();
    await createPlaceholder('abc123', { contractAddress: '0xDEAD' });
    await markFailed('abc123', 'Validation failed after 2 retries');
    const obj = await getSkill('abc123');
    expect(obj.status).toBe('failed');
    expect(obj.content).toBe('Validation failed after 2 retries');
  });
});

describe('markReady', () => {
  it('sets status to ready and stores skill content', async () => {
    const { createPlaceholder, markReady, getSkill } = await getStorage();
    await createPlaceholder('abc123', { contractAddress: '0xDEAD' });
    await markReady('abc123', '# My Skill\n');
    const obj = await getSkill('abc123');
    expect(obj.status).toBe('ready');
    expect(obj.content).toBe('# My Skill\n');
  });
});
