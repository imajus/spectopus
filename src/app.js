import express from 'express';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { registerSkillsRoutes } from './routes/skills.js';
import {
  DefaultRequestHandler,
  InMemoryTaskStore,
  DefaultExecutionEventBusManager,
} from '@a2a-js/sdk/server';
import { agentCardHandler, jsonRpcHandler, UserBuilder } from '@a2a-js/sdk/server/express';
import { agentCard } from './a2a/agent-card.js';
import { SpectopusExecutor } from './a2a/executor.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillMd = readFileSync(join(__dirname, '../skills/spectopus/SKILL.md'), 'utf8');

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

  registerSkillsRoutes(app);

  // A2A protocol support
  const a2aRequestHandler = new DefaultRequestHandler(
    agentCard,
    new InMemoryTaskStore(),
    new SpectopusExecutor(),
    new DefaultExecutionEventBusManager(),
  );

  app.get('/.well-known/agent-card.json', agentCardHandler({ agentCardProvider: a2aRequestHandler }));
  app.post('/a2a', jsonRpcHandler({ requestHandler: a2aRequestHandler, userBuilder: UserBuilder.noAuthentication }));

  return app;
}
