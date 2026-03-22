import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

// Tests run without WALLET_PRIVATE_KEY, so x402 middleware is bypassed.
// This lets us verify route logic in isolation.

describe('POST /skills/generate', () => {
  it('returns id and url for a valid request', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/skills/generate')
      .send({ contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', chainId: 8453 });

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
      .send({ contractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', chainId: 8453 });

    expect(res.body.url).toContain(res.body.id);
  });

  it('returns unique ids for separate requests', async () => {
    const app = createApp();
    const [r1, r2] = await Promise.all([
      request(app)
        .post('/skills/generate')
        .send({ contractAddress: '0xabc', chainId: 8453 }),
      request(app)
        .post('/skills/generate')
        .send({ contractAddress: '0xabc', chainId: 8453 }),
    ]);

    expect(r1.body.id).not.toBe(r2.body.id);
  });

  it('returns 400 when contractAddress is missing', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/skills/generate')
      .send({ chainId: 8453 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when chainId is missing', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/skills/generate')
      .send({ contractAddress: '0xabc' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('accepts optional message field', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/skills/generate')
      .send({ contractAddress: '0xabc', chainId: 8453, message: 'Focus on ERC-20 transfers' });

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
});

describe('GET /health', () => {
  it('is exempt from payment (returns 200 without payment headers)', async () => {
    const app = createApp();
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
