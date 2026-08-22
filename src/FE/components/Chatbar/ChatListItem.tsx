import {
  DragEvent,
  KeyboardEvent,
  MouseEventHandler,
  useContext,
  useEffect,
  useState,
} from 'react';
import toast from 'react-hot-toast';

import useTranslation from '@/hooks/useTranslation';

import { currentISODateString } from '@/utils/date';

import { CHATS_SELECT_TYPE, ChatStatus, IChat } from '@/types/chat';

import SidebarActionButton from '@/components/Button/SidebarActionButton';
import ModelProviderIcon from '@/components/common/ModelProviderIcon';
import Tips from '@/components/Tips/Tips';
import {
  IconArchive,
  IconBolt,
  IconCheck,
  IconDots,
  IconLoader,
  IconNotes,
  IconPencil,
  IconPin,
  IconPinnedOff,
  IconShare,
  IconTrash,
  IconX,
} from '@/components/Icons/index';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import { setChats } from '@/actions/chat.actions';
import HomeContext from '@/contexts/home.context';
import SharedMessageModal from '../Chat/SharedMessageModal';
import ChatbarContext from '../Chatbar/Chatbar.context';

import { deleteChats, deleteTempChats, putChats, summarizeChatTitle } from '@/apis/clientApis';
import { cn } from '@/lib/utils';

interface Props {
  chat: IChat;
  onDragItemStart?: (e: DragEvent<HTMLElement>, chat: IChat) => void;
}

const ChatListItem = ({ chat, onDragItemStart }: Props) => {
  const { t } = useTranslation();
  const {
    state: {
      chats,
      chatsSelectType,
      selectedChatId,
    },
    selectedChat,
    chatDispatch,
    handleSelectChat,
    handleUpdateChat,
  } = useContext(HomeContext);

  const selectChatId = selectedChatId;
  const status = selectedChat?.status;
  const chatting = status === ChatStatus.Chatting;

  const { handleDeleteChat } = useContext(ChatbarContext);

  const [title, setTitle] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChanging, setTitleChanging] = useState(false);
  const [isShare, setIsShare] = useState(false);
  const [isArchive, setIsArchive] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const handleEnterDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      selectChatId && handleChangeTitle(selectChatId);
    }
  };

  const handleChangeTitle = (chatId: string) => {
    if (title.trim().length > 0) {
      putChats(chatId, { title }).then(() => {
        handleUpdateChat(chats, chatId, { title });
        toast.success(t('Save successful'));
        setTitle('');
        setTitleChanging(false);
      });
    }
  };

  const handleDragStart = (e: DragEvent<HTMLElement>, chat: IChat) => {
    onDragItemStart && onDragItemStart(e, chat);
  };

  const handleConfirm: MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.stopPropagation();
    setIsConfirming(true);
    try {
      if (isDeleting) {
        if (chat.isTemp) {
          await deleteTempChats(chat.id);
        } else {
          await deleteChats(chat.id);
        }
        handleDeleteChat([chat.id]);
      } else if (isChanging) {
        handleChangeTitle(chat.id);
      } else if (isArchive) {
        await putChats(chat.id, { isArchived: true });
        handleDeleteChat([chat.id]);
      }
    } finally {
      setIsConfirming(false);
      setIsDeleting(false);
      setTitleChanging(false);
      setIsArchive(false);
    }
  };

  const handleCancel: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    setIsDeleting(false);
    setTitleChanging(false);
    setIsArchive(false);
  };

  const handleOpenChangeTitleModal: MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    setTitleChanging(true);
    selectChatId && setTitle(chat.title);
  };
  const handleOpenDeleteModal: MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    setIsDeleting(true);
  };
  const handleOpenShareModal: MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    setIsShare(true);
  };

  const handleSharedMessage = (isShared: boolean) => {
    handleUpdateChat(chats, selectChatId!, { isShared });
  };

  const handleOpenArchiveModal: MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    setIsArchive(true);
  };

  const handleSummarizeTitle: MouseEventHandler<HTMLDivElement> = async (e) => {
    e.stopPropagation();
    if (isSummarizing || chatting) {
      return;
    }

    setIsSummarizing(true);
    try {
      const result = await summarizeChatTitle(chat.id);
      handleUpdateChat(chats, chat.id, { title: result.title });
      toast.success(t('Title summary generated'));
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleChangeChatPin = (chatId: string, isPin: boolean = false) => {
    putChats(chatId, { isTopMost: isPin }).then(() => {
      chats.map((x) => {
        if (x.id === chatId) {
          x.isTopMost = isPin;
          x.updatedAt = currentISODateString();
        }
        return x;
      });
      chatDispatch(setChats(chats));
    });
  };

  const handleSelectByDeleteChat = (checked: boolean) => {
    const chatList = chats.map((c) =>
      c.id === chat.id ? { ...c, selected: checked } : { ...c },
    );
    chatDispatch(setChats(chatList));
  };

  useEffect(() => {
    if (isChanging) {
      setIsDeleting(false);
    } else if (isDeleting) {
      setTitleChanging(false);
    }
  }, [isChanging, isDeleting]);

  return (
    <SidebarMenuItem>
      {isChanging && selectChatId === chat.id ? (
        <div className="flex w-full items-center gap-2 rounded-lg bg-background px-3 py-2 border border-input">
          <input
            className="flex-1 overflow-hidden overflow-ellipsis bg-transparent text-left text-sm outline-none text-foreground"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleEnterDown}
            autoFocus
          />
        </div>
      ) : (
        <SidebarMenuButton
          asChild
          isActive={selectChatId === chat.id}
          className={cn(
            'h-auto min-h-9 py-2 px-3 rounded-lg transition-all duration-200',
            chatting && 'pointer-events-none opacity-60',
            selectChatId === chat.id && 'bg-sidebar-accent shadow-sm',
          )}
        >
          <a
            href={`#/${chat.id}`}
            className="no-underline"
            onClick={(e) => {
              if (chatting) {
                e.preventDefault();
                return;
              }
              e.preventDefault();
              handleSelectChat(chat);
            }}
            draggable
            onDragStart={(e) => handleDragStart(e, chat)}
          >
            <div
              className={cn(
                'group/icon relative overflow-hidden transition-all duration-300 max-w-[20px] shrink-0 hover:max-w-[240px]',
                chatsSelectType !== CHATS_SELECT_TYPE.NONE && 'max-w-[20px]',
              )}
            >
              <div className="flex overflow-hidden">
                {chatsSelectType !== CHATS_SELECT_TYPE.NONE ? (
                  <Checkbox
                    key={'chats-batch-delete-' + chat.id}
                    defaultChecked={!!chat?.selected}
                    onCheckedChange={(checked: boolean) => {
                      handleSelectByDeleteChat(checked);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  />
                ) : (
                  chat.spans.map((span, index) => (
                    <div
                      key={'chat-icon-wrapper-' + span.spanId}
                      className={cn(
                        'flex-shrink-0 relative transition-all duration-200',
                        index > 0 && '-ml-2.5 group-hover/icon:ml-[2px] opacity-0 group-hover/icon:opacity-100',
                      )}
                      style={{ zIndex: chat.spans.length - index }}
                    >
                      <Tips
                        trigger={
                          <div>
                            <ModelProviderIcon
                              key={'chat-icon-' + span.spanId}
                              providerId={span.modelProviderId}
                            />
                          </div>
                        }
                        side="bottom"
                        content={span.modelName}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            <div
              className={`relative max-h-5 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm break-all text-left text-[12.5px] ${
                selectChatId === chat.id ? 'pr-12' : 'pr-1'
              }`}
            >
              {chat.isTemp && (
                <IconBolt
                  size={14}
                  className="inline-block mr-1 text-amber-500 -mt-0.5"
                />
              )}
              {chat.title}
            </div>
          </a>
        </SidebarMenuButton>
      )}

      {(isDeleting || isChanging || isArchive) && selectChatId === chat.id && (
        <div className="absolute right-1 z-10 flex text-muted-foreground">
          <SidebarActionButton handleClick={handleConfirm} disabled={isConfirming}>
            {isConfirming ? (
              <IconLoader size={18} />
            ) : (
              <IconCheck size={18} />
            )}
          </SidebarActionButton>
          <SidebarActionButton handleClick={handleCancel} disabled={isConfirming}>
            <IconX size={18} />
          </SidebarActionButton>
        </div>
      )}

      {selectChatId === chat.id && !isDeleting && !isChanging && !isArchive && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={chatting}>
            <SidebarMenuAction showOnHover>
              <IconDots size={16} />
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-48"
            side="right"
            align="start"
          >
            {chat.isTopMost ? (
              <DropdownMenuItem
                className="flex justify-start gap-3"
                onClick={() => {
                  handleChangeChatPin(chat.id);
                }}
              >
                <IconPinnedOff size={18} />
                {t('UnPin')}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="flex justify-start gap-3"
                onClick={() => {
                  handleChangeChatPin(chat.id, true);
                }}
              >
                <IconPin size={18} />
                {t('Pin')}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="flex justify-start gap-3"
              onClick={handleOpenChangeTitleModal}
            >
              <IconPencil size={18} />
              {t('Edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isSummarizing}
              className="flex justify-start gap-3"
              onClick={handleSummarizeTitle}
            >
              {isSummarizing ? (
                <IconLoader size={18} className="animate-spin" />
              ) : (
                <IconNotes size={18} />
              )}
              {t('Summarize Title')}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex justify-start gap-3"
              onClick={handleOpenShareModal}
            >
              <IconShare size={18} />
              {t('Share')}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex justify-start gap-3"
              onClick={handleOpenDeleteModal}
            >
              <IconTrash size={18} />
              {t('Delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {isShare && (
        <SharedMessageModal
          isOpen={isShare}
          onClose={() => {
            setIsShare(false);
          }}
          chat={chats.find((x) => x.id === selectChatId)!}
          onShareChange={handleSharedMessage}
        />
      )}
    </SidebarMenuItem>
  );
};

export default ChatListItem;
