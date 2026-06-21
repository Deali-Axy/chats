import {
  PointerEvent as ReactPointerEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useIsMobile } from '@/hooks/useMobile';
import useTranslation from '@/hooks/useTranslation';

import {
  IconLayoutSidebar,
  IconLayoutSidebarRight,
  IconLoader,
  IconSearch,
  IconSquarePlus,
  IconBolt,
} from '@/components/Icons/index';
import Search from '@/components/Search/Search';
import Tips from '@/components/Tips/Tips';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
        const delta = side === 'left'
          ? event.clientX - startX
          : startX - event.clientX;
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

  const desktopSidebarWidth = clampDesktopWidth(desktopWidth ?? desktopMinWidth);
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
    <div className="flex flex-col items-center gap-1 py-2">
      <Tips
        trigger={
          <Button
            variant="ghost"
            className="h-9 w-9 p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md"
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
                className="h-9 w-9 p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md"
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
          {handleCreateTempItem && (
            <Tips
              trigger={
                <Button
                  onClick={() => handleCreateTemp()}
                  disabled={messageIsStreaming || isCreatingTemp}
                  variant="ghost"
                  className="h-9 w-9 p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md"
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
            'flex flex-col items-center bg-sidebar text-sidebar-foreground border-r shadow-sm z-20',
            'transition-all duration-200 ease-in-out',
          )}
          style={{ width: '48px' }}
        >
          {collapsedIconButtons}
        </div>
      )}

      {/* 展开状态：完整侧边栏 */}
      {isOpen && (
        <div
          className={cn(
            'fixed top-0 z-40 flex h-full w-full flex-none flex-col bg-sidebar text-sidebar-foreground border-r shadow-md sm:relative sm:top-0 sm:w-auto',
            side === 'right' ? 'right-0 border-r-0 border-l' : 'left-0',
            'transition-all duration-200 ease-in-out',
          )}
          style={!isMobile ? { width: `${desktopSidebarWidth}px` } : undefined}
        >
          {/* Header */}
          <SidebarHeader className="px-3 py-2">
            <div
              className={cn(
                'flex items-center justify-between',
                side === 'right' && 'flex-row-reverse',
              )}
            >
              <div className="flex items-center gap-1">
                <Tips
                  trigger={
                    <Button
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md"
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
                        className="h-8 w-8 p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md"
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
            <div className="flex items-center gap-1.5">
              <Search
                containerClassName="flex-1 min-w-0"
                placeholder={t('Search...') || ''}
                searchTerm={searchTerm}
                onSearch={handleSearchTerm}
              />
              {!searchTerm && actionComponent && (
                <div className="flex-shrink-0">
                  {actionComponent}
                </div>
              )}
            </div>
            {actionConfirmComponent}
          </SidebarHeader>

          <SidebarSeparator className="mx-3" />

          {/* Content */}
          <SidebarContent className="px-3 py-2">
            {isLoading && (
              <SidebarGroup>
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
              <SidebarSeparator className="mx-3" />
              <SidebarFooter className="px-3 py-2">{footerComponent}</SidebarFooter>
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
