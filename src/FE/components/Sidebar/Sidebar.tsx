import {
  ReactNode,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useIsMobile } from '@/hooks/useMobile';
import useTranslation from '@/hooks/useTranslation';

import {
  IconBolt,
  IconLayoutSidebar,
  IconLayoutSidebarRight,
  IconLoader,
  IconSearch,
  IconSquarePlus,
} from '@/components/Icons/index';
import Search from '@/components/Search/Search';
import Tips from '@/components/Tips/Tips';
import { Button } from '@/components/ui/button';
import {
  SidebarContent,
  SidebarContext,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';

import { cn } from '@/lib/utils';

interface Props<T> {
  isLoading?: boolean;
  showOpenButton?: boolean;
  isOpen: boolean;
  addItemButtonTitle: string;
  /** 临时聊天按钮标题 */
  addTempItemButtonTitle?: string;
  side: 'left' | 'right';
  items: T[];
  itemComponent?: ReactNode;
  folderComponent?: ReactNode;
  footerComponent?: ReactNode;
  actionComponent?: ReactNode;
  actionConfirmComponent?: ReactNode;
  searchTerm: string;
  messageIsStreaming?: boolean;
  handleSearchTerm: (searchTerm: string) => void;
  toggleOpen: () => void;
  handleCreateItem: () => void | Promise<void>;
  /** 创建临时聊天的处理函数 */
  handleCreateTempItem?: () => void | Promise<void>;
  hasModel: () => boolean;
  resizable?: boolean;
  desktopWidth?: number;
  desktopMinWidth?: number;
  desktopMaxWidth?: number;
  onDesktopWidthChange?: (
    width: number,
    options?: { persist?: boolean },
  ) => void;
}

const Sidebar = <T,>({
  isLoading = false,
  showOpenButton = true,
  isOpen,
  addItemButtonTitle,
  addTempItemButtonTitle,
  side,
  items,
  itemComponent,
  folderComponent,
  footerComponent,
  actionComponent,
  actionConfirmComponent,
  searchTerm,
  messageIsStreaming,
  handleSearchTerm,
  toggleOpen,
  handleCreateItem,
  handleCreateTempItem,
  hasModel,
  resizable = false,
  desktopWidth,
  desktopMinWidth = 280,
  desktopMaxWidth = 520,
  onDesktopWidthChange,
}: Props<T>) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingTemp, setIsCreatingTemp] = useState(false);
  const latestWidthRef = useRef<number>(desktopWidth ?? desktopMinWidth);
  const dragCleanupRef = useRef<(() => void) | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      await handleCreateItem();
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateTemp = async () => {
    if (!handleCreateTempItem) return;
    setIsCreatingTemp(true);
    try {
      await handleCreateTempItem();
    } finally {
      setIsCreatingTemp(false);
    }
  };

  const NoDataRender = () =>
    isLoading === false &&
    items.length === 0 && (
      <div className="select-none text-center flex flex-col justify-center h-56 opacity-50">
        <IconSearch className="mx-auto mb-3" />
        <span className="text-[14px] leading-normal">{t('No data')}</span>
      </div>
    );

  const restoreDragStyles = useCallback(() => {
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    latestWidthRef.current = desktopWidth ?? desktopMinWidth;
  }, [desktopMinWidth, desktopWidth]);

  useEffect(() => {
    return () => {
      dragCleanupRef.current?.();
      restoreDragStyles();
    };
  }, [restoreDragStyles]);

  const clampDesktopWidth = useCallback(
    (width: number) => {
      const maxWidth = Math.max(desktopMinWidth, desktopMaxWidth);
      return Math.max(desktopMinWidth, Math.min(width, maxWidth));
    },
    [desktopMaxWidth, desktopMinWidth],
  );

  const handleResizeStart = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!resizable || isMobile || !isOpen || !onDesktopWidthChange) return;
      if (e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startWidth = latestWidthRef.current;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      const onMove = (event: PointerEvent) => {
        const delta =
          side === 'left' ? event.clientX - startX : startX - event.clientX;
        const nextWidth = clampDesktopWidth(startWidth + delta);
        latestWidthRef.current = nextWidth;
        onDesktopWidthChange(nextWidth);
      };

      const onUp = () => {
        dragCleanupRef.current?.();
        dragCleanupRef.current = null;
        restoreDragStyles();
        onDesktopWidthChange(latestWidthRef.current, { persist: true });
      };

      dragCleanupRef.current?.();
      dragCleanupRef.current = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [
      clampDesktopWidth,
      isMobile,
      isOpen,
      onDesktopWidthChange,
      resizable,
      restoreDragStyles,
      side,
    ],
  );

  const desktopSidebarWidth = clampDesktopWidth(
    desktopWidth ?? desktopMinWidth,
  );
  const showResizeRail = resizable && isOpen && !isMobile;

  const sidebarContextValue = useMemo(
    () => ({
      state: (isOpen ? 'expanded' : 'collapsed') as 'expanded' | 'collapsed',
      open: isOpen,
      setOpen: () => toggleOpen(),
      openMobile: false,
      setOpenMobile: () => {},
      isMobile,
      toggleSidebar: toggleOpen,
    }),
    [isOpen, isMobile, toggleOpen],
  );

  // 折叠状态下的图标按钮组
  const collapsedIconButtons = (
    <div className="flex h-full flex-col items-center gap-2 py-3">
      <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-background shadow-sm">
        <span className="text-sm font-semibold">A</span>
      </div>
      <Tips
        trigger={
          <Button
            variant="ghost"
            className="h-9 w-9 rounded-lg p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={toggleOpen}
          >
            {side === 'right' ? (
              <IconLayoutSidebarRight size={18} />
            ) : (
              <IconLayoutSidebar size={18} />
            )}
          </Button>
        }
      />
      {hasModel() && (
        <>
          <Tips
            trigger={
              <Button
                onClick={() => handleCreate()}
                disabled={messageIsStreaming || isCreating}
                variant="ghost"
                className="h-9 w-9 rounded-lg p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                {isCreating ? (
                  <IconLoader size={18} />
                ) : (
                  <IconSquarePlus size={18} />
                )}
              </Button>
            }
            content={addItemButtonTitle}
          />
          {handleCreateTempItem && (
            <Tips
              trigger={
                <Button
                  onClick={() => handleCreateTemp()}
                  disabled={messageIsStreaming || isCreatingTemp}
                  variant="ghost"
                  className="h-9 w-9 rounded-lg p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  {isCreatingTemp ? (
                    <IconLoader size={18} />
                  ) : (
                    <IconBolt size={18} />
                  )}
                </Button>
              }
              content={addTempItemButtonTitle || t('Temporary Chat')}
            />
          )}
        </>
      )}
    </div>
  );

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      {/* 折叠状态：显示图标按钮组 */}
      {!isOpen && showOpenButton && (
        <div
          className={cn(
            'flex flex-col items-center border-r border-sidebar-border/70 bg-sidebar text-sidebar-foreground shadow-[1px_0_0_rgba(0,0,0,0.02)] z-20',
            'transition-all duration-200 ease-in-out',
          )}
          style={{ width: '64px' }}
        >
          {collapsedIconButtons}
        </div>
      )}

      {/* 展开状态：完整侧边栏 */}
      {isOpen && (
        <div
          className={cn(
            'fixed top-0 z-40 flex h-full w-[min(18rem,calc(100vw-3.5rem))] flex-none flex-col border-r border-sidebar-border/70 bg-sidebar text-sidebar-foreground shadow-xl sm:relative sm:top-0 sm:w-auto sm:shadow-[1px_0_0_rgba(0,0,0,0.02)]',
            side === 'right' ? 'right-0 border-r-0 border-l' : 'left-0',
            'transition-all duration-200 ease-in-out',
          )}
          style={!isMobile ? { width: `${desktopSidebarWidth}px` } : undefined}
        >
          {/* Header */}
          <SidebarHeader className="px-3 pb-3 pt-3">
            <div
              className={cn(
                'mb-3 flex items-center justify-between',
                side === 'right' && 'flex-row-reverse',
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background shadow-sm">
                  <span className="text-xs font-semibold">A</span>
                </div>
                <span className="truncate text-sm font-semibold tracking-tight">
                  Ayaka Chats
                </span>
                <Tips
                  trigger={
                    <Button
                      variant="ghost"
                      className="ml-0.5 h-8 w-8 rounded-lg p-0 text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      onClick={toggleOpen}
                    >
                      {side === 'right' ? (
                        <IconLayoutSidebarRight size={18} />
                      ) : (
                        <IconLayoutSidebar size={18} />
                      )}
                    </Button>
                  }
                />
              </div>
              <div className="flex items-center gap-0.5">
                {hasModel() && handleCreateTempItem && (
                  <Tips
                    trigger={
                      <Button
                        onClick={() => handleCreateTemp()}
                        disabled={messageIsStreaming || isCreatingTemp}
                        variant="ghost"
                        className="h-8 w-8 rounded-lg p-0 text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      >
                        {isCreatingTemp ? (
                          <IconLoader size={18} className="animate-spin" />
                        ) : (
                          <IconBolt size={18} />
                        )}
                      </Button>
                    }
                    content={addTempItemButtonTitle || t('Temporary Chat')}
                  />
                )}
                {hasModel() && (
                  <Tips
                    trigger={
                      <Button
                        onClick={() => handleCreate()}
                        disabled={messageIsStreaming || isCreating}
                        variant="ghost"
                        className="h-8 w-8 p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md"
                      >
                        {isCreating ? (
                          <IconLoader size={18} className="animate-spin" />
                        ) : (
                          <IconSquarePlus size={18} />
                        )}
                      </Button>
                    }
                    content={addItemButtonTitle}
                  />
                )}
              </div>
            </div>
            {hasModel() && (
              <Button
                onClick={() => handleCreate()}
                disabled={messageIsStreaming || isCreating}
                variant="outline"
                className="mb-2 h-10 w-full justify-start gap-2 rounded-xl border-sidebar-border bg-sidebar px-3 font-medium shadow-sm hover:bg-sidebar-accent"
              >
                {isCreating ? (
                  <IconLoader size={17} className="animate-spin" />
                ) : (
                  <IconSquarePlus size={17} />
                )}
                <span>{addItemButtonTitle}</span>
              </Button>
            )}
            <div className="flex items-center gap-1.5">
              <Search
                containerClassName="flex-1 min-w-0"
                placeholder={t('Search...') || ''}
                searchTerm={searchTerm}
                onSearch={handleSearchTerm}
              />
              {!searchTerm && actionComponent && (
                <div className="flex-shrink-0">{actionComponent}</div>
              )}
            </div>
            {actionConfirmComponent}
          </SidebarHeader>

          <SidebarSeparator className="mx-3 opacity-60" />

          {/* Content */}
          <SidebarContent className="px-2 py-3">
            {isLoading && (
              <SidebarGroup className="px-1">
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-8 w-full rounded-md" />
                  <Skeleton className="h-8 w-full rounded-md" />
                  <Skeleton className="h-8 w-full rounded-md" />
                  <Skeleton className="h-8 w-[80%] rounded-md" />
                  <Skeleton className="h-8 w-full rounded-md" />
                </div>
              </SidebarGroup>
            )}

            {!isLoading && (
              <>
                {folderComponent}
                {items?.length > 0 && <div>{itemComponent}</div>}
                {NoDataRender()}
              </>
            )}
          </SidebarContent>

          {/* Footer */}
          {footerComponent && (
            <>
              <SidebarSeparator className="mx-3 opacity-60" />
              <SidebarFooter className="px-2 py-3">
                {footerComponent}
              </SidebarFooter>
            </>
          )}

          {/* Resize Rail */}
          {showResizeRail && (
            <div
              aria-hidden="true"
              className={cn(
                'absolute inset-y-0 z-10 hidden w-3 sm:block',
                side === 'right'
                  ? 'left-0 -translate-x-1/2 cursor-col-resize'
                  : 'right-0 translate-x-1/2 cursor-col-resize',
              )}
              onPointerDown={handleResizeStart}
            >
              <div className="mx-auto h-full w-[2px] bg-transparent transition-colors hover:bg-sidebar-border" />
            </div>
          )}
        </div>
      )}
    </SidebarContext.Provider>
  );
};

export default Sidebar;
