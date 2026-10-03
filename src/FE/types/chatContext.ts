export interface ChatContextStatus {
  estimatedTokens: number;
  contextWindow: number;
  reservedOutputTokens: number;
  inputBudget: number;
  autoCompactThreshold: number;
  systemTokens: number;
  toolsTokens: number;
  historyTokens: number;
  summaryTokens: number;
  draftTokens: number;
  retainedTurns: number;
  compactedTurns: number;
  autoCompactEnabled: boolean;
  keepRecentTurns: number;
  canCompact: boolean;
  supported: boolean;
  isEstimate: boolean;
  summary: string | null;
  compactedAt: string | null;
  beforeTokens: number | null;
  afterTokens: number | null;
}

export interface ChatContextEvent {
  chatId: string;
  spanId: number;
  status: ChatContextStatus;
  stage: 'ready' | 'started' | 'completed' | 'failed';
  error?: string | null;
}

export interface ContextHandoffPreview {
  summary: string | null;
  sourceHash: string;
  includesRecentMessages: boolean;
}
