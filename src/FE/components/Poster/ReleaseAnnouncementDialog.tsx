import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import changelogData from '@/data/changelog.json';
import type { ChangelogData } from '@/types/changelog';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ReleasePoster = dynamic(() => import('./ReleasePoster'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-96 items-center justify-center text-sm text-muted-foreground">
      正在加载版本公告…
    </div>
  ),
});

const PosterDownloadButton = dynamic(() => import('./PosterDownloadButton'), {
  ssr: false,
});

const data = changelogData as ChangelogData;
const storageKey = `ayaka-chats:release-announcement:hidden:${data.version}`;

/** Shows the current release poster after login unless the user opted out for this version. */
const ReleaseAnnouncementDialog = () => {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    try {
      setOpen(window.localStorage.getItem(storageKey) !== 'true');
    } catch {
      // Private browsing or restrictive browser settings should not block the announcement.
      setOpen(true);
    }
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      try {
        if (dontShowAgain) {
          window.localStorage.setItem(storageKey, 'true');
        } else {
          window.localStorage.removeItem(storageKey);
        }
      } catch {
        // The dialog remains usable even when localStorage is unavailable.
      }
    }
    setOpen(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-[calc(100dvh-2rem)] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
        <DialogHeader className="border-b px-6 py-5 pr-12 text-left">
          <DialogTitle>Ayaka Chats v{data.version} 更新公告</DialogTitle>
          <DialogDescription>
            查看本次更新内容，海报可直接复制或下载分享。
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto bg-slate-950 p-3 sm:p-6">
          <div className="min-w-[1080px] overflow-hidden rounded-xl shadow-2xl">
            <ReleasePoster data={data} posterId="release-announcement-poster" />
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t bg-background px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <Checkbox
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
              filled
            />
            下次不再提示 v{data.version}
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <PosterDownloadButton
              targetId="release-announcement-poster"
              filename={`ayaka-chats-v${data.version}-release.png`}
            />
            <Button onClick={() => handleOpenChange(false)}>我知道了</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReleaseAnnouncementDialog;
