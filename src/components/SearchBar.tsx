'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface Props {
  onSearch: (value: string) => void;
  defaultValue?: string;
}

export function SearchBar({ onSearch, defaultValue = '' }: Props) {
  const [value, setValue] = useState(defaultValue);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onSearch(value), 400);
    return () => clearTimeout(debounceRef.current);
  }, [value, onSearch]);

  return (
    <div className="relative flex items-center">
      <Search size={14} className="absolute left-3 text-text-muted pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder='Search jobs, companies, tags... e.g. "music europe" or "web3 community"'
        className="input-base w-full pl-8 pr-8 text-xs h-8"
      />
      {value && (
        <button
          onClick={() => { setValue(''); onSearch(''); }}
          className="absolute right-2 text-text-muted hover:text-text-primary"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
