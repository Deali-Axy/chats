type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const chatDraftKey = (userId: string, chatId: string | null) =>
  `ayaka.chatDraft.v1:${encodeURIComponent(userId)}:${
    chatId === null ? 'new' : `chat:${encodeURIComponent(chatId)}`
  }`;

/** One composer store. Every edit is saved synchronously, before a redirect can unload it. */
export const createChatDraftStore = (
  userId: string | null,
  chatId: string | null,
  getStorage: () => DraftStorage = () => window.localStorage,
) => {
  const key = userId ? chatDraftKey(userId, chatId) : null;
  let text = '';
  try {
    if (key) text = getStorage().getItem(key) ?? '';
  } catch {
    // Editing still works when browser storage is unavailable.
  }

  const listeners = new Set<() => void>();
  return {
    getSnapshot: () => text,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setText: (value: string | ((previous: string) => string)) => {
      text = typeof value === 'function' ? value(text) : value;
      try {
        if (key) {
          if (text === '') getStorage().removeItem(key);
          else getStorage().setItem(key, text);
        }
      } catch {
        // Storage quotas and privacy settings must not interrupt typing or sending.
      }
      listeners.forEach((listener) => listener());
    },
  };
};
