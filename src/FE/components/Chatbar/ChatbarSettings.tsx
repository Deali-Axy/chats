import { useState } from 'react';

import { IconUser } from '@/components/Icons/index';
import UserMenuPopover, { PageType } from '@/components/UserMenuPopover/UserMenuPopover';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

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
              <SidebarMenuButton className="capitalize">
                <IconUser size={18} />
                <span>{user?.username}</span>
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
