'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

import {
  UserInfo,
  getUserInfo,
  getUserSession,
  redirectToLoginPage,
} from '@/utils/user';

const UserContext = createContext<UserInfo | null>(null);

const getAuthenticatedUser = (): UserInfo | null => {
  const userInfo = getUserInfo();
  if (!userInfo || !getUserSession()) {
    return null;
  }
  return userInfo;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user] = useState<UserInfo | null>(() => getAuthenticatedUser());

  useEffect(() => {
    if (!user) {
      redirectToLoginPage();
    }
  }, [user]);

  if (!user) {
    return null;
  }

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export const useUserInfo = () => {
  const user = useContext(UserContext) || getUserInfo();
  if (!user) {
    redirectToLoginPage();
    return;
  }
  return user;
};
