import { useContext, useState } from 'react';

import useTranslation from '@/hooks/useTranslation';
import { isMobile } from '@/utils/common';
import { ChatStatus, IChat } from '@/types/chat';

import ModelProviderIcon from '@/components/common/ModelProviderIcon';
import ChatModelDropdownMenu from '@/components/ChatModelDropdownMenu/ChatModelDropdownMenu';
import { IconBolt, IconDots, IconX } from '@/components/Icons';
import Tips from '@/components/Tips/Tips';
import { Button } from '@/components/ui/button';

import { setChats } from '@/actions/chat.actions';
import { switchChatModel } from '@/apis/clientApis';
import HomeContext from '@/contexts/home.context';
import { cn } from '@/lib/utils';
import ChatModelSettingModal from './ChatModelSettingsModal';

const ChatHeader = () => {
  const { t } = useTranslation();
  const {
    state: { models, showChatBar, chats },
    selectedChat,
    chatDispatch,
    handleEndTempChat,
    tempChat,
    setTempChat,
  } = useContext(HomeContext);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (!selectedChat) return null;
  const config = selectedChat.spans[0];
  if (!config) return null;

  const updateChat = (updatedChat: typeof selectedChat) => {
    if (selectedChat.isTemp && tempChat) {
      setTempChat(updatedChat as IChat);
      return;
    }
    chatDispatch(setChats(chats.map((chat) => chat.id === selectedChat.id ? updatedChat : chat)));
  };

  const handleSwitchModel = async (modelId: number) => {
    const data = await switchChatModel(selectedChat.id, modelId);
    updateChat({ ...selectedChat, spans: [{ ...config, ...data }] });
  };

  const modelAvailable = models.some((model) => model.modelId === config.modelId);

  return (
    <>
      <div className="sticky top-0 left-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className={cn('stretch mx-4 flex flex-row rounded-lg', !showChatBar && 'mx-2')}>
          <div className="relative flex w-full flex-grow flex-col overflow-hidden rounded-lg bg-card shadow-sm">
            <div className="flex select-none items-center justify-between overflow-x-auto px-3">
              <div className={cn('flex h-12 items-center', !showChatBar && 'pl-16')}>
                {selectedChat.isTemp && (
                  <>
                    <Tips
                      trigger={<div className="mr-1 flex items-center gap-1 rounded-md bg-yellow-500/10 px-2 py-1 text-yellow-600 dark:text-yellow-400"><IconBolt size={16} /><span className="text-xs font-medium">{t('Temporary')}</span></div>}
                      content={t('This chat will not be saved')}
                    />
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-yellow-600 dark:text-yellow-400" onClick={handleEndTempChat}>
                      <IconX size={14} className="mr-1" />{t('End Temporary Chat')}
                    </Button>
                  </>
                )}
                <div className={cn('flex items-center rounded-md', selectedChat.status === ChatStatus.Chatting && 'pointer-events-none')}>
                  <ChatModelDropdownMenu
                    key={`chat-model-${config.modelId}`}
                    models={models}
                    modelName={config.modelName}
                    className="text-sm"
                    triggerClassName="flex items-center gap-1.5 px-2 hover:bg-accent"
                    content={<><ModelProviderIcon providerId={config.modelProviderId} /><span className={cn(!modelAvailable && 'opacity-50')}>{config.modelName || t('Model not available')}</span></>}
                    hideIcon={isMobile()}
                    onChangeModel={(model) => { void handleSwitchModel(model.modelId); }}
                  />
                  <Button variant="ghost" className="h-auto p-1" onClick={() => setIsSettingsOpen(true)}>
                    <IconDots className="rotate-90" size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ChatModelSettingModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};

export default ChatHeader;
