import { useEffect, useRef, useState } from 'react';
import { ItemType, type BreadcrumbItem, type FileItem } from '../types';

type FolderHistoryState = {
  entries: (number | null)[];
  folderId: number | null;
  index: number;
  maxIndex: number;
  paths: BreadcrumbItem[][];
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

export function useFolderNavigation() {
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(() => getFolderIdFromUrl());
  const [historyState, setHistoryState] = useState<FolderHistoryState>(() => getHistoryState(getFolderIdFromUrl()));
  const deletedFolderIdsRef = useRef(new Set<number>());
  const historyStateRef = useRef(historyState);

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

  const openFolder = (item: FileItem) => {
    if (item.type !== ItemType.Folder) {
      return;
    }

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
  };

  const removeDeletedFolderFromHistory = (folderId: number) => {
    const deletedFolderIndex = historyStateRef.current.entries.indexOf(folderId);

    if (deletedFolderIndex === -1) {
      deletedFolderIdsRef.current.add(folderId);
      return;
    }

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
  };

  return {
    breadcrumbs: historyState.paths[historyState.index] ?? [],
    canGoBack: historyState.index > 0,
    canGoForward: historyState.index < historyState.maxIndex && historyState.entries[historyState.index + 1] !== undefined,
    currentFolderId,
    goBack: () => window.history.back(),
    goForward: () => window.history.forward(),
    openFolder,
    removeDeletedFolderFromHistory,
  };
}
