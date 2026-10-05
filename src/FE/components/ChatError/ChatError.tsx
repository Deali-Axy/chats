import { useId, useState } from 'react';

import useTranslation from '@/hooks/useTranslation';

import { AdminModelDto } from '@/types/adminApis';

import ChatModelDropdownMenu from '@/components/ChatModelDropdownMenu/ChatModelDropdownMenu';
import {
  IconArrowsDiagonalMinimize,
  IconBolt,
  IconChevronDown,
  IconChevronRight,
  IconCircleX,
  IconMoneybag,
  IconShieldLock,
  IconStopFilled,
  IconTokens,
} from '@/components/Icons';
import { Button } from '@/components/ui/button';
import CopyAction from '@/components/ChatMessage/CopyAction';
import {
  ChatErrorCategory,
  parseChatError,
  resolveChatErrorBody,
} from '@/utils/chatError';

type ActionKind = 'retry' | 'changeModel' | 'compact';

const CATEGORY_ICONS: Record<
  ChatErrorCategory,
  typeof IconBolt
> = {
  transient: IconBolt,
  rate_limit: IconCircleX,
  auth_quota: IconMoneybag,
  content_policy: IconShieldLock,
  context_too_long: IconTokens,
  cancelled: IconStopFilled,
  unknown: IconCircleX,
};

const CATEGORY_ACTIONS: Record<
  ChatErrorCategory,
  { primary: ActionKind; secondary: ActionKind | null }
> = {
  transient: { primary: 'retry', secondary: 'changeModel' },
  rate_limit: { primary: 'retry', secondary: 'changeModel' },
  auth_quota: { primary: 'changeModel', secondary: 'retry' },
  content_policy: { primary: 'changeModel', secondary: null },
  context_too_long: { primary: 'compact', secondary: 'retry' },
  cancelled: { primary: 'retry', secondary: null },
  unknown: { primary: 'retry', secondary: 'changeModel' },
};

interface ChatErrorProps {
  error?: string;
  readonly?: boolean;
  disabled?: boolean;
  isAdminView?: boolean;
  chatShareId?: string;
  models?: AdminModelDto[];
  regenerateModelName?: string;
  isSpanDeleted?: boolean;
  onRetry?: () => void;
  onChangeModel?: (model: AdminModelDto) => void;
  onCompactContext?: () => void | Promise<void>;
}

const ChatError = (props: ChatErrorProps) => {
  const {
    error,
    readonly,
    disabled,
    isAdminView,
    chatShareId,
    models = [],
    isSpanDeleted,
    onRetry,
    onChangeModel,
    onCompactContext,
  } = props;
  const { t } = useTranslation();
  const detailsId = useId();
  const parsed = parseChatError(error, { keepStacks: !!isAdminView });
  const [detailsOpen, setDetailsOpen] = useState(!!isAdminView);
  const [compacting, setCompacting] = useState(false);

  const allowRaw = !!isAdminView || !readonly;
  const isShare = !!chatShareId || (!!readonly && !isAdminView);
  const showRetry = !!onRetry && !readonly;
  const retryDisabled = !!disabled || !!isSpanDeleted;
  const showChangeModel =
    !!onChangeModel &&
    !readonly &&
    !isSpanDeleted &&
    models.length > 0;
  const showCompact =
    parsed.category === 'context_too_long' &&
    !!onCompactContext &&
    !readonly;
  const compactDisabled = !!disabled || compacting;

  const hasShareDiagnostics = !!(parsed.code || parsed.requestId);
  const hasOwnerDiagnostics = !!(
    parsed.code ||
    parsed.requestId ||
    parsed.httpStatus ||
    (allowRaw && parsed.displayRaw)
  );
  const showDetails = isShare ? hasShareDiagnostics : hasOwnerDiagnostics;
  const Icon = CATEGORY_ICONS[parsed.category];
  const actions = CATEGORY_ACTIONS[parsed.category];
  const title = t(parsed.titleKey);
  const body = resolveChatErrorBody(parsed, t);

  const handleCompact = async () => {
    if (!onCompactContext || compactDisabled) return;
    setCompacting(true);
    try {
      await onCompactContext();
    } finally {
      setCompacting(false);
    }
  };

  const renderAction = (kind: ActionKind | null) => {
    if (!kind) return null;
    if (kind === 'retry') {
      if (!showRetry) return null;
      return (
        <Button
          key="retry"
          type="button"
          size="xs"
          variant="outline"
          disabled={retryDisabled}
          onClick={onRetry}
        >
          {t('Retry')}
        </Button>
      );
    }
    if (kind === 'changeModel') {
      if (!showChangeModel || !onChangeModel) return null;
      return (
        <ChatModelDropdownMenu
          key="change-model"
          models={models}
          readonly={!!disabled}
          onChangeModel={onChangeModel}
          hideIcon={true}
          triggerClassName="h-6 rounded-md px-1.5 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          content={
            <span className="inline-flex items-center gap-1 text-xs">
              {t('Change Model')}
              <IconChevronDown size={14} />
            </span>
          }
        />
      );
    }
    if (!showCompact) return null;
    return (
      <Button
        key="compact"
        type="button"
        size="xs"
        variant="outline"
        disabled={compactDisabled}
        onClick={() => {
          void handleCompact();
        }}
      >
        <IconArrowsDiagonalMinimize size={14} />
        {t('Compact now')}
      </Button>
    );
  };

  const primary = renderAction(actions.primary);
  const secondary = renderAction(actions.secondary);
  const hasActions = !!(primary || secondary);

  return (
    <div
      role="alert"
      className="min-w-0 my-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 dark:bg-destructive/10"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-start gap-2">
        <Icon size={18} className="mt-0.5 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground">{title}</div>
          <div className="mt-0.5 text-xs text-muted-foreground whitespace-pre-wrap break-words">
            {body}
          </div>
        </div>
      </div>

      {(hasActions || showDetails) && (
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
          {primary}
          {secondary}
          {showDetails && (
            <Button
              type="button"
              size="xs"
              variant="ghost"
              className="ml-auto"
              aria-expanded={detailsOpen}
              aria-controls={detailsId}
              onClick={() => setDetailsOpen((open) => !open)}
            >
              {t('Details')}
              <IconChevronRight
                size={14}
                className={detailsOpen ? 'rotate-90' : ''}
              />
            </Button>
          )}
        </div>
      )}

      {showDetails && detailsOpen && (
        <div
          id={detailsId}
          className="mt-2 min-w-0 border-t border-border/60 pt-2 text-xs"
        >
          {parsed.code && (
            <div className="flex min-w-0 gap-2">
              <span className="shrink-0 text-muted-foreground">
                {t('Error code')}
              </span>
              <span className="min-w-0 font-mono break-all">{parsed.code}</span>
            </div>
          )}
          {parsed.requestId && (
            <div className="mt-1 flex min-w-0 items-start gap-2">
              <span className="shrink-0 text-muted-foreground">
                {t('Request ID')}
              </span>
              <span className="min-w-0 flex-1 font-mono break-all">
                {parsed.requestId}
              </span>
              <CopyAction
                text={parsed.requestId}
                tips={t('Copy request ID')}
              />
            </div>
          )}
          {!isShare && parsed.httpStatus && (
            <div className="mt-1 flex min-w-0 gap-2">
              <span className="shrink-0 text-muted-foreground">
                {t('HTTP status')}
              </span>
              <span className="font-mono">{parsed.httpStatus}</span>
            </div>
          )}
          {allowRaw && parsed.displayRaw && (
            <div className="mt-2 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{t('Raw error')}</span>
                {parsed.rawTruncated && (
                  <span className="text-muted-foreground">
                    ({t('Truncated')})
                  </span>
                )}
                <CopyAction
                  text={parsed.displayRaw}
                  tips={
                    parsed.rawTruncated ? t('Copy displayed text') : t('Copy')
                  }
                />
              </div>
              <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap break-all rounded bg-muted/60 p-2">
                {parsed.displayRaw}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatError;
