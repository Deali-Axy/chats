import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquarePlus,
  Minimize2,
  RotateCcw,
} from 'lucide-react';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import useTranslation from '@/hooks/useTranslation';

import { ChatStatus } from '@/types/chat';
import { ChatContextEvent, ChatContextStatus } from '@/types/chatContext';
import { ResponseMessageTempId, UserMessageTempId } from '@/types/chatMessage';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';

import ContextHandoffDialog from './ContextHandoffDialog';

import {
  compactChatContext,
  previewChatContext,
  resetChatContext,
  updateChatContextSettings,
} from '@/apis/chatContextApi';
import HomeContext from '@/contexts/home.context';
import { cn } from '@/lib/utils';

interface Props {
  draftText: string;
  draftFileCount: number;
  events?: Partial<Record<number, ChatContextEvent>>;
  onBusyChange: (busy: boolean) => void;
}

export default function ChatContextControl({
  draftText,
  draftFileCount,
  events,
  onBusyChange,
}: Props) {
  const { t } = useTranslation();
  const {
    selectedChat,
    state: { selectedMessages, isMessagesLoading },
  } = useContext(HomeContext);
  const [status, setStatus] = useState<ChatContextStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [notice, setNotice] = useState<ChatContextEvent['stage']>('ready');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const handleHandoffBusy = useCallback(
    (value: boolean) => {
      setBusy(value);
      onBusyChange(value);
    },
    [onBusyChange],
  );
  const [selection, setSelection] = useState<{
    chatId: string;
    spanId: number;
  }>();
  const operationRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);
  const chatId = selectedChat?.id;
  const selectedSpan =
    selectedChat?.spans.find(
      (span) =>
        selection?.chatId === chatId && span.spanId === selection?.spanId,
    ) ?? selectedChat?.spans[0];
  const spanId = selectedSpan?.spanId;
  const event = spanId === undefined ? undefined : events?.[spanId];
  const chatting = selectedChat?.status === ChatStatus.Chatting;
  const lastGroup = selectedMessages[selectedMessages.length - 1];
  const activeLeaf = lastGroup?.find((message) => message.isActive)?.id;
  const leafMessageId =
    activeLeaf &&
    !activeLeaf.startsWith(ResponseMessageTempId) &&
    !activeLeaf.startsWith(UserMessageTempId)
      ? activeLeaf
      : selectedChat?.leafMessageId ?? null;
  const configKey = JSON.stringify(selectedChat?.spans);

  useEffect(() => {
    generationRef.current++;
    setStatus(null);
    setError(null);
    setNotice('ready');
    setBusy(false);
    setHandoffOpen(false);
    return () => {
      operationRef.current?.abort();
      onBusyChange(false);
    };
  }, [chatId, spanId, onBusyChange]);

  useEffect(() => {
    if (
      !chatId ||
      spanId === undefined ||
      chatting ||
      busy ||
      isMessagesLoading
    )
      return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      previewChatContext(
        chatId,
        spanId,
        leafMessageId,
        draftText,
        draftFileCount,
        controller.signal,
      )
        .then((value) => {
          if (!controller.signal.aborted) {
            setStatus(value);
            setError(null);
          }
        })
        .catch((reason) => {
          if (!controller.signal.aborted)
            setError(reason.message || t('Unable to load context usage'));
        });
    }, 600);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    chatId,
    spanId,
    leafMessageId,
    configKey,
    draftText,
    draftFileCount,
    selectedMessages,
    chatting,
    busy,
    isMessagesLoading,
    refresh,
    t,
  ]);

  useEffect(() => {
    if (!event || event.chatId !== chatId || event.spanId !== spanId) return;
    setStatus(event.status);
    setNotice(event.stage);
    if (event.stage === 'failed')
      setError(event.error || t('Context compaction failed'));
  }, [event, chatId, spanId, t]);

  const runAction = useCallback(
    async (
      action: 'compact' | 'reset' | 'settings',
      auto?: boolean,
      keep?: number,
    ) => {
      if (!chatId || spanId === undefined || busy || chatting) return;
      const generation = generationRef.current;
      const controller = new AbortController();
      operationRef.current = controller;
      setBusy(true);
      onBusyChange(true);
      setError(null);
      if (action === 'compact') setNotice('started');
      try {
        if (action === 'compact') {
          const value = await compactChatContext(
            chatId,
            spanId,
            leafMessageId,
            controller.signal,
          );
          if (generation !== generationRef.current) return;
          setStatus(value);
          setNotice('completed');
          toast.success(
            t('Context compacted. Original messages are still available.'),
          );
        } else if (action === 'reset') {
          await resetChatContext(chatId, spanId);
          if (generation !== generationRef.current) return;
          setNotice('ready');
          toast.success(
            t('Full context restored. Automatic compaction is now off.'),
          );
        } else {
          await updateChatContextSettings(chatId, spanId, auto!, keep!);
          if (generation !== generationRef.current) return;
        }
        setRefresh((value) => value + 1);
      } catch (reason) {
        if (generation !== generationRef.current) return;
        if (controller.signal.aborted) {
          setNotice('ready');
          toast(t('Context compaction cancelled'));
        } else {
          const message =
            reason instanceof Error
              ? reason.message
              : t('Context operation failed');
          setError(message);
          if (action === 'compact') setNotice('failed');
          toast.error(message);
        }
      } finally {
        if (generation === generationRef.current) {
          setBusy(false);
          onBusyChange(false);
          operationRef.current = null;
        }
      }
    },
    [chatId, spanId, leafMessageId, busy, chatting, onBusyChange, t],
  );

  if (
    !selectedChat ||
    spanId === undefined ||
    (status?.supported === false && selectedChat.spans.length === 1)
  )
    return null;
  const compacting = notice === 'started' && (busy || chatting);
  const percent = status
    ? Math.min(
        100,
        Math.round((status.estimatedTokens / status.contextWindow) * 100),
      )
    : 0;
  const nearLimit =
    status && status.estimatedTokens >= status.autoCompactThreshold;
  const overBudget = status && status.estimatedTokens > status.inputBudget;
  const format = (value: number) => value.toLocaleString();
  const noticeText = compacting
    ? t('Compacting earlier conversation…')
    : error
    ? error
    : status?.compactedTurns
    ? t('Earlier conversation summarized · {{count}} messages', {
        count: status.compactedTurns,
      })
    : nearLimit
    ? t('Context is near its limit')
    : null;

  return (
    <>
      <div className="border-t border-border/40 px-3 py-1.5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <div
            role="status"
            aria-live="polite"
            className={cn(
              'flex min-w-0 items-center gap-1.5 text-muted-foreground',
              error && 'text-destructive',
              nearLimit && !error && 'text-amber-600 dark:text-amber-400',
            )}
          >
            {compacting ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
            ) : error || nearLimit ? (
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            ) : status?.compactedTurns ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            ) : null}
            <span className="truncate" title={noticeText ?? undefined}>
              {noticeText ?? t('Context usage')}
            </span>
          </div>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="xs"
                className="shrink-0 gap-1.5 text-xs"
                aria-label={t('View and manage context')}
              >
                <svg
                  viewBox="0 0 20 20"
                  className={cn(
                    'h-4 w-4 -rotate-90 text-primary',
                    nearLimit && 'text-amber-500',
                    overBudget && 'text-destructive',
                  )}
                  aria-hidden="true"
                >
                  <circle
                    cx="10"
                    cy="10"
                    r="7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    opacity="0.15"
                  />
                  <circle
                    cx="10"
                    cy="10"
                    r="7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeDasharray={`${percent * 0.44} 44`}
                    strokeLinecap="round"
                  />
                </svg>
                {status
                  ? t('{{percent}}% context left', { percent: 100 - percent })
                  : t('Context')}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              className="w-[min(400px,calc(100vw-24px))] max-h-[70vh] overflow-y-auto p-4 space-y-4"
            >
              {selectedChat.spans.length > 1 && (
                <label className="flex items-center justify-between gap-3 text-sm">
                  <span>{t('Context for model')}</span>
                  <select
                    aria-label={t('Context for model')}
                    className="h-8 max-w-[65%] rounded-md border bg-background px-2"
                    value={spanId}
                    disabled={busy}
                    onChange={(e) =>
                      setSelection({
                        chatId: selectedChat.id,
                        spanId: Number(e.target.value),
                      })
                    }
                  >
                    {selectedChat.spans.map((span) => (
                      <option key={span.spanId} value={span.spanId}>
                        {span.modelName} · {span.spanId + 1}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {status?.supported === false && (
                <p className="text-xs text-muted-foreground">
                  {t(
                    'Context compaction is unavailable for image generation models.',
                  )}
                </p>
              )}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>{t('Context window')}</span>
                  <span>
                    {percent}% {t('used')}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={t('Context usage')}
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-2 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className={cn(
                      'h-full rounded-full bg-primary transition-[width]',
                      nearLimit && 'bg-amber-500',
                      overBudget && 'bg-destructive',
                    )}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                {status && (
                  <p className="text-xs text-muted-foreground">
                    {t('Estimated {{used}} / {{total}} tokens', {
                      used: format(status.estimatedTokens),
                      total: format(status.contextWindow),
                    })}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {t(
                    'Estimates include this draft. Actual usage varies by model and attachments.',
                  )}
                </p>
              </div>
              {status && (
                <>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    {[
                      [t('System instructions'), status.systemTokens],
                      [t('Tool definitions'), status.toolsTokens],
                      [t('Recent conversation'), status.historyTokens],
                      [t('Conversation summary'), status.summaryTokens],
                      [t('Current draft'), status.draftTokens],
                      [t('Reserved for output'), status.reservedOutputTokens],
                    ].map(([label, value]) => (
                      <div key={label} className="contents">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="text-right tabular-nums">
                          {format(value as number)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="space-y-3 border-t pt-3">
                    <label className="flex items-center justify-between gap-3 text-sm">
                      <span>{t('Automatic context compaction')}</span>
                      <Switch
                        aria-label={t('Automatic context compaction')}
                        checked={status.autoCompactEnabled}
                        disabled={busy || chatting || !status.supported}
                        onCheckedChange={(value) =>
                          void runAction(
                            'settings',
                            value,
                            status.keepRecentTurns,
                          )
                        }
                      />
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {t(
                        'Compacts at 80% of the input budget, with space reserved for output. Summarization uses the current model and may incur usage charges.',
                      )}
                    </p>
                    <label className="flex items-center justify-between gap-3 text-sm">
                      <span>{t('Recent messages to keep')}</span>
                      <select
                        className="h-8 rounded-md border bg-background px-2"
                        aria-label={t('Recent messages to keep')}
                        value={status.keepRecentTurns}
                        disabled={busy || chatting}
                        onChange={(e) =>
                          void runAction(
                            'settings',
                            status.autoCompactEnabled,
                            Number(e.target.value),
                          )
                        }
                      >
                        {[2, 4, 6, 8, 12, 20].map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {t(
                        'Each user or assistant message counts once. Tool calls and results stay together. Keeping more messages restores full history before applying the new policy.',
                      )}
                    </p>
                  </div>
                  {status.summary && (
                    <details className="rounded-md border p-2.5 text-xs">
                      <summary className="cursor-pointer font-medium">
                        {t('View conversation summary')} ·{' '}
                        {status.compactedTurns} {t('messages')}
                      </summary>
                      {status.compactedAt && (
                        <p className="mt-2 text-muted-foreground">
                          {new Date(status.compactedAt).toLocaleString()}
                        </p>
                      )}
                      {status.beforeTokens != null &&
                        status.afterTokens != null && (
                          <p className="mt-1 text-muted-foreground">
                            {format(status.beforeTokens)} →{' '}
                            {format(status.afterTokens)} tokens
                          </p>
                        )}
                      <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap break-words font-sans leading-relaxed">
                        {status.summary}
                      </pre>
                    </details>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t(
                      'Compaction summarizes older messages and attachment references. Some details may be lost. Original messages remain available in the conversation.',
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={busy || chatting || !status.canCompact}
                      onClick={() => void runAction('compact')}
                    >
                      <Minimize2 />
                      {t('Compact now')}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy || chatting || !status.summary}
                      onClick={() => void runAction('reset')}
                    >
                      <RotateCcw />
                      {t('Restore full context')}
                    </Button>
                    {busy && notice === 'started' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => operationRef.current?.abort()}
                      >
                        {t('Cancel')}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        busy ||
                        chatting ||
                        !status.supported ||
                        !selectedMessages.length
                      }
                      onClick={() => {
                        setPopoverOpen(false);
                        setHandoffOpen(true);
                      }}
                    >
                      <MessageSquarePlus />
                      {t('Create conversation from summary')}
                    </Button>
                  </div>
                  {!status.canCompact && !status.summary && (
                    <p className="text-xs text-muted-foreground">
                      {t(
                        'More completed conversation is needed before older messages can be compacted.',
                      )}
                    </p>
                  )}
                </>
              )}
              {error && (
                <div
                  role="alert"
                  className="space-y-2 text-xs text-destructive"
                >
                  <p>{error}</p>
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={busy || chatting}
                    onClick={() => setRefresh((value) => value + 1)}
                  >
                    {t('Retry')}
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <ContextHandoffDialog
        key={`${chatId}-${spanId}-${leafMessageId}`}
        open={handoffOpen}
        onOpenChange={setHandoffOpen}
        onBusyChange={handleHandoffBusy}
        chatId={selectedChat.id}
        chatTitle={selectedChat.title}
        spanId={spanId}
        leafMessageId={leafMessageId}
      />
    </>
  );
}
