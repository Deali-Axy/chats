import { useContext, useState } from 'react';

import useTranslation from '@/hooks/useTranslation';

import { isMobile } from '@/utils/common';

import { ChatStatus, IChat } from '@/types/chat';

import ChatModelDropdownMenu from '@/components/ChatModelDropdownMenu/ChatModelDropdownMenu';
import {
  IconBolt,
  IconDots,
  IconLayoutSidebar,
  IconX,
} from '@/components/Icons';
import Tips from '@/components/Tips/Tips';
import ModelProviderIcon from '@/components/common/ModelProviderIcon';
import { Button } from '@/components/ui/button';

import ChatModelSettingModal from './ChatModelSettingsModal';

import { setChats } from '@/actions/chat.actions';
import { setShowChatBar } from '@/actions/setting.actions';
import { switchChatModel } from '@/apis/clientApis';
import HomeContext from '@/contexts/home.context';
import { cn } from '@/lib/utils';

const ChatHeader = () => {
  const { t } = useTranslation();
  const {
    state: { models, showChatBar, chats },
    selectedChat,
    chatDispatch,
    settingDispatch,
    handleEndTempChat,
    tempChat,
    setTempChat,
  } = useContext(HomeContext);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const config = selectedChat?.spans[0];

  const updateChat = (updatedChat: IChat) => {
    if (!selectedChat || !config) return;
    if (selectedChat.isTemp && tempChat) {
      setTempChat(updatedChat as IChat);
      return;
    }
    chatDispatch(
      setChats(
        chats.map((chat) => (chat.id === selectedChat.id ? updatedChat : chat)),
      ),
    );
  };

  const handleSwitchModel = async (modelId: number) => {
    if (!selectedChat || !config) return;
    const data = await switchChatModel(selectedChat.id, modelId);
    updateChat({ ...selectedChat, spans: [{ ...config, ...data }] });
  };

  const modelAvailable = config
    ? models.some((model) => model.modelId === config.modelId)
    : false;

  return (
    <>
      <header className="sticky left-0 top-0 z-10 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="flex h-14 select-none items-center justify-between px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => settingDispatch(setShowChatBar(!showChatBar))}
              aria-label={showChatBar ? t('Hide sidebar') : t('Show sidebar')}
            >
              <IconLayoutSidebar size={18} />
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {selectedChat?.title || 'Ayaka Chats'}
              </p>
              {!selectedChat && (
                <p className="text-xs text-muted-foreground">
                  {t('New conversation')}
                </p>
              )}
            </div>
          </div>
          {selectedChat && config && (
            <div className="flex items-center gap-1.5">
              <div className="flex items-center">
                {selectedChat.isTemp && (
                  <>
                    <Tips
                      trigger={
                        <div className="mr-1 flex items-center gap-1 rounded-md bg-yellow-500/10 px-2 py-1 text-yellow-600 dark:text-yellow-400">
                          <IconBolt size={16} />
                          <span className="text-xs font-medium">
                            {t('Temporary')}
                          </span>
                        </div>
                      }
                      content={t('This chat will not be saved')}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-yellow-600 dark:text-yellow-400"
                      onClick={handleEndTempChat}
                    >
                      <IconX size={14} className="mr-1" />
                      {t('End Temporary Chat')}
                    </Button>
                  </>
                )}
                <div
                  className={cn(
                    'flex items-center rounded-lg',
                    selectedChat.status === ChatStatus.Chatting &&
                      'pointer-events-none',
                  )}
                >
                  <ChatModelDropdownMenu
                    key={`chat-model-${config.modelId}`}
                    models={models}
                    modelName={config.modelName}
                    className="text-sm"
                    triggerClassName="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-accent"
                    content={
                      <>
                        <ModelProviderIcon
                          providerId={config.modelProviderId}
                        />
                        <span className={cn(!modelAvailable && 'opacity-50')}>
                          {config.modelName || t('Model not available')}
                        </span>
                      </>
                    }
                    hideIcon={isMobile()}
                    onChangeModel={(model) => {
                      void handleSwitchModel(model.modelId);
                    }}
                  />
                  <Button
                    variant="ghost"
                    className="h-8 w-8 rounded-lg p-0"
                    onClick={() => setIsSettingsOpen(true)}
                  >
                    <IconDots className="rotate-90" size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
      {selectedChat && (
        <ChatModelSettingModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </>
  );
};

export default ChatHeader;
