import express from 'express';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { registerSkillsRoutes } from './routes/skills.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillMd = readFileSync(join(__dirname, '../skills/spectopus/SKILL.md'), 'utf8');

export function createApp() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json());

  app.get('/', (req, res) => {
    res.type('text/markdown').send(skillMd);
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  registerSkillsRoutes(app);

  return app;
}
