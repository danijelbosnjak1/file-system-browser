import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { SearchScope, type FileItem } from '../../types';
import { formatFilePath } from '../../utils/filePath';
import { SearchIcon } from '../Icons';

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
  const [highlightedSuggestionIndex, setHighlightedSuggestionIndex] = useState(-1);
  const shouldShowSuggestions = isSearchFocused && searchQuery.trim().length > 0 && suggestions.length > 0;

  useEffect(() => {
    setHighlightedSuggestionIndex(-1);
  }, [searchQuery, suggestions]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearchSubmit();
    setIsSearchFocused(false);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsSearchFocused(false);
      setHighlightedSuggestionIndex(-1);
      return;
    }

    if (!shouldShowSuggestions) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedSuggestionIndex((currentIndex) => (currentIndex + 1) % suggestions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedSuggestionIndex((currentIndex) =>
        currentIndex <= 0 ? suggestions.length - 1 : currentIndex - 1,
      );
      return;
    }

    if (event.key === 'Enter' && highlightedSuggestionIndex >= 0) {
      event.preventDefault();
      onSuggestionSelect(suggestions[highlightedSuggestionIndex]);
      setIsSearchFocused(false);
      setHighlightedSuggestionIndex(-1);
    }
  };

  return (
    <header className="topbar">
      <div className="search-container">
        <form className="search-wrap" onSubmit={handleSearchSubmit}>
          <SearchIcon />
          <input
            aria-label="Search by exact name"
            onBlur={() => setIsSearchFocused(false)}
            onChange={(event) => {
              setIsSearchFocused(true);
              setHighlightedSuggestionIndex(-1);
              onSearchQueryChange(event.target.value);
            }}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search by exact name"
            type="text"
            value={searchQuery}
          />
        </form>

        {shouldShowSuggestions && (
          <div className="search-suggestions" role="listbox">
            {suggestions.map((suggestion, index) => {
              const filePath = formatFilePath(suggestion);
              const isHighlighted = index === highlightedSuggestionIndex;

              return (
                <button
                  aria-selected={isHighlighted}
                  className={isHighlighted ? 'is-highlighted' : ''}
                  key={suggestion.id}
                  onMouseEnter={() => setHighlightedSuggestionIndex(index)}
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
