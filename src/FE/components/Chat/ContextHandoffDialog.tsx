import { Loader2, Sparkles } from 'lucide-react';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import useTranslation from '@/hooks/useTranslation';

import { ContextHandoffPreview } from '@/types/chatContext';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  createContextHandoff,
  previewContextHandoff,
} from '@/apis/chatContextApi';
import HomeContext from '@/contexts/home.context';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBusyChange: (busy: boolean) => void;
  chatId: string;
  chatTitle: string;
  spanId: number;
  leafMessageId: string | null;
}

export default function ContextHandoffDialog({
  open,
  onOpenChange,
  onBusyChange,
  chatId,
  chatTitle,
  spanId,
  leafMessageId,
}: Props) {
  const { t, language } = useTranslation();
  const { handleOpenCreatedChat } = useContext(HomeContext);
  const [preview, setPreview] = useState<ContextHandoffPreview | null>(null);
  const [summary, setSummary] = useState('');
  const [title, setTitle] = useState('');
  const [phase, setPhase] = useState<
    'loading' | 'generating' | 'creating' | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);

  const loadPreview = useCallback(
    async (generate: boolean) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const generation = ++generationRef.current;
      setPhase(generate ? 'generating' : 'loading');
      setError(null);
      onBusyChange(true);
      try {
        const value = await previewContextHandoff(
          chatId,
          spanId,
          leafMessageId,
          generate,
          controller.signal,
          (text, replace) => {
            if (generation !== generationRef.current) return;
            setSummary((current) => (replace ? text : current + text));
          },
        );
        if (controller.signal.aborted || generation !== generationRef.current)
          return;
        setPreview(value);
        setSummary(value.summary ?? '');
      } catch (reason) {
        if (
          controller.signal.aborted ||
          generation !== generationRef.current ||
          (reason instanceof Error && reason.name === 'AbortError')
        )
          return;
        setError(
          t(
            reason instanceof Error
              ? reason.message
              : 'Context operation failed',
          ),
        );
      } finally {
        if (generation === generationRef.current) {
          setPhase(null);
          onBusyChange(false);
        }
      }
    },
    [chatId, spanId, leafMessageId, onBusyChange, t],
  );

  useEffect(() => {
    if (open) {
      setPreview(null);
      setSummary('');
      setTitle(t('Continue · {{title}}', { title: chatTitle }).slice(0, 50));
      void loadPreview(false);
    }
    return () => {
      generationRef.current++;
      controllerRef.current?.abort();
      onBusyChange(false);
    };
  }, [open, chatTitle, loadPreview, onBusyChange, t]);

  const create = async () => {
    if (!preview || phase || !summary.trim() || !title.trim()) return;
    setPhase('creating');
    setError(null);
    onBusyChange(true);
    try {
      const chat = await createContextHandoff(
        chatId,
        spanId,
        leafMessageId,
        preview.sourceHash,
        summary.trim(),
        title.trim(),
        language,
      );
      onOpenChange(false);
      handleOpenCreatedChat(chat);
      toast.success(t('New conversation created with the context summary'));
    } catch (reason) {
      setError(
        t(
          reason instanceof Error ? reason.message : 'Context operation failed',
        ),
      );
    } finally {
      setPhase(null);
      onBusyChange(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (phase !== 'creating') onOpenChange(value);
      }}
    >
      <DialogContent className="max-h-[85dvh] w-[calc(100vw-24px)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('Create conversation from summary')}</DialogTitle>
          <DialogDescription>
            {t(
              'Review or edit the context to carry forward. It becomes the first visible message in the new conversation; the model responds when you send your next request. Unsent drafts stay in the source conversation.',
            )}
          </DialogDescription>
        </DialogHeader>
        <label className="space-y-1.5 text-sm">
          <span>{t('New conversation title')}</span>
          <input
            className="w-full rounded-md border bg-background px-3 py-2"
            aria-label={t('New conversation title')}
            maxLength={50}
            value={title}
            disabled={!!phase}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        {phase === 'loading' && (
          <p role="status" className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('Loading context summary…')}
          </p>
        )}
        {preview?.summary && !preview.includesRecentMessages && (
          <p className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
            {t(
              'The existing summary only covers earlier messages. Generate a handoff summary to include recent progress, or review and complete the text yourself.',
            )}
          </p>
        )}
        <label className="space-y-1.5 text-sm">
          <span>{t('Context to carry forward')}</span>
          <textarea
            className="min-h-56 w-full resize-y rounded-md border bg-background px-3 py-2 leading-relaxed"
            aria-label={t('Context to carry forward')}
            maxLength={100000}
            value={summary}
            disabled={!!phase}
            placeholder={t(
              'Generate a handoff summary, or enter the context you want to carry forward.',
            )}
            onChange={(e) => setSummary(e.target.value)}
          />
        </label>
        <p className="text-xs text-muted-foreground">
          {t(
            'The new conversation inherits this model, prompt, tool configuration and context settings. Files and running tool sessions remain in the source conversation. Generating a fresh summary uses the current model and incurs usage charges.',
          )}
        </p>
        {error && (
          <p
            role="alert"
            className="max-h-24 overflow-y-auto whitespace-pre-wrap break-words text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <DialogFooter className="gap-2 sm:flex-wrap">
          <Button
            variant="outline"
            disabled={!!phase}
            onClick={() => void loadPreview(true)}
          >
            {phase === 'generating' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles />
            )}
            {phase === 'generating'
              ? t('Generating handoff summary…')
              : t('Generate handoff summary')}
          </Button>
          <Button
            variant="ghost"
            disabled={phase === 'creating'}
            onClick={() => onOpenChange(false)}
          >
            {t('Cancel')}
          </Button>
          <Button
            disabled={!!phase || !preview || !summary.trim() || !title.trim()}
            onClick={() => void create()}
          >
            {phase === 'creating' && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {t('Create and continue')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
