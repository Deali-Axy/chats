import {
  DragEvent,
  KeyboardEvent,
  ReactElement,
  useEffect,
  useState,
} from 'react';

import useTranslation from '@/hooks/useTranslation';

import { UngroupedChatName } from '@/types/chat';
import { IChatGroup } from '@/types/group';

import SidebarActionButton from '../Button/SidebarActionButton';
import {
  IconCheck,
  IconChevronRight,
  IconDots,
  IconPencil,
  IconPlus,
  IconTrash,
  IconX,
} from '../Icons';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import {
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenuButton,
} from '../ui/sidebar';

interface Props {
  currentFolder: IChatGroup;
  defaultOpen?: boolean;
  showActions?: boolean;
  folderComponent: ReactElement | undefined;
  onRenameGroup?: (id: string, value: string) => void;
  onDeleteGroup?: (id: string) => void;
  onClickGroup?: (group: IChatGroup) => void;
  onDragStart?: (e: DragEvent<HTMLButtonElement>, group: IChatGroup) => void;
  onNewGroupChat?: (groupId: string) => void;
}

const Folder = ({
  currentFolder,
  showActions = true,
  defaultOpen = false,
  folderComponent,
  onRenameGroup,
  onDeleteGroup,
  onClickGroup,
  onDragStart,
  onNewGroupChat,
}: Props) => {
  const { t } = useTranslation();

  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    setIsOpen(defaultOpen);
  }, [defaultOpen]);

  useEffect(() => {
    if (isRenaming) {
      setIsDeleting(false);
    } else if (isDeleting) {
      setIsRenaming(false);
    }
  }, [isRenaming, isDeleting]);

  const handleEnterDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRename();
    }
  };

  const handleRename = () => {
    onRenameGroup && onRenameGroup(currentFolder.id, renameValue);
    setRenameValue('');
    setIsRenaming(false);
  };

  const handleClickFolder = () => {
    setIsOpen(!isOpen);
    onClickGroup && onClickGroup(currentFolder);
  };

  const handleDragStart = (e: DragEvent<HTMLButtonElement>) => {
    onDragStart && onDragStart(e, currentFolder);
  };

  return (
    <>
      <div className="relative flex items-center">
        {isRenaming ? (
          <div className="flex w-full items-center gap-2 rounded-md bg-background px-2 py-1.5">
            <Input
              className="flex-1 overflow-hidden overflow-ellipsis bg-transparent text-left text-sm outline-none border-none text-foreground"
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={handleEnterDown}
              autoFocus
            />
          </div>
        ) : (
          <SidebarMenuButton
            draggable
            onDragStart={(e) => handleDragStart(e)}
            onClick={handleClickFolder}
            className="font-medium text-sidebar-foreground/70"
          >
            <div
              className="transition-transform duration-200 ease-in-out shrink-0"
              style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              <IconChevronRight size={14} />
            </div>

            <span className="flex-1 truncate text-sm">
              {currentFolder.name === UngroupedChatName
                ? t('All chats')
                : currentFolder.name}
            </span>
          </SidebarMenuButton>
        )}

        {(isDeleting || isRenaming) && (
          <div className="absolute right-1 z-10 flex text-muted-foreground">
            <SidebarActionButton
              handleClick={(e) => {
                e.stopPropagation();

                if (isDeleting) {
                  onDeleteGroup && onDeleteGroup(currentFolder.id);
                } else if (isRenaming) {
                  handleRename();
                }

                setIsDeleting(false);
                setIsRenaming(false);
              }}
            >
              <IconCheck size={18} />
            </SidebarActionButton>
            <SidebarActionButton
              handleClick={(e) => {
                e.stopPropagation();
                setIsDeleting(false);
                setIsRenaming(false);
              }}
            >
              <IconX size={18} />
            </SidebarActionButton>
          </div>
        )}

        {!isDeleting && !isRenaming && showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarGroupAction>
                <IconDots size={14} />
              </SidebarGroupAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-48"
              side="right"
              align="start"
            >
              <DropdownMenuItem
                className="flex justify-start gap-3"
                onClick={() => {
                  onNewGroupChat && onNewGroupChat(currentFolder.id);
                }}
              >
                <IconPlus size={18} />
                {t('New chat')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex justify-start gap-3"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                  setRenameValue(currentFolder.name);
                }}
              >
                <IconPencil size={18} />
                {t('Edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex justify-start gap-3"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleting(true);
                }}
              >
                <IconTrash size={18} />
                {t('Delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {isOpen ? folderComponent : null}
    </>
  );
};

export default Folder;
