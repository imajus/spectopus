interface SkillEntry {
  id: string;
  status: 'generating' | 'ready' | 'failed';
  stage: string | null;
  contractAddress: string;
  chainId: number;
  cid: string | null;
  logCid: string | null;
  logUrl: string | null;
  content: string;
  error: string | null;
  createdAt: string;
}

interface SkillMetadata {
  contractAddress: string;
}

interface Economics {
  uploads: number;
  bytes: number;
  estimatedCostUsd: number;
}

interface SkillSummary {
  id: string;
  contractAddress: string;
  chainId: number;
  cid: string | null;
  createdAt: string;
}

declare function initStorage(): Promise<void>
declare function createPlaceholder(id: string, metadata: SkillMetadata): Promise<void>
declare function updateStage(id: string, stage: string): Promise<void>
declare function getSkill(id: string): Promise<SkillEntry | null>
declare function markReady(id: string, skillContent: string): Promise<void>
declare function markFailed(id: string, error: string): Promise<void>
declare function putLog(skillId: string, logData: object): Promise<void>
declare function getLogUrl(skillId: string): Promise<string | null>
declare function listSkills(): SkillSummary[]
declare function getEconomics(): Economics
