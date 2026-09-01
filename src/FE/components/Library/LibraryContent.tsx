import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import Link from 'next/link';
import { useRouter } from 'next/router';

import { uploadFile } from '@/utils/uploadFile';

import { getFileUrl } from '@/types/chat';
import {
  LibraryFolder,
  LibraryItem,
  LibraryItemKind,
} from '@/types/clientApis';

import {
  IconArchive,
  IconDownload,
  IconFile,
  IconFolder,
  IconFolderPlus,
  IconNotes,
  IconPhoto,
  IconPlus,
  IconSearch,
} from '@/components/Icons';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import {
  getLibraryFolders,
  getLibraryItems,
  patchLibraryItem,
  postLibraryFolder,
  postLibraryNote,
} from '@/apis/clientApis';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 48;

const kindLabels: { value: LibraryItemKind | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'image', label: '图片' },
  { value: 'file', label: '文件' },
  { value: 'note', label: '笔记' },
];

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(
    new Date(date),
  );

const LibraryContent = () => {
  const router = useRouter();
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<
    number | undefined
  >();
  const [kind, setKind] = useState<LibraryItemKind | 'all'>('all');
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFolders = useCallback(async () => {
    const result = await getLibraryFolders();
    setFolders(result);
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getLibraryItems({
        page: 1,
        pageSize: PAGE_SIZE,
        ...(selectedFolderId ? { folderId: selectedFolderId } : {}),
        ...(kind !== 'all' ? { kind } : {}),
        ...(submittedQuery ? { query: submittedQuery } : {}),
      });
      setItems(result.rows);
    } catch {
      setError('资料库暂时无法加载，请稍后重试。');
    } finally {
      setLoading(false);
    }
  }, [kind, selectedFolderId, submittedQuery]);

  useEffect(() => {
    void loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const refresh = async () => {
    await Promise.all([loadFolders(), loadItems()]);
  };

  const handleCreateFolder = async (event: FormEvent) => {
    event.preventDefault();
    if (!folderName.trim()) return;
    try {
      const folder = await postLibraryFolder({
        name: folderName.trim(),
        parentId: selectedFolderId ?? null,
      });
      setFolders((previous) =>
        [...previous, folder].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setFolderName('');
      setIsFolderDialogOpen(false);
    } catch {
      setError('无法创建文件夹。名称可能已存在。');
    }
  };

  const handleCreateNote = async (event: FormEvent) => {
    event.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;
    try {
      await postLibraryNote({
        title: noteTitle.trim(),
        content: noteContent,
        folderId: selectedFolderId ?? null,
      });
      setNoteTitle('');
      setNoteContent('');
      setIsNoteDialogOpen(false);
      await loadItems();
    } catch {
      setError('无法保存笔记。');
    }
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    void uploadFile(
      file,
      undefined,
      () => void loadItems(),
      (reason) => setError(reason || '文件上传失败。'),
    );
  };

  const handleArchive = async (item: LibraryItem) => {
    try {
      await patchLibraryItem(item.id, {
        folderId: item.folderId,
        isArchived: true,
      });
      setItems((previous) =>
        previous.filter((candidate) => candidate.id !== item.id),
      );
    } catch {
      setError('无法归档此资料。');
    }
  };

  const handleMove = async (item: LibraryItem, folderId: number | null) => {
    try {
      const updated = await patchLibraryItem(item.id, { folderId });
      if (selectedFolderId === undefined || folderId === selectedFolderId) {
        setItems((previous) =>
          previous.map((candidate) =>
            candidate.id === updated.id ? updated : candidate,
          ),
        );
      } else {
        setItems((previous) =>
          previous.filter((candidate) => candidate.id !== item.id),
        );
      }
    } catch {
      setError('无法移动此资料。');
    }
  };

  const handleUseInChat = (item: LibraryItem) => {
    if (!item.file || item.kind !== 'image') return;
    window.sessionStorage.setItem(
      'ayaka.pendingLibraryFile',
      JSON.stringify(item.file),
    );
    void router.push('/home');
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border/70 bg-sidebar p-3 md:flex">
        <Link
          href="/home"
          className="mb-6 px-3 pt-2 text-xl font-semibold tracking-tight"
        >
          Ayaka Chats
        </Link>
        <Button
          asChild
          variant="ghost"
          className="mb-1 h-10 justify-start gap-3 rounded-lg px-3"
        >
          <Link href="/home">
            <IconPlus size={18} />
            新聊天
          </Link>
        </Button>
        <div className="mb-5 flex h-10 items-center gap-3 rounded-lg bg-sidebar-accent px-3 text-sm font-medium">
          <IconFolder size={18} />
          资料库
        </div>
        <div className="mb-2 flex items-center justify-between px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          文件夹
          <button
            aria-label="新建文件夹"
            className="rounded p-1 hover:bg-sidebar-accent"
            onClick={() => setIsFolderDialogOpen(true)}
          >
            <IconFolderPlus size={16} />
          </button>
        </div>
        <button
          className={cn(
            'mb-1 flex h-9 items-center rounded-lg px-3 text-left text-sm hover:bg-sidebar-accent',
            selectedFolderId === undefined && 'bg-sidebar-accent font-medium',
          )}
          onClick={() => setSelectedFolderId(undefined)}
        >
          全部资料
        </button>
        <div className="space-y-1 overflow-y-auto">
          {folders.map((folder) => (
            <button
              key={folder.id}
              className={cn(
                'flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-sm hover:bg-sidebar-accent',
                selectedFolderId === folder.id &&
                  'bg-sidebar-accent font-medium',
              )}
              onClick={() => setSelectedFolderId(folder.id)}
            >
              <IconFolder size={16} className="shrink-0" />
              <span className="truncate">{folder.name}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto px-5 py-8 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">资料库</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                保存文件、生成图片与重要笔记，随时在聊天中复用。
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setIsNoteDialogOpen(true)}
              >
                <IconNotes size={17} />
                新建笔记
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsFolderDialogOpen(true)}
              >
                <IconFolderPlus size={17} />
                新建文件夹
              </Button>
              <Button onClick={() => fileInputRef.current?.click()}>
                <IconPlus size={17} />
                上传
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleUpload}
              />
            </div>
          </div>

          <div className="mt-9 flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {kindLabels.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setKind(option.value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm transition-colors',
                    kind === option.value
                      ? 'bg-background font-medium shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <form
              className="relative w-full sm:w-72"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmittedQuery(query.trim());
              }}
            >
              <IconSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={17}
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索名称或笔记内容"
                className="h-10 pl-9"
              />
            </form>
          </div>

          <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {selectedFolderId
                ? folders.find((folder) => folder.id === selectedFolderId)?.name
                : '全部资料'}
            </span>
            <div className="flex overflow-hidden rounded-md border">
              <button
                className={cn(
                  'px-2 py-1',
                  view === 'grid' && 'bg-muted text-foreground',
                )}
                onClick={() => setView('grid')}
              >
                网格
              </button>
              <button
                className={cn(
                  'px-2 py-1',
                  view === 'list' && 'bg-muted text-foreground',
                )}
                onClick={() => setView('list')}
              >
                列表
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {loading ? (
            <div className="py-24 text-center text-sm text-muted-foreground">
              正在加载资料库…
            </div>
          ) : items.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <IconFolder className="mb-4 text-muted-foreground" size={36} />
              <h2 className="font-medium">这里还没有资料</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                上传文件、生成图片或新建一条笔记，它们都会保存在这里。
              </p>
            </div>
          ) : (
            <section
              className={cn(
                'mt-5',
                view === 'grid'
                  ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                  : 'divide-y rounded-lg border',
              )}
            >
              {items.map((item) => (
                <LibraryItemCard
                  key={item.id}
                  item={item}
                  view={view}
                  folders={folders}
                  onArchive={handleArchive}
                  onMove={handleMove}
                  onUseInChat={handleUseInChat}
                />
              ))}
            </section>
          )}
        </div>
      </main>

      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>新建文件夹</DialogTitle>
            <DialogDescription>将资料按项目或主题整理。</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateFolder}>
            <Input
              autoFocus
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
              placeholder="文件夹名称"
              maxLength={100}
            />
            <DialogFooter className="mt-5">
              <Button type="submit">创建文件夹</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>新建笔记</DialogTitle>
            <DialogDescription>
              保存一段 Markdown、提示词或关键结论。
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateNote} className="space-y-3">
            <Input
              autoFocus
              value={noteTitle}
              onChange={(event) => setNoteTitle(event.target.value)}
              placeholder="笔记标题"
              maxLength={200}
            />
            <Textarea
              value={noteContent}
              onChange={(event) => setNoteContent(event.target.value)}
              placeholder="写下要保存的内容…"
              className="min-h-52"
            />
            <DialogFooter>
              <Button type="submit">保存笔记</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const LibraryItemCard = ({
  item,
  view,
  folders,
  onArchive,
  onMove,
  onUseInChat,
}: {
  item: LibraryItem;
  view: 'grid' | 'list';
  folders: LibraryFolder[];
  onArchive: (item: LibraryItem) => void;
  onMove: (item: LibraryItem, folderId: number | null) => void;
  onUseInChat: (item: LibraryItem) => void;
}) => {
  const fileUrl = item.file ? item.file.url || getFileUrl(item.file.id) : null;
  const isImage = item.kind === 'image' && fileUrl;
  const icon =
    item.kind === 'note' ? (
      <IconNotes size={24} />
    ) : item.kind === 'image' ? (
      <IconPhoto size={24} />
    ) : (
      <IconFile size={24} />
    );

  const actions = (
    <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="rounded p-1.5 hover:bg-muted" title="移动到文件夹">
            <IconFolder size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onMove(item, null)}>
            全部资料
          </DropdownMenuItem>
          {folders.map((folder) => (
            <DropdownMenuItem
              key={folder.id}
              onClick={() => onMove(item, folder.id)}
            >
              {folder.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {isImage && (
        <button
          onClick={() => onUseInChat(item)}
          className="rounded p-1.5 hover:bg-muted"
          title="在聊天中使用"
        >
          <IconPlus size={16} />
        </button>
      )}
      {fileUrl && (
        <a
          href={fileUrl}
          download={item.file?.fileName || item.title}
          className="rounded p-1.5 hover:bg-muted"
          title="下载"
        >
          <IconDownload size={16} />
        </a>
      )}
      <button
        onClick={() => onArchive(item)}
        className="rounded p-1.5 hover:bg-muted"
        title="归档"
      >
        <IconArchive size={16} />
      </button>
    </div>
  );

  if (view === 'list') {
    return (
      <article className="group flex min-w-0 items-center gap-3 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{item.title}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {item.kind === 'note' ? '笔记' : item.file?.contentType} ·{' '}
            {formatDate(item.updatedAt)}
          </div>
        </div>
        {actions}
      </article>
    );
  }

  return (
    <article className="group relative min-w-0 overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
      <a
        href={isImage ? fileUrl : undefined}
        target={isImage ? '_blank' : undefined}
        rel="noreferrer"
        className="block"
      >
        <div className="flex aspect-square items-center justify-center overflow-hidden bg-muted/70">
          {isImage ? (
            <img
              src={fileUrl}
              alt={item.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : item.kind === 'note' ? (
            <p className="line-clamp-6 whitespace-pre-wrap px-4 text-sm text-muted-foreground">
              {item.content}
            </p>
          ) : (
            <div className="text-muted-foreground">{icon}</div>
          )}
        </div>
      </a>
      <div className="flex items-start gap-2 p-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{item.title}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {formatDate(item.updatedAt)}
          </div>
        </div>
        {actions}
      </div>
    </article>
  );
};

export default LibraryContent;
