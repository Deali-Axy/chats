import { useEffect, useState } from 'react';
import Image from 'next/image';

import useTranslation from '@/hooks/useTranslation';

import { redirectToGithub } from '@/utils/website';

import { LoginConfigsResult } from '@/types/clientApis';
import { SiteInfoConfig } from '@/types/config';
import { LoginType } from '@/types/user';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import AccountLoginCard from '@/components/login/AccountLoginCard';
import KeyCloakLogin from '@/components/login/KeyCloakLogin';
import PhoneLoginCard from '@/components/login/PhoneLoginCard';
import PhoneRegisterCard from '@/components/login/PhoneRegisterCard';
import WeChatLogin from '@/components/login/WeChatLogin';

import { getLoginProviders, getSiteInfo } from '@/apis/clientApis';

enum TabKeys {
  PHONE = 'phone',
  REGISTER = 'register',
  ACCOUNT = 'account',
}

const LOGIN_SHOWCASE_IMAGES = [
  '/images/snapmixer/ayaka1.avif',
  '/images/snapmixer/ayaka2.avif',
  '/images/snapmixer/ayaka3.avif',
  '/images/snapmixer/ayaka4.avif',
];

const LOGIN_SHOWCASE_INTERVAL = 5000;
const PRODUCT_CONTACT_QR = '/images/wechat-offical-qrcode.webp';

type LoginHeader = {
  [key in TabKeys]: { title: string; description: string };
};

const getFeVersion = () => process.env.FE_VERSION || 'local';

export default function LoginPage() {
  const { t } = useTranslation();
  const [isClient, setIsClient] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [webSiteInfo, setWebSiteInfo] = useState<SiteInfoConfig>();
  const [feVersion, setFeVersion] = useState<string>(getFeVersion);
  const LoginHeaders: LoginHeader = {
    phone: {
      title: t('Sign in to Chats'),
      description: t(
        'Please enter your phone number and verification code below to complete the login',
      ),
    },
    register: {
      title: t('Welcome to register'),
      description: t(
        'Please enter your phone number and invitation code below to complete the register',
      ),
    },
    account: {
      title: t('Sign in to Chats'),
      description: t(
        'Please enter your account name and password below to complete the login',
      ),
    },
  };
  const [loginConfigs, setLoginConfigs] = useState<LoginConfigsResult[]>([]);
  const [loginLoading, setLoginLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabKeys>(TabKeys.ACCOUNT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
    getLoginProviders()
      .then((data) => {
        let hasPhoneType = false;
        setLoginConfigs(
          (data || []).map((x) => {  // 添加空值检查
            if (x.key === LoginType.Phone) {
              hasPhoneType = true;
            }
            return {
              type: x.key,
              configs: x.config,
            };
          }),
        );
        setCurrentTab(hasPhoneType ? TabKeys.PHONE : TabKeys.ACCOUNT);
        setLoading(false);
      })
      .catch((error) => {  // 添加错误处理
        console.error('Failed to load login providers:', error);
        setLoginConfigs([]);
        setCurrentTab(TabKeys.ACCOUNT);
        setLoading(false);
    });
    getSiteInfo().then((data) => {
      setWebSiteInfo(data);
    });
    setFeVersion(getFeVersion());
  }, []);

  useEffect(() => {
    if (LOGIN_SHOWCASE_IMAGES.length <= 1) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % LOGIN_SHOWCASE_IMAGES.length);
    }, LOGIN_SHOWCASE_INTERVAL);

    return () => window.clearInterval(timer);
  }, []);

  const openLoading = () => setLoginLoading(true);
  const closeLoading = () => setTimeout(() => setLoginLoading(false), 600);

  const hasLoginType = (type: LoginType) =>
    !!loginConfigs.find((x) => x.type === type);

  const renderTabsList = () => {
    return hasLoginType(LoginType.Phone) ? (
      <TabsList className="flex w-full flex-row justify-around">
        {hasLoginType(LoginType.Phone) && (
          <TabsTrigger
            value={TabKeys.PHONE}
            className="flex justify-center w-full"
          >
            {t('Mobile Login')}
          </TabsTrigger>
        )}
        {hasLoginType(LoginType.Phone) && (
          <TabsTrigger
            value={TabKeys.REGISTER}
            className="flex justify-center w-full"
          >
            {t('Register')}
          </TabsTrigger>
        )}
        <TabsTrigger
          value={TabKeys.ACCOUNT}
          className="flex justify-center w-full"
        >
          {t('Account Login')}
        </TabsTrigger>
      </TabsList>
    ) : (
      <></>
    );
  };

  return (
    <>
      {!loading && isClient && (
        <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
          <div className="relative hidden h-full flex-col overflow-hidden p-10 text-white dark:text-black lg:flex dark:border-r">
            <div className="absolute inset-0 bg-zinc-900 dark:bg-gray-50">
              {LOGIN_SHOWCASE_IMAGES.map((src, index) => (
                <div
                  key={src}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    activeSlide === index ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    priority={index === 0}
                    sizes="50vw"
                    className="object-cover"
                  />
                </div>
              ))}
              <div className="absolute inset-0 bg-zinc-950/45 dark:bg-gray-50/30" />
              <div className="absolute inset-x-0 bottom-0 top-1/3 bg-gradient-to-t from-zinc-950/70 via-zinc-950/15 to-transparent dark:from-gray-100/75 dark:via-gray-100/15 dark:to-transparent" />
            </div>
            <div className="relative z-20 flex items-center text-lg font-medium text-white dark:text-zinc-900">
              <Image
                src="/icons/logo.png"
                width={32}
                height={32}
                className="mr-2 h-8 w-8"
                alt="logo"
                priority
              />
              Chats
            </div>
            <div className="relative z-20 mt-auto flex items-center justify-center gap-2">
              {LOGIN_SHOWCASE_IMAGES.map((src, index) => {
                const isActive = activeSlide === index;
                return (
                  <button
                    key={`${src}-indicator`}
                    type="button"
                    aria-label={t('Go to slide {{index}}', { index: index + 1 })}
                    aria-current={isActive ? 'true' : undefined}
                    aria-pressed={isActive}
                    className={`h-2.5 rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:focus-visible:ring-zinc-900/80 ${
                      isActive
                        ? 'w-8 bg-white dark:bg-zinc-900'
                        : 'w-2.5 bg-white/50 hover:bg-white/75 dark:bg-zinc-900/45 dark:hover:bg-zinc-900/70'
                    }`}
                    onClick={() => setActiveSlide(index)}
                  />
                );
              })}
            </div>
          </div>
          <div className="lg:px-8 lg:pt-8 pb-4 h-screen">
            <div className="mx-auto flex h-5/6 h- w-full flex-col justify-center space-y-6">
              <div
                className="flex flex-col space-y-2 text-center mt-12 md:mt-0 lg:mt-0"
                key={currentTab}
              >
                <h1 className="text-2xl font-semibold tracking-tight">
                  {LoginHeaders[currentTab].title}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {LoginHeaders[currentTab].description}
                </p>
              </div>
              <>
                <div className="flex w-full justify-center">
                  <div className="relative w-full max-w-md max-h-full">
                    <div className="relative">
                      <Tabs
                        defaultValue={currentTab}
                        onValueChange={(value) => {
                          setCurrentTab(value as TabKeys);
                        }}
                        className="flex-col"
                      >
                        {renderTabsList()}
                        <TabsContent className="m-0 mt-4" value={TabKeys.PHONE}>
                          <PhoneLoginCard
                            openLoading={openLoading}
                            closeLoading={closeLoading}
                            loginLoading={loginLoading}
                          />
                        </TabsContent>
                        <TabsContent
                          className="m-0 mt-4"
                          value={TabKeys.REGISTER}
                        >
                          <PhoneRegisterCard
                            openLoading={openLoading}
                            closeLoading={closeLoading}
                            loginLoading={loginLoading}
                          />
                        </TabsContent>
                        <TabsContent
                          className="m-0 mt-4"
                          value={TabKeys.ACCOUNT}
                        >
                          <AccountLoginCard
                            openLoading={openLoading}
                            closeLoading={closeLoading}
                            loginLoading={loginLoading}
                          />
                        </TabsContent>
                      </Tabs>

                      {loginConfigs.length > 0 && (
                        <div className="relative mt-4">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background p-4 text-muted-foreground">
                              {t('Or continue with')}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-center gap-2">
                        {hasLoginType(LoginType.WeChat) && (
                          <WeChatLogin
                            configs={
                              loginConfigs.find(
                                (x) => x.type === LoginType.WeChat,
                              )?.configs
                            }
                            loading={loginLoading}
                          />
                        )}
                        {hasLoginType(LoginType.Keycloak) && (
                          <KeyCloakLogin loading={loginLoading} />
                        )}
                      </div>

                      <div className="mx-auto mt-4 w-full max-w-md rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-left">
                        <div className="space-y-1.5">
                          <p className="text-sm font-medium leading-5">
                            {t('Web chat and LLM API gateway, now in invite-only preview')}
                          </p>
                          <p className="text-xs leading-5 text-muted-foreground">
                            {t(
                              'Chats brings together a polished web chat experience and an LLM API gateway. The service is currently in invite-only preview. If you would like access, please contact the product team to get the QR code.',
                            )}
                          </p>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              type="button"
                              variant="link"
                              className="mt-2 h-auto p-0 text-xs"
                            >
                              {t('Contact product team')}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-sm">
                            <DialogHeader>
                              <DialogTitle>{t('Scan to get an invite code')}</DialogTitle>
                              <DialogDescription>
                                {t(
                                  'Scan the official account QR code below, then leave a message with AyakaChat in the account chat to request your invite code.',
                                )}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col items-center gap-3">
                              <img
                                src={PRODUCT_CONTACT_QR}
                                alt={t('AyakaChat official account QR code')}
                                className="h-64 w-64 rounded-lg border bg-white object-contain p-2"
                                loading="lazy"
                              />
                              <p className="text-center text-xs leading-5 text-muted-foreground">
                                {t(
                                  'After scanning, leave a message with AyakaChat in the official account backend to get your invite code.',
                                )}
                              </p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </div>
              </>
              <div className="flex flex-col justify-center text-center text-sm text-muted-foreground">
                <div className="flex text-sm justify-center items-center pb-[2px]">
                  {webSiteInfo?.customizedLine1}
                </div>
                <div className="flex text-sm justify-center items-center">
                  {webSiteInfo?.customizedLine2}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end h-1/6 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center text-center">
                © {new Date().getFullYear()}&nbsp;
                <Button
                  className="p-0 m-0 h-auto font-semibold text-xs sm:text-sm text-muted-foreground"
                  variant="link"
                  onClick={redirectToGithub}
                >
                  AyakaChat
                </Button>
                . All Rights Reserved.
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground text-right">
                {feVersion}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
