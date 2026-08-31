import { DragEvent, useContext, useRef, useState } from 'react';

import { chatsGroupByUpdatedAt, isUnGroupChat } from '@/utils/chats';
import { currentISODateString } from '@/utils/date';

import { IChat, UngroupedChatName } from '@/types/chat';
import { PutMoveChatGroupParams } from '@/types/clientApis';
import { IChatGroup } from '@/types/group';

import Folder from '@/components/Folder/Folder';
import { SidebarGroup } from '@/components/ui/sidebar';

import { setChatGroup, setChats } from '@/actions/chat.actions';
import HomeContext from '@/contexts/home.context';
import ChatList from './ChatList';

import {
  deleteChatGroup,
  putChatGroup,
  putChats,
  putMoveChatGroup,
} from '@/apis/clientApis';
import { cn } from '@/lib/utils';

interface Props {
  onShowMore?: (groupId: string | null) => void;
}

const ChatGroups = ({ onShowMore }: Props) => {
  const {
    state: { chats, chatGroups },
    chatDispatch,
    handleCreateChat,
  } = useContext(HomeContext);

  const groupRefs = useRef<any>({});

  const [currentDragGroup, setCurrentDragGroup] = useState<IChatGroup | null>();
  const [currentDragChat, setCurrentDragChat] = useState<IChat | null>();

  const handleClickGroup = (folder: IChatGroup) => {
    const chatGroupList = chatGroups.map((x) =>
      x.id === folder.id ? { ...x, isExpanded: !folder.isExpanded } : x,
    );
    chatDispatch(setChatGroup(chatGroupList));
    folder.id &&
      putChatGroup({ id: folder.id, isExpanded: !folder.isExpanded });
  };

  const handleDeleteGroup = (groupId: string, index: number) => {
    deleteChatGroup(groupId).then(() => {
      const chatList = chats.map((x) => {
        if (x.groupId === groupId) {
          x.groupId = null;
        }
        return x;
      });
      const chatFolderList = chatGroups.filter((x) => x.id !== groupId);
      chatDispatch(setChats(chatList));
      chatDispatch(setChatGroup(chatFolderList));
      groupRefs.current[groupId] = undefined;
    });
  };

  const handRenameGroup = (groupId: string, value: string) => {
    putChatGroup({ id: groupId, name: value }).then(() => {
      const chatFolderList = chatGroups.map((x) => {
        if (x.id === groupId) {
          x.name = value;
        }
        return x;
      });
      chatDispatch(setChatGroup(chatFolderList));
    });
  };

  const handleRemoveDragStyles = () => {
    Object.keys(groupRefs.current).forEach((key: string) => {
      if (groupRefs.current[key]) {
        groupRefs.current[key].style.background = 'none';
      }
    });
  };

  const handleDrop = (e: any, folder: IChatGroup) => {
    if (currentDragChat) {
      if (currentDragChat.groupId === folder.id) return;
      const chatList = chats.map((c) => {
        if (c.id === currentDragChat.id) {
          return {
            ...c,
            groupId: folder.id,
            updatedAt: currentISODateString(),
          };
        }
        return c;
      });
      chatDispatch(setChats(chatList));
      putChats(currentDragChat.id, { setsGroupId: true, groupId: folder.id });
    } else if (currentDragGroup) {
      const groupId = currentDragGroup.id;
      const chatGroupsCount = chatGroups.length;
      const params = {
        groupId,
        beforeGroupId: null,
        afterGroupId: null,
      } as PutMoveChatGroupParams;

      const index = chatGroups.findIndex((x) => x.id === groupId);
      if (index >= 0 && index < chatGroupsCount - 1) {
        params.beforeGroupId = chatGroups[index + 1].id;
      }
      if (index > 0) {
        params.afterGroupId = chatGroups[index - 1].id;
      }
      putMoveChatGroup(params);
    }

    handleRemoveDragStyles();

    setCurrentDragChat(null);
    setCurrentDragGroup(null);
  };

  const handleGroupDragStart = (
    e: DragEvent<HTMLButtonElement>,
    group: IChatGroup,
  ) => {
    const chatGroupList = chatGroups.map((x) => ({ ...x, isExpanded: false }));
    chatDispatch(setChatGroup(chatGroupList));
    setCurrentDragGroup(group);
  };

  const handleItemDragStart = (
    e: DragEvent<HTMLElement>,
    chat: IChat,
  ) => {
    const chatGroupList = chatGroups.map((x) => ({ ...x, isExpanded: false }));
    chatDispatch(setChatGroup(chatGroupList));
    setCurrentDragChat(chat);
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
  };

  const handleDragEnter = (index: number, groupId: string) => {
    if (currentDragGroup) {
      const chatGroupList = [...chatGroups];
      const dragGroupIndex = chatGroupList.findIndex(
        (x) => x.id === currentDragGroup?.id,
      );
      chatGroupList.splice(dragGroupIndex, 1);
      chatGroupList.splice(index, 0, currentDragGroup!);
      chatDispatch(setChatGroup(chatGroupList));
    }
    Object.keys(groupRefs.current).forEach((key: string) => {
      if (key === groupId) {
        groupRefs.current[key].style.background = 'hsl(var(--muted))';
      } else if (groupRefs.current[key]) {
        groupRefs.current[key].style.background = 'none';
      }
    });
  };

  const handleGroupNewChat = async (groupId: string) => {
    await handleCreateChat(groupId);
  };

  const ChatGroupsRender = (chatGroup: IChatGroup) => {
    const chatList = chats.filter((x) => x.groupId === chatGroup.id);
    const groupByUpdatedChats = chatsGroupByUpdatedAt(chatList);
    return (
      <div
        className={cn(!isUnGroupChat(chatGroup.id) && 'ml-3 border-l border-sidebar-border/50')}
      >
        <ChatList
          onDragItemStart={handleItemDragStart}
          groupId={chatGroup.id}
          onShowMore={onShowMore}
          chatGroups={groupByUpdatedChats}
        />
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col">
      {chatGroups.map((group, index) => {
        const isAllChatGroup = isUnGroupChat(group.id);
        return (
          <div
            key={'chat-group-' + index}
            className="rounded-md"
            ref={(el) => {
              groupRefs.current[group.id || UngroupedChatName] = el;
            }}
            onDrop={(e) => handleDrop(e, group)}
            onDragOver={handleDragOver}
            onDragEnd={handleRemoveDragStyles}
            onDragEnter={() => {
              !isAllChatGroup &&
                handleDragEnter(index, group.id || UngroupedChatName);
            }}
          >
            {isAllChatGroup ? (
              ChatGroupsRender(group)
            ) : (
              <SidebarGroup className="py-0">
                <Folder
                  showActions={!isAllChatGroup}
                  defaultOpen={group.isExpanded}
                  currentFolder={group}
                  onClickGroup={handleClickGroup}
                  onDeleteGroup={(id: string) => {
                    handleDeleteGroup(id, index);
                  }}
                  onRenameGroup={handRenameGroup}
                  onDragStart={handleGroupDragStart}
                  onNewGroupChat={handleGroupNewChat}
                  folderComponent={ChatGroupsRender(group)}
                />
              </SidebarGroup>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ChatGroups;
