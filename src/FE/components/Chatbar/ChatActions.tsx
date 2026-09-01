import useTranslation from '@/hooks/useTranslation';

import {
  IconArchive,
  IconDots,
  IconFolderPlus,
  IconTrash,
} from '@/components/Icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ChatActions = ({
  onAddGroup,
  onBatchArchive,
  onBatchDelete,
  sidebar = false,
}: {
  onAddGroup: () => void;
  onBatchArchive: () => void;
  onBatchDelete: () => void;
  sidebar?: boolean;
}) => {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={
          sidebar
            ? 'flex h-10 w-full items-center justify-start gap-2 rounded-lg px-3 text-[15px] font-medium transition-colors hover:bg-sidebar-accent focus:outline-none'
            : 'p-[6px] focus:outline-none'
        }
      >
        <IconDots size={18} />
        {sidebar && <span>{t('More')}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-42 border-none">
        <DropdownMenuItem
          className="flex justify-start gap-3"
          onClick={onAddGroup}
        >
          <IconFolderPlus size={18} />
          {t('New Group')}
        </DropdownMenuItem>
        {/* <DropdownMenuItem
          className="flex justify-start gap-3"
          onClick={onBatchArchive}
        >
          <IconArchive size={18} />
          {t('Batch Archive')}
        </DropdownMenuItem> */}
        <DropdownMenuItem
          className="flex justify-start gap-3"
          onClick={onBatchDelete}
        >
          <IconTrash size={18} />
          {t('Batch Delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ChatActions;
