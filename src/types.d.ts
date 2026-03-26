type PieceCID = import("@filoz/synapse-sdk").PieceCID;

interface Session {
  sid: string
  status: 'generating' | 'ready' | 'failed'
  stage: string | null
  contractAddress: string
  chainId: number
  skillCid: PieceCID | null
  logCid: PieceCID | null
  error: string | null
  createdAt: string
}

interface SessionMetadata {
  contractAddress: string
}

declare function initStorage(): Promise<void>
declare function createSession(sid: string, metadata: SessionMetadata): Promise<void>
declare function updateStage(sid: string, stage: string): Promise<void>
declare function getSession(sid: string): Promise<Session | null>
declare function markReady(sid: string, skillContent: string): Promise<void>
declare function markFailed(sid: string, error: string): Promise<void>
declare function putLog(sid: string, logData: object): Promise<void>
declare function getLogUrl(sid: string): Promise<string | null>
declare function getSkillUrl(pieceCid: string): Promise<string>
