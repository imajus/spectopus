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
  it('produces correct frontmatter', async () => {
    const { createPlaceholder, getSkill } = await getStorage();
    await createPlaceholder('abc123', { contractAddress: '0xDEAD' });
    const content = await getSkill('abc123');
    expect(content).toContain('status: "generating"');
    expect(content).toContain('stage: "research"');
    expect(content).toContain('contractAddress: "0xDEAD"');
    expect(content).toContain('chainId: 8453');
  });
});

describe('updateStage', () => {
  it('modifies frontmatter stage field', async () => {
    const { createPlaceholder, updateStage, getSkill } = await getStorage();
    await createPlaceholder('abc123', { contractAddress: '0xDEAD' });
    await updateStage('abc123', 'generate');
    const content = await getSkill('abc123');
    expect(content).toContain('stage: "generate"');
    expect(content).not.toContain('stage: "research"');
  });
});

describe('markFailed', () => {
  it('sets status to failed and includes error in body', async () => {
    const { createPlaceholder, markFailed, getSkill } = await getStorage();
    await createPlaceholder('abc123', { contractAddress: '0xDEAD' });
    await markFailed('abc123', 'Validation failed after 2 retries');
    const content = await getSkill('abc123');
    expect(content).toContain('status: "failed"');
    expect(content).toContain('Validation failed after 2 retries');
  });
});
