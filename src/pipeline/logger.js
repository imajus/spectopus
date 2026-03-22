import { appendFile, mkdir } from 'fs/promises';
import { join } from 'path';

const LOGS_DIR = 'logs';
const LOG_FILE = join(LOGS_DIR, 'agent_log.jsonl');

/**
 * Create a new pipeline logger for a single run.
 * Accumulates stage data during the run, then flushes to disk on completion.
 */
export function createLogger(runId, skillId) {
  const startedAt = Date.now();
  const stages = [];
  let currentStage = null;

  return {
    startStage(name) {
      currentStage = { name, startedAt: Date.now(), toolCalls: [], decisions: [] };
      stages.push(currentStage);
    },

    logToolCall(tool, args, result) {
      if (currentStage) {
        currentStage.toolCalls.push({ tool, args, result, at: Date.now() });
      }
    },

    logDecision(description) {
      if (currentStage) {
        currentStage.decisions.push({ description, at: Date.now() });
      }
    },

    endStage(outcome) {
      if (currentStage) {
        currentStage.endedAt = Date.now();
        currentStage.durationMs = currentStage.endedAt - currentStage.startedAt;
        currentStage.outcome = outcome;
        currentStage = null;
      }
    },

    async flush(status, retries = 0) {
      const entry = {
        runId,
        skillId,
        startedAt: new Date(startedAt).toISOString(),
        endedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        status,
        retries,
        stages,
      };

      await mkdir(LOGS_DIR, { recursive: true });
      await appendFile(LOG_FILE, JSON.stringify(entry) + '\n', 'utf8');
    },
  };
}
