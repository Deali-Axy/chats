import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';

import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';

import { DEFAULT_FONT_SIZE, getSettings } from '@/utils/settings';
import { getUserInfo, isLoggedIn, isPublicPath, redirectToLoginPage } from '@/utils/user';

import { UserRole } from '@/types/adminApis';

import ErrorPage from './_error';
import AdminLayout from '@/components/admin/layout/AdminLayout';
import BuildLayout from '@/components/build/layout/BuildLayout';
import './globals.css';

import { ThemeProvider } from '@/providers/ThemeProvider';

function App({ Component, pageProps }: AppProps<{}> | any) {
  const route = useRouter();

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    document.title = 'Chats';
    // Apply saved font size on app start
    const settings = getSettings();
    const fontSize = settings.fontSize ?? DEFAULT_FONT_SIZE;
    document.documentElement.style.setProperty('--chat-font-size', `${fontSize}px`);

    if (!isPublicPath(route.pathname) && !isLoggedIn()) {
      redirectToLoginPage();
      return;
    }

    setIsClient(true);
  }, [route.pathname]);

  const isAdmin = () => {
    const user = getUserInfo();
    return user?.role === UserRole.admin;
  };

  return (
    <ThemeProvider
      attribute="class"
      enableSystem
      disableTransitionOnChange
    >
      <Toaster />
      {isClient &&
        (isPublicPath(route.pathname) || isLoggedIn()) &&
        (route.pathname.includes('/admin') ? (
          isAdmin() ? (
            <AdminLayout>
              <Component {...pageProps} />
            </AdminLayout>
          ) : (
            <ErrorPage statusCode={404} />
          )
        ) : route.pathname.includes('/build') ? (
          <BuildLayout>
            <Component {...pageProps} />
          </BuildLayout>
        ) : (
          <Component {...pageProps} />
        ))}
    </ThemeProvider>
  );
}

export default App;
