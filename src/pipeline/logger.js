import { putLog } from '../storage.js';

export function createLogger(skillId, contractAddress) {
  const log = {
    skillId,
    contractAddress,
    chainId: 8453,
    startedAt: new Date().toISOString(),
    completedAt: null,
    status: null,
    error: null,
    stages: [],
  };

  let currentStage = null;

  return {
    startStage(name) {
      currentStage = { name, startedAt: new Date().toISOString(), completedAt: null, result: null, events: [] };
      log.stages.push(currentStage);
    },

    logToolCall(tool, input) {
      if (currentStage) {
        currentStage.events.push({ type: 'tool_call', tool, input, timestamp: new Date().toISOString() });
      }
    },

    logDecision(message) {
      if (currentStage) {
        currentStage.events.push({ type: 'decision', message, timestamp: new Date().toISOString() });
      }
    },

    endStage(result) {
      if (currentStage) {
        currentStage.completedAt = new Date().toISOString();
        currentStage.result = result;
        currentStage = null;
      }
    },

    async flush(status, error) {
      log.completedAt = new Date().toISOString();
      log.status = status;
      log.error = error ?? null;
      await putLog(skillId, log);
    },
  };
}
