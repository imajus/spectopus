import express from 'express';
import { registerSkillsRoutes } from './routes/skills.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  registerSkillsRoutes(app);

  return app;
}
