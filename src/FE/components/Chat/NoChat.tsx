import { KeyboardEvent, useContext, useEffect, useMemo, useState } from 'react';

import useTranslation from '@/hooks/useTranslation';

import { ChatRole, Message, MessageContentType } from '@/types/chat';

import ChatModelDropdownMenu from '@/components/ChatModelDropdownMenu/ChatModelDropdownMenu';
import { IconSendPlane } from '@/components/Icons';
import ModelProviderIcon from '@/components/common/ModelProviderIcon';
import { Button } from '@/components/ui/button';
import { useSendKeyHandler } from '@/components/ui/send-button';
import { Textarea } from '@/components/ui/textarea';

import HomeContext from '@/contexts/home.context';

/**
 * The first-message composer shown before a conversation exists.
 */
const NoChat = ({
  onSend,
}: {
  onSend: (message: Message, modelId: number) => void;
}) => {
  const { t } = useTranslation();
  const {
    state: { chats, models },
  } = useContext(HomeContext);
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const preferredModelId = useMemo(
    () =>
      chats.find((chat) => chat.spans[0]?.modelId)?.spans[0]?.modelId ??
      models[0]?.modelId,
    [chats, models],
  );
  const [modelId, setModelId] = useState<number | undefined>(preferredModelId);

  useEffect(() => {
    if (!models.some((model) => model.modelId === modelId)) {
      setModelId(preferredModelId);
    }
  }, [modelId, models, preferredModelId]);

  const selectedModel = models.find((model) => model.modelId === modelId);

  const handleSend = () => {
    if (!content.trim()) return;

    if (!selectedModel) return;

    onSend(
      {
        role: ChatRole.User,
        content: [
          { i: '', $type: MessageContentType.text as const, c: content },
        ],
      },
      selectedModel.modelId,
    );
    setContent('');
  };

  const { handleKeyDown } = useSendKeyHandler(handleSend, isTyping);

  return (
    <div className="flex min-h-full w-full items-center justify-center px-5 pb-24 sm:px-8">
      <div className="w-full max-w-3xl -translate-y-8">
        <h1 className="mb-7 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
          {t('What can I help with?')}
        </h1>

        <div className="rounded-[1.5rem] border border-border/60 bg-card p-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow focus-within:shadow-[0_10px_36px_rgba(0,0,0,0.12)] dark:bg-neutral-950">
          <Textarea
            className="min-h-[104px] w-full resize-none border-0 bg-transparent px-3 py-2 text-base leading-6 shadow-none outline-none placeholder:text-muted-foreground focus-visible:ring-0"
            placeholder={t('Message Ayaka Chats') || ''}
            value={content}
            rows={4}
            onChange={(event) => setContent(event.target.value)}
            onCompositionStart={() => setIsTyping(true)}
            onCompositionEnd={() => setIsTyping(false)}
            onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) =>
              handleKeyDown(event)
            }
          />
          <div className="flex items-center justify-between gap-3 px-1 pt-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {t('Start a conversation with AI assistant')}
            </span>
            <div className="flex items-center gap-2">
              {selectedModel && (
                <ChatModelDropdownMenu
                  models={models}
                  modelId={selectedModel.modelId}
                  modelName={selectedModel.name}
                  triggerClassName="h-10 max-w-44 gap-1.5 rounded-full border border-border/70 bg-muted/55 px-3 text-sm shadow-sm transition-colors hover:bg-muted"
                  content={
                    <>
                      <ModelProviderIcon
                        providerId={selectedModel.modelProviderId}
                      />
                      <span className="min-w-0 truncate">
                        {selectedModel.name}
                      </span>
                    </>
                  }
                  onChangeModel={(model) => setModelId(model.modelId)}
                />
              )}
              <Button
                type="button"
                variant="default"
                size="icon"
                aria-label={t('Send') || 'Send'}
                title={t('Send') || 'Send'}
                onClick={handleSend}
                disabled={!content.trim() || !selectedModel}
                className="h-11 w-11 shrink-0 rounded-full bg-foreground text-background shadow-sm transition-all hover:-translate-y-0.5 hover:bg-foreground/85 hover:shadow-md active:translate-y-0 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none dark:bg-foreground dark:text-background"
              >
                <IconSendPlane stroke="currentColor" strokeWidth={2} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoChat;
