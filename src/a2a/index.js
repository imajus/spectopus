import {
  DefaultRequestHandler,
  InMemoryTaskStore,
  DefaultExecutionEventBusManager,
} from '@a2a-js/sdk/server';
import { agentCardHandler, jsonRpcHandler, UserBuilder } from '@a2a-js/sdk/server/express';
import { buildAgentCard } from './agent-card.js';
import { SpectopusExecutor } from './executor.js';

/**
 * Register A2A protocol routes on an Express app.
 *
 * Mounts:
 *   GET  /.well-known/agent-card.json  — A2A Agent Card (unauthenticated)
 *   POST /a2a                           — A2A JSON-RPC endpoint
 *
 * @param {import('express').Application} app
 * @param {string} baseUrl - Public base URL (e.g. https://spectopus.example.com)
 */
export function registerA2A(app, baseUrl) {
  const agentCard = buildAgentCard(baseUrl);
  const requestHandler = new DefaultRequestHandler(
    agentCard,
    new InMemoryTaskStore(),
    new SpectopusExecutor(),
    new DefaultExecutionEventBusManager(),
  );

  app.get(
    '/.well-known/agent-card.json',
    agentCardHandler({ agentCardProvider: requestHandler }),
  );

  app.post(
    '/a2a',
    jsonRpcHandler({ requestHandler, userBuilder: UserBuilder.noAuthentication }),
  );
}
