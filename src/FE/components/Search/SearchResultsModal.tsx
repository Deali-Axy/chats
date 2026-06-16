import { FC, useContext } from 'react';

import useTranslation from '@/hooks/useTranslation';

import { ChatResult } from '@/types/clientApis';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import HomeContext from '@/contexts/home.context';
import { highlightText } from '@/utils/highlight';

interface Props {
  isOpen: boolean;
  searchTerm: string;
  searchResults: ChatResult[];
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
}

/**
 * 搜索结果弹窗组件
 * 显示搜索结果列表，支持标题和内容的关键词高亮
 */
const SearchResultsModal: FC<Props> = ({
  isOpen,
  searchTerm,
  searchResults,
  onClose,
  onSelectChat,
}) => {
  const { t } = useTranslation();

  /**
   * 截取匹配内容的片段，显示关键词周围的文字
   */
  const getContentSnippet = (content: string, keyword: string, contextLength: number = 100): string => {
    const lowerContent = content.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();
    const index = lowerContent.indexOf(lowerKeyword);

    if (index === -1) {
      return content.substring(0, contextLength * 2) + '...';
    }

    const start = Math.max(0, index - contextLength);
    const end = Math.min(content.length, index + keyword.length + contextLength);
    let snippet = content.substring(start, end);

    if (start > 0) {
      snippet = '...' + snippet;
    }
    if (end < content.length) {
      snippet = snippet + '...';
    }

    return snippet;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {t('Search Results')} - "{searchTerm}"
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {searchResults.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {t('No results found')}
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((chat) => (
                <div
                  key={chat.id}
                  className="p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => {
                    onSelectChat(chat.id);
                    onClose();
                  }}
                >
                  {/* 标题 */}
                  <div className="font-medium text-sm mb-1">
                    {highlightText(chat.title, searchTerm)}
                  </div>

                  {/* 匹配的内容片段 */}
                  {chat.matchedContent && (
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {highlightText(
                        getContentSnippet(chat.matchedContent, searchTerm),
                        searchTerm
                      )}
                    </div>
                  )}

                  {/* 标签 */}
                  {chat.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {chat.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs bg-muted px-1.5 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 更新时间 */}
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(chat.updatedAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchResultsModal;
