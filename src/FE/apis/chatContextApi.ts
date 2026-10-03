import { getApiUrl } from '@/utils/common';
import { getUserSession } from '@/utils/user';

import { ChatContextStatus } from '@/types/chatContext';

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
    const text = await response.text();
    let message = text || response.statusText;
    try {
      message = JSON.parse(text).message || message;
    } catch {
      /* Plain text errors are also supported. */
    }
    throw new Error(message);
  }
  return response.status === 204 ? (undefined as T) : response.json();
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

export const compactChatContext = (
  chatId: string,
  spanId: number,
  leafMessageId: string | null,
  signal?: AbortSignal,
) =>
  request<ChatContextStatus>(
    chatId,
    'compact',
    'POST',
    { spanId, leafMessageId },
    signal,
  );

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
