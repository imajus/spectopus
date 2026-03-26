import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

vi.mock('../storage.js', () => ({
  createSession: vi.fn().mockResolvedValue(undefined),
  getSession: vi.fn().mockResolvedValue(null),
  getLogUrl: vi.fn().mockResolvedValue('https://pdp.example.com/piece/bafylog1'),
  getSkillUrl: vi.fn().mockResolvedValue('https://pdp.example.com/piece/bafySkill1'),
}));

vi.mock('../pipeline/index.js', () => ({
  runPipeline: vi.fn().mockResolvedValue(undefined),
}));

import { createSession, getSession, getLogUrl, getSkillUrl } from '../storage.js';
import { runPipeline } from '../pipeline/index.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /skills/generate', () => {
  it('returns sessionId and statusUrl for a valid request', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/skills/generate')
      .send({ contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      sessionId: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
      statusUrl: expect.stringContaining('/skills/status/'),
    });
  });

  it('includes session id in statusUrl', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/skills/generate')
      .send({ contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' });

    expect(res.body.statusUrl).toContain(res.body.sessionId);
  });

  it('creates a session with the id and metadata', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/skills/generate')
      .send({ contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' });

    expect(createSession).toHaveBeenCalledWith(res.body.sessionId, {
      contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    });
  });

  it('fires the pipeline async with session id, contractAddress, message', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/skills/generate')
      .send({ contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', message: 'Focus on ERC-20' });

    expect(runPipeline).toHaveBeenCalledWith(res.body.sessionId, '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 'Focus on ERC-20');
  });

  it('returns unique session ids for separate requests', async () => {
    const app = createApp();
    const [r1, r2] = await Promise.all([
      request(app).post('/skills/generate').send({ contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }),
      request(app).post('/skills/generate').send({ contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' }),
    ]);

    expect(r1.body.sessionId).not.toBe(r2.body.sessionId);
  });

  it('returns 400 when contractAddress is missing', async () => {
    const app = createApp();
    const res = await request(app).post('/skills/generate').send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('accepts optional message field', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/skills/generate')
      .send({ contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', message: 'Focus on ERC-20 transfers' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('sessionId');
  });
});

describe('GET /skills/status/:sid', () => {
  it('returns 404 for unknown session', async () => {
    const app = createApp();
    const res = await request(app).get('/skills/status/unknown-sid');

    expect(res.status).toBe(404);
  });

  it('returns processing status when generating', async () => {
    getSession.mockResolvedValueOnce({ sid: 'sid1', status: 'generating', stage: 'research', skillCid: null, error: null });
    const app = createApp();
    const res = await request(app).get('/skills/status/sid1');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ sessionId: 'sid1', status: 'processing', stage: 'research' });
    expect(res.body).not.toHaveProperty('skillId');
  });

  it('returns skillId and logUrl when ready', async () => {
    getSession.mockResolvedValueOnce({ sid: 'sid1', status: 'ready', stage: 'validate', skillCid: 'bafySkill1', error: null });
    const app = createApp();
    const res = await request(app).get('/skills/status/sid1');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ sessionId: 'sid1', status: 'ready', skillId: 'bafySkill1' });
    expect(res.body.logUrl).toContain('pdp.example.com');
  });

  it('returns error when failed', async () => {
    getSession.mockResolvedValueOnce({ sid: 'sid1', status: 'failed', stage: 'validate', skillCid: null, error: 'Validation failed' });
    const app = createApp();
    const res = await request(app).get('/skills/status/sid1');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ sessionId: 'sid1', status: 'failed', error: 'Validation failed' });
  });
});

describe('GET /skills/:id', () => {
  it('returns 404 when getSkillUrl throws', async () => {
    getSkillUrl.mockRejectedValueOnce(new Error('not found'));
    const app = createApp();
    const res = await request(app).get('/skills/bafyUnknown');

    expect(res.status).toBe(404);
  });

  it('returns skillUrl as JSON', async () => {
    getSkillUrl.mockResolvedValueOnce('https://pdp.example.com/piece/bafySkill1');
    const app = createApp();
    const res = await request(app).get('/skills/bafySkill1');

    expect(res.status).toBe(200);
    expect(res.type).toMatch(/json/);
    expect(res.body).toEqual({ skillUrl: 'https://pdp.example.com/piece/bafySkill1' });
  });
});

describe('GET /health', () => {
  it('is exempt from payment (returns 200 without payment headers)', async () => {
    const app = createApp();
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
