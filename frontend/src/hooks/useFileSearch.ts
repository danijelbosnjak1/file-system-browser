import { useEffect, useState } from 'react';
import { searchFilesByExactName, suggestFilesByPrefix } from '../api/fileSystemApi';
import { SearchScope, type FileItem } from '../types';

export function useFileSearch(currentFolderId: number | null) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FileItem[] | null>(null);
  const [searchScope, setSearchScope] = useState(SearchScope.ThisFolder);
  const [suggestions, setSuggestions] = useState<FileItem[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setSearchQuery('');
    setActiveSearchQuery('');
    setSearchResults(null);
    setSuggestions([]);
    setError('');
  }, [currentFolderId]);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setActiveSearchQuery('');
      setSuggestions([]);
      setSearchResults(null);
      return;
    }

    let shouldIgnoreResponse = false;
    const timeoutId = window.setTimeout(() => {
      suggestFilesByPrefix(trimmedQuery, searchScope, currentFolderId)
        .then((files) => {
          if (!shouldIgnoreResponse) {
            setSuggestions(files);
          }
        })
        .catch(() => {
          if (!shouldIgnoreResponse) {
            setSuggestions([]);
          }
        });
    }, 200);

    return () => {
      shouldIgnoreResponse = true;
      window.clearTimeout(timeoutId);
    };
  }, [currentFolderId, searchQuery, searchScope]);

  const updateSearchQuery = (query: string) => {
    setSearchQuery(query);
    setActiveSearchQuery('');
    setSearchResults(null);
    setError('');
  };

  const updateSearchScope = (scope: SearchScope) => {
    setSearchScope(scope);
    setActiveSearchQuery('');
    setSearchResults(null);
    setError('');
  };

  const searchFiles = async (query = searchQuery) => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setActiveSearchQuery('');
      setSearchResults(null);
      setSuggestions([]);
      setError('');
      return;
    }

    setIsLoading(true);
    setError('');
    setActiveSearchQuery(trimmedQuery);

    try {
      const files = await searchFilesByExactName(trimmedQuery, searchScope, currentFolderId);

      setSearchResults(files);
      setSuggestions([]);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Failed to search files');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectSearchSuggestion = async (item: FileItem) => {
    setSearchQuery(item.name);
    await searchFiles(item.name);
  };

  return {
    activeSearchQuery,
    error,
    isLoading,
    isSearchActive: searchResults !== null,
    removeSearchResult: (itemId: number) =>
      setSearchResults((currentResults) =>
        currentResults === null ? null : currentResults.filter((item) => item.id !== itemId),
      ),
    searchFiles,
    searchQuery,
    searchResults,
    searchScope,
    selectSearchSuggestion,
    suggestions,
    updateSearchQuery,
    updateSearchScope,
  };
}
