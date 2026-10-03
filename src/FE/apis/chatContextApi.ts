import { getApiUrl } from '@/utils/common';
import { getUserSession } from '@/utils/user';

import { ChatContextStatus, ContextHandoffPreview } from '@/types/chatContext';
import { ChatResult } from '@/types/clientApis';

export const CONTEXT_TIMEOUT_MESSAGE =
  'The model request timed out. Try again, or compact older turns first.';

type ContextStreamEvent = {
  k: 'started' | 'delta' | 'done' | 'error';
  r?: string;
  replace?: boolean;
  message?: string;
  summary?: string | null;
  sourceHash?: string;
  includesRecentMessages?: boolean;
  status?: ChatContextStatus;
};

function looksLikeGatewayFailure(text: string) {
  return (
    /<\s*(html|head|!DOCTYPE|center)\b/i.test(text) ||
    /\b(502|503|504|408)\b.*(Bad Gateway|Time-?out|Service Unavailable)/i.test(
      text,
    ) ||
    /Gateway Time-?out/i.test(text)
  );
}

export function readContextApiError(
  status: number,
  text: string,
  fallback = 'Context operation failed',
) {
  if (
    status === 408 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    looksLikeGatewayFailure(text)
  ) {
    return CONTEXT_TIMEOUT_MESSAGE;
  }
  const trimmed = text.trim();
  if (!trimmed) return fallback;
  try {
    const parsed = JSON.parse(trimmed) as {
      message?: string;
      errMessage?: string;
    };
    const message = parsed.message || parsed.errMessage || trimmed;
    return looksLikeGatewayFailure(message) ? CONTEXT_TIMEOUT_MESSAGE : message;
  } catch {
    return looksLikeGatewayFailure(trimmed) ? CONTEXT_TIMEOUT_MESSAGE : trimmed;
  }
}

async function parseError(response: Response, fallback?: string) {
  return readContextApiError(response.status, await response.text(), fallback);
}

async function request<T>(
  chatId: string,
  action: string,
  method: string,
  body: object,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(
    `${getApiUrl()}/api/chat/${encodeURIComponent(chatId)}/context/${action}`,
    {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getUserSession()}`,
      },
      body: JSON.stringify(body),
      signal,
    },
  );
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

async function* parseSse(
  response: Response,
): AsyncGenerator<ContextStreamEvent> {
  const data = response.body;
  if (!data) return;
  const reader = data.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let boundaryIndex: number;
      while (
        (boundaryIndex = buffer.indexOf('\n\n')) >= 0 ||
        (boundaryIndex = buffer.indexOf('\r\n\r\n')) >= 0
      ) {
        const isDoubleCRLF = buffer[boundaryIndex] === '\r';
        const messageBlock = buffer.slice(0, boundaryIndex);
        buffer = buffer.slice(boundaryIndex + (isDoubleCRLF ? 4 : 2));
        if (!messageBlock.trim()) continue;
        const dataLines: string[] = [];
        for (const line of messageBlock.split(/\r?\n/)) {
          if (line.startsWith('data:'))
            dataLines.push(line.slice(5).trimStart());
        }
        if (dataLines.length === 0) continue;
        try {
          yield JSON.parse(dataLines.join('\n')) as ContextStreamEvent;
        } catch {
          /* Ignore malformed keep-alive or truncated frames. */
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function streamRequest(
  chatId: string,
  action: string,
  body: object,
  signal: AbortSignal | undefined,
  onEvent?: (event: ContextStreamEvent) => void,
): Promise<ContextStreamEvent> {
  const response = await fetch(
    `${getApiUrl()}/api/chat/${encodeURIComponent(chatId)}/context/${action}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getUserSession()}`,
      },
      body: JSON.stringify(body),
      signal,
    },
  );
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/event-stream')) {
    const value = await response.json();
    return { k: 'done', ...value, status: value };
  }
  let done: ContextStreamEvent | undefined;
  for await (const event of parseSse(response)) {
    if (event.k === 'error') {
      throw new Error(
        readContextApiError(
          200,
          event.message ?? '',
          'Context operation failed',
        ),
      );
    }
    onEvent?.(event);
    if (event.k === 'done') done = event;
  }
  if (!done) {
    if (signal?.aborted) {
      const cancelled = new Error('The request was cancelled.');
      cancelled.name = 'AbortError';
      throw cancelled;
    }
    throw new Error(CONTEXT_TIMEOUT_MESSAGE);
  }
  return done;
}

export const previewChatContext = (
  chatId: string,
  spanId: number,
  leafMessageId: string | null,
  draftText: string,
  draftFileCount: number,
  signal?: AbortSignal,
) =>
  request<ChatContextStatus>(
    chatId,
    'preview',
    'POST',
    { spanId, leafMessageId, draftText, draftFileCount },
    signal,
  );

export const compactChatContext = async (
  chatId: string,
  spanId: number,
  leafMessageId: string | null,
  signal?: AbortSignal,
) => {
  const done = await streamRequest(
    chatId,
    'compact',
    { spanId, leafMessageId },
    signal,
  );
  if (!done.status) throw new Error('Context operation failed');
  return done.status;
};

export const resetChatContext = (chatId: string, spanId: number) =>
  request<void>(chatId, 'reset', 'POST', { spanId });

export const updateChatContextSettings = (
  chatId: string,
  spanId: number,
  autoCompactEnabled: boolean,
  keepRecentTurns: number,
) =>
  request<void>(chatId, `settings?spanId=${spanId}`, 'PUT', {
    autoCompactEnabled,
    keepRecentTurns,
  });

export const previewContextHandoff = async (
  chatId: string,
  spanId: number,
  leafMessageId: string | null,
  generateSummary: boolean,
  signal?: AbortSignal,
  onDelta?: (text: string, replace: boolean) => void,
): Promise<ContextHandoffPreview> => {
  if (!generateSummary) {
    return request<ContextHandoffPreview>(
      chatId,
      'handoff/preview',
      'POST',
      { spanId, leafMessageId, generateSummary },
      signal,
    );
  }
  const done = await streamRequest(
    chatId,
    'handoff/preview',
    { spanId, leafMessageId, generateSummary: true },
    signal,
    (event) => {
      if (event.k === 'delta' && event.r != null) {
        onDelta?.(event.r, event.replace === true);
      }
    },
  );
  if (!done.sourceHash) throw new Error('Context operation failed');
  return {
    summary: done.summary ?? null,
    sourceHash: done.sourceHash,
    includesRecentMessages: done.includesRecentMessages === true,
  };
};

export const createContextHandoff = (
  chatId: string,
  spanId: number,
  leafMessageId: string | null,
  sourceHash: string,
  summary: string,
  title: string,
  language: string,
) =>
  request<ChatResult>(chatId, 'handoff', 'POST', {
    spanId,
    leafMessageId,
    sourceHash,
    summary,
    title,
    language,
  });
