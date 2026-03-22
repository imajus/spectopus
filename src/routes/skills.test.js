import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

// Mock storage and pipeline so tests don't need real S3 or LLM connections.
// Tests run without WALLET_PRIVATE_KEY, so x402 middleware is also bypassed.
vi.mock('../storage.js', () => ({
  createPlaceholder: vi.fn().mockResolvedValue(undefined),
  getSkill: vi.fn().mockResolvedValue(null),
}));

vi.mock('../pipeline/index.js', () => ({
  runPipeline: vi.fn().mockResolvedValue(undefined),
}));

import { createPlaceholder, getSkill } from '../storage.js';
import { runPipeline } from '../pipeline/index.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /skills/generate', () => {
  it('returns id and url for a valid request', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/skills/generate')
      .send({ contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
      url: expect.stringContaining('/skills/'),
    });
  });

  it('includes the skill id in the url', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/skills/generate')
      .send({ contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' });

    expect(res.body.url).toContain(res.body.id);
  });

  it('creates an S3 placeholder with the skill id and metadata', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/skills/generate')
      .send({ contractAddress: '0xabc' });

    expect(createPlaceholder).toHaveBeenCalledWith(res.body.id, {
      contractAddress: '0xabc',
    });
  });

  it('fires the pipeline async with skill id, contractAddress, message', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/skills/generate')
      .send({ contractAddress: '0xabc', message: 'Focus on ERC-20' });

    expect(runPipeline).toHaveBeenCalledWith(res.body.id, '0xabc', 'Focus on ERC-20');
  });

  it('returns unique ids for separate requests', async () => {
    const app = createApp();
    const [r1, r2] = await Promise.all([
      request(app).post('/skills/generate').send({ contractAddress: '0xabc' }),
      request(app).post('/skills/generate').send({ contractAddress: '0xabc' }),
    ]);

    expect(r1.body.id).not.toBe(r2.body.id);
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
      .send({ contractAddress: '0xabc', message: 'Focus on ERC-20 transfers' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
  });
});

describe('GET /skills/:id', () => {
  it('returns 404 for an unknown skill id', async () => {
    const app = createApp();
    const res = await request(app).get('/skills/00000000-0000-4000-8000-000000000000');

    expect(res.status).toBe(404);
  });

  it('returns skill content as text/markdown when found', async () => {
    getSkill.mockResolvedValueOnce('---\nstatus: "ready"\n---\n\n# My Skill\n');
    const app = createApp();
    const res = await request(app).get('/skills/00000000-0000-4000-8000-000000000001');

    expect(res.status).toBe(200);
    expect(res.type).toMatch(/markdown/);
    expect(res.text).toContain('# My Skill');
  });

  it('returns in-progress placeholder content when skill is generating', async () => {
    getSkill.mockResolvedValueOnce('---\nstatus: "generating"\nstage: "research"\n---\n\n# Skill generation in progress\n');
    const app = createApp();
    const res = await request(app).get('/skills/00000000-0000-4000-8000-000000000002');

    expect(res.status).toBe(200);
    expect(res.text).toContain('generating');
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
