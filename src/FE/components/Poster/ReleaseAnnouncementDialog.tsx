import { useEffect, useMemo, useState } from 'react';
import { Bug, CalendarDays, Sparkles } from 'lucide-react';

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

const data = changelogData as ChangelogData;
const DISMISS_STORAGE_KEY = `release-announcement-dismissed-v${data.version}`;

/** A compact release summary shown whenever an authenticated user enters the app. */
const ReleaseAnnouncementDialog = () => {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const highlights = useMemo(
    () => [...data.features, ...data.uiImprovements].slice(0, 4),
    [],
  );

  useEffect(() => {
    setOpen(localStorage.getItem(DISMISS_STORAGE_KEY) !== 'true');
  }, []);

  const handleDontShowAgainChange = (checked: boolean) => {
    setDontShowAgain(checked);

    if (checked) {
      localStorage.setItem(DISMISS_STORAGE_KEY, 'true');
      return;
    }

    localStorage.removeItem(DISMISS_STORAGE_KEY);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl overflow-hidden border-violet-500/20 p-0 [&>button]:hidden">
        <div className="bg-gradient-to-br from-violet-500/20 via-background to-sky-500/10 px-6 pb-6 pt-7 sm:px-8 sm:pt-8">
          <DialogHeader className="text-left">
            <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-600 dark:text-violet-300">
              <Sparkles className="h-3.5 w-3.5" />
              新版本已就绪
            </div>
            <DialogTitle className="text-2xl sm:text-3xl">
              Ayaka Chats v{data.version}
            </DialogTitle>
            <DialogDescription className="mt-3 max-w-xl text-sm leading-6 sm:text-base">
              {data.tagline}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            发布于 {data.date}
          </div>
        </div>

        <div className="space-y-5 px-6 py-6 sm:px-8">
          <div className="grid gap-3 sm:grid-cols-2">
            {highlights.map((item) => (
              <div
                key={`${item.title}-${item.description}`}
                className="rounded-xl border bg-card/70 p-4"
              >
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  {item.title}
                </div>
                <p className="text-sm leading-5 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          {data.bugFixes.length > 0 && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                <Bug className="h-4 w-4" />
                本次修复
              </div>
              <ul className="space-y-1.5 text-sm leading-5 text-muted-foreground">
                {data.bugFixes.slice(0, 2).map((fix) => <li key={fix}>• {fix}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t bg-muted/30 px-6 py-4 sm:px-8">
          <label
            htmlFor="release-announcement-dont-show-again"
            className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
          >
            <Checkbox
              id="release-announcement-dont-show-again"
              checked={dontShowAgain}
              onCheckedChange={(checked) =>
                handleDontShowAgainChange(checked === true)
              }
            />
            不再提示此版本
          </label>
          <Button onClick={() => setOpen(false)}>我知道了</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReleaseAnnouncementDialog;
