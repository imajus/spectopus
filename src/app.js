import express from 'express';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { registerSkillsRoutes } from './routes/skills.js';
import { registerA2A } from './a2a/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillMd = readFileSync(join(__dirname, '../skills/spectopus/SKILL.md'), 'utf8');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

export function createApp() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '16kb' }));

  app.get('/', (req, res) => {
    res.type('text/markdown').send(skillMd);
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  registerA2A(app, BASE_URL);
  registerSkillsRoutes(app);

  return app;
}
