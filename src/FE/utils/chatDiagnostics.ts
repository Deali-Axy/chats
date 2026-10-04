import { getApiUrl } from './common';
import { getUserSession } from './user';

export interface ChatStreamDiagnostic {
  chatId: string;
  requestTraceId?: string;
  stopId?: string;
  eventCount: number;
  lastEventKind?: number;
}

const streams = new Map<string, ChatStreamDiagnostic>();
let reportWindowStarted = 0;
let reportCount = 0;

export function updateChatStreamDiagnostic(snapshot: ChatStreamDiagnostic) {
  streams.delete(snapshot.chatId);
  streams.set(snapshot.chatId, { ...snapshot });
  if (streams.size > 20) streams.delete(streams.keys().next().value!);
}

export function reportChatDiagnostic(
  stage: 'render' | 'stream-read' | 'stream-parse' | 'stream-incomplete',
  chatId: string | undefined,
  error?: unknown,
  componentStack?: string | null,
) {
  try {
    const session = getUserSession();
    if (!session) return;
    const now = Date.now();
    if (now - reportWindowStarted >= 60_000) {
      reportWindowStarted = now;
      reportCount = 0;
    }
    if (reportCount++ >= 10) return;

    const exception = error instanceof Error ? error : undefined;
    // Exclude exception messages and payloads: parser errors can quote chat text.
    // Retain stack frames from source files, without URL queries or fragments.
    const stackFrames = (exception?.stack ?? '').split('\n').slice(1)
      .filter((line) => /https?:\/\//.test(line))
      .map((line) => line.replace(/https?:\/\/[^\s)]+/g, (url) => {
        const location = /(:\d+(?::\d+)?)$/.exec(url)?.[0] ?? '';
        return url.replace(/[?#].*$/, '') + (/[?#]/.test(url) ? location : '');
      })).join('\n').slice(0, 4000);

    void fetch(`${getApiUrl()}/api/client-diagnostics/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session}` },
      body: JSON.stringify({
        ...(chatId ? streams.get(chatId) : undefined),
        chatId,
        stage,
        version: process.env.FE_VERSION || 'local',
        errorName: exception?.name?.slice(0, 100),
        stackFrames,
        componentStack: componentStack?.slice(0, 4000),
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Diagnostics must never interfere with chat recovery.
  }
}
