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
    <div className={cn('relative flex items-center h-11 w-full', containerClassName)}>
      <input
        className={cn(
          'w-full flex-1 rounded-md px-3 py-3 pr-20 text-[14px] bg-muted leading-3 border-none outline-none',
          className,
        )}
        type="text"
        placeholder={t(placeholder) || ''}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div className="absolute right-[8px] flex items-center gap-1">
        {query && (
          <IconX
            className="cursor-pointer text-neutral-300 hover:text-neutral-400"
            size={18}
            onClick={clearSearch}
          />
        )}
        <IconSearch
          className="cursor-pointer text-neutral-300 hover:text-neutral-400"
          size={18}
          onClick={handleSearchClick}
        />
      </div>
    </div>
  );
};

export default Search;
