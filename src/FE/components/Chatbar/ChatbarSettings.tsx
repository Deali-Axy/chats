import { useCallback, useEffect, useState } from 'react';

import { toFixed } from '@/utils/common';

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
  const [userBalance, setUserBalance] = useState<number | null>(null);

  const getUserBalance = useCallback(
    () =>
      getUserBalanceOnly()
        .then((data) => setUserBalance(data))
        .catch(() => {}),
    [],
  );

  useEffect(() => {
    void getUserBalance();
    const refreshTimer = window.setInterval(() => {
      void getUserBalance();
    }, 30_000);

    return () => window.clearInterval(refreshTimer);
  }, [getUserBalance]);

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
                <span
                  className="shrink-0 rounded-md bg-sidebar-accent px-1.5 py-0.5 text-xs font-medium tabular-nums text-sidebar-foreground/75"
                  title="Account balance"
                >
                  {userBalance === null ? '--' : toFixed(userBalance)}
                </span>
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
