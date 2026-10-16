import { useMemo, useSyncExternalStore } from 'react';

import { chatDraftKey, createChatDraftStore } from '@/utils/chatDraft';
import { getSessionUserId } from '@/utils/user';

const getServerSnapshot = () => '';
// Reuse the store if a send finishes after the user switches away and back.
const stores = new Map<string, ReturnType<typeof createChatDraftStore>>();

const getStore = (userId: string | null, chatId: string | null) => {
  if (!userId) return createChatDraftStore(null, chatId);
  const key = chatDraftKey(userId, chatId);
  let store = stores.get(key);
  if (!store) {
    store = createChatDraftStore(userId, chatId);
    stores.set(key, store);
  }
  return store;
};

/** A null chat ID is the user's first-message draft on the welcome page. */
export const useChatDraft = (chatId: string | null) => {
  const userId = getSessionUserId();
  const store = useMemo(() => getStore(userId, chatId), [userId, chatId]);
  const text = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerSnapshot,
  );
  return [text, store.setText] as const;
};
