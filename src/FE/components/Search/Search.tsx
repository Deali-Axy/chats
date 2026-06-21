import { FC, useContext, useRef, useState } from 'react';

import useTranslation from '@/hooks/useTranslation';

import { IconSearch, IconX } from '@/components/Icons/index';

import { cn } from '@/lib/utils';

interface Props {
  placeholder: string;
  searchTerm: string;
  className?: string;
  containerClassName?: string;
  onSearch: (searchTerm: string) => void;
}
const Search: FC<Props> = ({
  placeholder,
  searchTerm,
  className,
  containerClassName,
  onSearch,
}) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState<string>('');

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSearch(query);
    }
  };

  const handleSearchClick = () => {
    onSearch(query);
  };

  const clearSearch = () => {
    onSearch('');
    setQuery('');
  };

  return (
    <div className={cn('relative flex items-center h-9', containerClassName)}>
      <input
        className={cn(
          'w-full flex-1 rounded-lg px-3 py-2 pr-16 text-sm bg-sidebar-accent/50 leading-tight border border-sidebar-border/50 outline-none transition-all duration-200 placeholder:text-sidebar-foreground/40 focus:bg-sidebar-accent focus:border-sidebar-border focus-visible:ring-2 focus-visible:ring-sidebar-ring',
          className,
        )}
        type="text"
        placeholder={t(placeholder) || ''}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div className="absolute right-[8px] flex items-center gap-0.5">
        {query && (
          <IconX
            className="cursor-pointer text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors"
            size={16}
            onClick={clearSearch}
          />
        )}
        <IconSearch
          className="cursor-pointer text-sidebar-foreground/40 hover:text-sidebar-foreground/70 transition-colors"
          size={16}
          onClick={handleSearchClick}
        />
      </div>
    </div>
  );
};

export default Search;
