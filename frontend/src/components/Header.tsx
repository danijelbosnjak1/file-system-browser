import { useState, type FormEvent } from 'react';
import { SearchScope, type FileItem } from '../types';
import { formatFilePath } from '../utils/filePath';
import { SearchIcon } from './Icons';

type HeaderProps = {
  searchQuery: string;
  searchScope: SearchScope;
  suggestions: FileItem[];
  onSearchQueryChange: (query: string) => void;
  onSearchScopeChange: (scope: SearchScope) => void;
  onSearchSubmit: () => void;
  onSuggestionSelect: (item: FileItem) => void;
};

function Header({
  searchQuery,
  searchScope,
  suggestions,
  onSearchQueryChange,
  onSearchScopeChange,
  onSearchSubmit,
  onSuggestionSelect,
}: HeaderProps) {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const shouldShowSuggestions = isSearchFocused && searchQuery.trim().length > 0 && suggestions.length > 0;

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearchSubmit();
    setIsSearchFocused(false);
  };

  return (
    <header className="topbar">
      <div className="search-container">
        <form className="search-wrap" onSubmit={handleSearchSubmit}>
          <SearchIcon />
          <input
            aria-label="Search by exact name"
            onBlur={() => setIsSearchFocused(false)}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="Search by exact name"
            type="text"
            value={searchQuery}
          />
        </form>

        {shouldShowSuggestions && (
          <div className="search-suggestions" role="listbox">
            {suggestions.map((suggestion) => {
              const filePath = formatFilePath(suggestion);

              return (
                <button
                  key={suggestion.id}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onSuggestionSelect(suggestion);
                    setIsSearchFocused(false);
                  }}
                  type="button"
                >
                  <span>{suggestion.name}</span>
                  {filePath && <span className="suggestion-path">{filePath}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="scope-segmented" aria-label="Search scope">
        <button
          className={`scope-segment ${searchScope === SearchScope.ThisFolder ? 'is-active' : ''}`}
          onClick={() => onSearchScopeChange(SearchScope.ThisFolder)}
          type="button"
        >
          This folder
        </button>
        <button
          className={`scope-segment ${searchScope === SearchScope.AllFiles ? 'is-active' : ''}`}
          onClick={() => onSearchScopeChange(SearchScope.AllFiles)}
          type="button"
        >
          All files
        </button>
      </div>
    </header>
  );
}

export default Header;
