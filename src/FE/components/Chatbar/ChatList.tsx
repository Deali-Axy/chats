import { DragEvent, useContext } from 'react';

import useTranslation from '@/hooks/useTranslation';

import { isUnGroupChat } from '@/utils/chats';

import { IChat } from '@/types/chat';

import { Button } from '@/components/ui/button';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from '@/components/ui/sidebar';

import HomeContext from '@/contexts/home.context';
import ChatListItem from './ChatListItem';

import { cn } from '@/lib/utils';

interface Props {
  groupId: string | null;
  chatGroups: Map<string, IChat[]>;
  onShowMore?: (groupId: string | null) => void;
  onDragItemStart?: (e: DragEvent<HTMLElement>, chat: IChat) => void;
}

const ChatList = ({
  groupId,
  chatGroups,
  onShowMore,
  onDragItemStart,
}: Props) => {
  const { t } = useTranslation();
  const {
    state: { chatPaging },
  } = useContext(HomeContext);

  const currentPaging = chatPaging.find((x) => x.groupId === groupId);
  const hasMore =
    currentPaging !== undefined
      ? currentPaging.count > currentPaging.page * currentPaging.pageSize
      : false;

  const handleShowMore = () => {
    onShowMore && onShowMore(groupId);
  };

  return (
    <>
      {chatGroups.size > 0 &&
        [...chatGroups.entries()].map(([group, items]) => (
          <SidebarGroup key={group} className="py-1">
            <SidebarGroupLabel className="text-xs text-sidebar-foreground/60 font-medium">
              {t(group)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((chat, index) => (
                  <div
                    className={cn(!isUnGroupChat(groupId) && 'ml-1')}
                    key={'conversation-' + index}
                  >
                    <ChatListItem
                      onDragItemStart={onDragItemStart}
                      chat={chat}
                    />
                  </div>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      {hasMore && (
        <Button onClick={handleShowMore} className="text-xs mx-2" variant="link">
          {t('Show more')}
        </Button>
      )}
    </>
  );
};
export default ChatList;
