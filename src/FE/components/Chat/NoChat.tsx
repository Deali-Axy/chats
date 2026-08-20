import { useContext } from 'react';

import useTranslation from '@/hooks/useTranslation';

import { IconBolt, IconMessages } from '@/components/Icons';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import HomeContext from '@/contexts/home.context';

/**
 * 未选择聊天时显示的欢迎引导界面
 * 提供新建聊天和临时聊天的快捷入口
 */
const NoChat = () => {
  const { t } = useTranslation();

  const { handleNewChat, handleNewTempChat } = useContext(HomeContext);

  return (
    <div className="w-full flex items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* 欢迎标题 */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {t('Welcome to Ayaka Chats')}
          </h1>
          <p className="text-muted-foreground">
            {t('Start a conversation with AI assistant')}
          </p>
        </div>

        {/* 快捷操作卡片 */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
            onClick={() => handleNewChat()}
          >
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <IconMessages size={24} className="text-primary" />
                </div>
                <CardTitle className="text-lg">{t('New Chat')}</CardTitle>
              </div>
              <CardDescription>
                {t('Start a new conversation that will be saved in history')}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:border-amber-500/50 hover:shadow-md transition-all"
            onClick={handleNewTempChat}
          >
            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <IconBolt size={24} className="text-amber-500" />
                </div>
                <CardTitle className="text-lg">{t('Temporary Chat')}</CardTitle>
              </div>
              <CardDescription>
                {t('Quick conversation without saving history')}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* 提示信息 */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {t('Or select an existing chat from the sidebar')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoChat;
