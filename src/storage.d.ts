export interface SkillEntry {
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

export interface SkillMetadata {
  contractAddress: string;
}

export interface Economics {
  uploads: number;
  bytes: number;
  estimatedCostUsd: number;
}

export interface SkillSummary {
  id: string;
  contractAddress: string;
  chainId: number;
  cid: string | null;
  createdAt: string;
}

export function initStorage(): Promise<void>
export function createPlaceholder(id: string, metadata: SkillMetadata): Promise<void>
export function updateStage(id: string, stage: string): Promise<void>
export function getSkill(id: string): Promise<SkillEntry | null>
export function markReady(id: string, skillContent: string): Promise<void>
export function markFailed(id: string, error: string): Promise<void>
export function putLog(skillId: string, logData: object): Promise<void>
export function getLogUrl(skillId: string): Promise<string | null>
export function listSkills(): SkillSummary[]
export function getEconomics(): Economics
