import { useState } from 'react';

import { IconUser } from '@/components/Icons/index';
import UserMenuPopover, {
  PageType,
} from '@/components/UserMenuPopover/UserMenuPopover';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import { getUserBalanceOnly } from '@/apis/clientApis';
import { useUserInfo } from '@/providers/UserProvider';

const ChatBarSettings = () => {
  const user = useUserInfo();
  const [userBalance, setUserBalance] = useState<number>(0);

  const getUserBalance = () => {
    getUserBalanceOnly().then((data) => setUserBalance(data));
  };

  const handleClickUserMore = () => {
    getUserBalance();
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {user?.username && (
          <UserMenuPopover
            pageType={PageType.Chat}
            trigger={
              <SidebarMenuButton className="h-11 rounded-xl px-2.5 py-2 capitalize transition-colors hover:bg-sidebar-accent">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-accent">
                  <IconUser size={16} />
                </div>
                <span className="flex-1 truncate">{user?.username}</span>
              </SidebarMenuButton>
            }
            onOpen={handleClickUserMore}
          />
        )}
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
export default ChatBarSettings;
