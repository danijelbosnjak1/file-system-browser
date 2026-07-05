import { useEffect, useRef, useState } from 'react';
import {
  createFile,
  createFolder,
  deleteItem as deleteItemRequest,
  getItems,
  searchFilesByExactName,
  suggestFilesByPrefix,
} from '../api/fileSystemApi';
import { ItemType, SearchScope, type BreadcrumbItem, type FileItem } from '../types';

type FolderHistoryState = {
  entries: (number | null)[];
  folderId: number | null;
  index: number;
  maxIndex: number;
  paths: BreadcrumbItem[][];
};

type ToastMessage = {
  message: string;
  type: 'success' | 'error';
};

const FOLDER_ID_QUERY_PARAM = 'folderId';

const getFolderIdFromUrl = () => {
  const folderId = new URLSearchParams(window.location.search).get(FOLDER_ID_QUERY_PARAM);

  if (!folderId) {
    return null;
  }

  const parsedFolderId = Number(folderId);

  return Number.isNaN(parsedFolderId) ? null : parsedFolderId;
};

const getHistoryState = (fallbackFolderId: number | null): FolderHistoryState => {
  const state = window.history.state as Partial<FolderHistoryState> | null;

  if (typeof state?.index === 'number' && typeof state?.maxIndex === 'number') {
    const entries = Array.isArray(state.entries) && state.entries.length > 0 ? state.entries : [fallbackFolderId];
    const fallbackPath = fallbackFolderId === null ? [] : [{ id: fallbackFolderId, name: `Folder ${fallbackFolderId}` }];
    const paths =
      Array.isArray(state.paths) && state.paths.length === entries.length
        ? state.paths
        : entries.map((entry) => (entry === fallbackFolderId ? fallbackPath : []));
    const index = Math.min(state.index, entries.length - 1);

    return {
      entries,
      folderId: typeof state.folderId === 'number' || state.folderId === null ? state.folderId : fallbackFolderId,
      index,
      maxIndex: Math.min(state.maxIndex, entries.length - 1),
      paths,
    };
  }

  return {
    entries: [fallbackFolderId],
    folderId: fallbackFolderId,
    index: 0,
    maxIndex: 0,
    paths: [fallbackFolderId === null ? [] : [{ id: fallbackFolderId, name: `Folder ${fallbackFolderId}` }]],
  };
};

const updateFolderUrl = (folderId: number | null, state: FolderHistoryState) => {
  const url = new URL(window.location.href);

  if (folderId === null) {
    url.searchParams.delete(FOLDER_ID_QUERY_PARAM);
  } else {
    url.searchParams.set(FOLDER_ID_QUERY_PARAM, String(folderId));
  }

  window.history.pushState(state, '', url);
};

const replaceCurrentHistoryState = (state: FolderHistoryState) => {
  window.history.replaceState(state, '', window.location.href);
};

const sortItems = (items: FileItem[]) =>
  [...items].sort((firstItem, secondItem) => {
    if (firstItem.type !== secondItem.type) {
      return firstItem.type === ItemType.Folder ? -1 : 1;
    }

    return firstItem.name.localeCompare(secondItem.name);
  });

export function useFileBrowser() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(() => getFolderIdFromUrl());
  const [historyState, setHistoryState] = useState<FolderHistoryState>(() => getHistoryState(getFolderIdFromUrl()));
  const deletedFolderIdsRef = useRef(new Set<number>());
  const historyStateRef = useRef(historyState);
  const [modalType, setModalType] = useState<ItemType | null>(null);
  const [itemToDelete, setItemToDelete] = useState<FileItem | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FileItem[] | null>(null);
  const [searchScope, setSearchScope] = useState(SearchScope.ThisFolder);
  const [suggestions, setSuggestions] = useState<FileItem[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    historyStateRef.current = historyState;
  }, [historyState]);

  useEffect(() => {
    const folderId = getFolderIdFromUrl();
    const initialHistoryState = getHistoryState(folderId);

    window.history.replaceState(initialHistoryState, '', window.location.href);
    setCurrentFolderId(folderId);
    setHistoryState(initialHistoryState);

    const handlePopState = (event: PopStateEvent) => {
      const nextFolderId = getFolderIdFromUrl();

      if (nextFolderId !== null && deletedFolderIdsRef.current.has(nextFolderId)) {
        window.history.back();
        return;
      }

      const nextHistoryState = event.state
          ? getHistoryState(nextFolderId)
          : {
              entries: [nextFolderId],
              folderId: nextFolderId,
              index: 0,
              maxIndex: 0,
              paths: [nextFolderId === null ? [] : [{ id: nextFolderId, name: `Folder ${nextFolderId}` }]],
            };

      setCurrentFolderId(nextHistoryState.folderId);
      setHistoryState(nextHistoryState);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    const loadItems = async () => {
      setIsLoading(true);
      setError('');
      const loadedItems = await getItems(currentFolderId);
      setItems(loadedItems);
    };

    loadItems()
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load items');
        setItems([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [currentFolderId]);

  useEffect(() => {
    setSearchQuery('');
    setActiveSearchQuery('');
    setSearchResults(null);
    setSuggestions([]);
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

  const createItem = async (name: string, type: ItemType) => {
    const createdItem =
      type === ItemType.Folder
        ? await createFolder(name, currentFolderId)
        : await createFile(name, currentFolderId);

    setItems((currentItems) => sortItems([...currentItems, createdItem]));
    setToast({
      message: type === ItemType.Folder ? 'Folder created' : 'File created',
      type: 'success',
    });
  };

  const updateSearchQuery = (query: string) => {
    setSearchQuery(query);
    setActiveSearchQuery('');
    setSearchResults(null);
  };

  const updateSearchScope = (scope: SearchScope) => {
    setSearchScope(scope);
    setActiveSearchQuery('');
    setSearchResults(null);
  };

  const searchFiles = async (query = searchQuery) => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setActiveSearchQuery('');
      setSearchResults(null);
      setSuggestions([]);
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

  const deleteItem = async (itemId: number) => {
    const deletedItem = itemToDelete;

    try {
      await deleteItemRequest(itemId);
      setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
      setSearchResults((currentResults) =>
        currentResults === null ? null : currentResults.filter((item) => item.id !== itemId),
      );

      if (deletedItem?.type === ItemType.Folder) {
        const deletedFolderIndex = historyStateRef.current.entries.indexOf(deletedItem.id);

        if (deletedFolderIndex !== -1) {
          const removedEntries = historyStateRef.current.entries.slice(deletedFolderIndex);

          removedEntries.forEach((entry) => {
            if (entry !== null) {
              deletedFolderIdsRef.current.add(entry);
            }
          });

          const nextEntries = historyStateRef.current.entries.slice(0, deletedFolderIndex);
          const nextPaths = historyStateRef.current.paths.slice(0, deletedFolderIndex);
          const safeEntries = nextEntries.length > 0 ? nextEntries : [null];
          const safePaths = nextPaths.length > 0 ? nextPaths : [[]];
          const nextIndex = Math.min(historyStateRef.current.index, safeEntries.length - 1);
          const nextHistoryState = {
            entries: safeEntries,
            folderId: safeEntries[nextIndex],
            index: nextIndex,
            maxIndex: safeEntries.length - 1,
            paths: safePaths,
          };

          replaceCurrentHistoryState(nextHistoryState);
          setHistoryState(nextHistoryState);

          if (removedEntries.includes(currentFolderId)) {
            setCurrentFolderId(nextHistoryState.folderId);
          }
        } else {
          deletedFolderIdsRef.current.add(deletedItem.id);
        }
      }

      setToast({
        message: deletedItem?.type === ItemType.Folder ? 'Folder deleted' : 'File deleted',
        type: 'success',
      });
    } catch (deleteError) {
      setToast({
        message: deleteError instanceof Error ? deleteError.message : 'Failed to delete item',
        type: 'error',
      });
      throw deleteError;
    }
  };

  const openFolder = (item: FileItem) => {
    if (item.type === ItemType.Folder) {
      const nextIndex = historyState.index + 1;
      const nextEntries = [...historyState.entries.slice(0, historyState.index + 1), item.id];
      const currentPath = historyState.paths[historyState.index] ?? [];
      const nextPath = [...currentPath, { id: item.id, name: item.name }];
      const nextPaths = [...historyState.paths.slice(0, historyState.index + 1), nextPath];
      const nextHistoryState = {
        entries: nextEntries,
        folderId: item.id,
        index: nextIndex,
        maxIndex: nextEntries.length - 1,
        paths: nextPaths,
      };
      const currentHistoryState = {
        ...historyState,
        entries: nextEntries,
        maxIndex: nextEntries.length - 1,
        paths: nextPaths,
      };

      replaceCurrentHistoryState(currentHistoryState);
      updateFolderUrl(item.id, nextHistoryState);
      setHistoryState(nextHistoryState);
      setCurrentFolderId(item.id);
    }
  };

  const goBack = () => {
    window.history.back();
  };

  const goForward = () => {
    window.history.forward();
  };

  return {
    canGoBack: historyState.index > 0,
    canGoForward: historyState.index < historyState.maxIndex && historyState.entries[historyState.index + 1] !== undefined,
    breadcrumbs: historyState.paths[historyState.index] ?? [],
    error,
    isLoading,
    items: searchResults ?? items,
    itemToDelete,
    modalType,
    activeSearchQuery,
    isSearchActive: searchResults !== null,
    searchQuery,
    searchScope,
    suggestions,
    toast,
    closeCreateModal: () => setModalType(null),
    closeDeleteModal: () => setItemToDelete(null),
    closeToast: () => setToast(null),
    createItem,
    deleteItem,
    goBack,
    goForward,
    openCreateFileModal: () => setModalType(ItemType.File),
    openCreateFolderModal: () => setModalType(ItemType.Folder),
    openFolder,
    requestDelete: setItemToDelete,
    searchFiles,
    selectSearchSuggestion,
    updateSearchQuery,
    updateSearchScope,
  };
}
