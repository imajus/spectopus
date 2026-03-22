import express from 'express';
import { createSkillsRouter } from './routes/skills.js';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/skills', createSkillsRouter());

  return app;
}
