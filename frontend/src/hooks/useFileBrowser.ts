import {
  createFile,
  createFolder,
  deleteItem as deleteItemRequest,
} from '../api/fileSystemApi';
import { ItemType, type FileItem } from '../types';
import { useFileSearch } from './useFileSearch';
import { useFolderItems } from './useFolderItems';
import { useFolderNavigation } from './useFolderNavigation';
import { useState } from 'react';

type ToastMessage = {
  message: string;
  type: 'success' | 'error';
};

export function useFileBrowser() {
  const {
    breadcrumbs,
    canGoBack,
    canGoForward,
    currentFolderId,
    goBack,
    goForward,
    openFolder,
    removeDeletedFolderFromHistory,
  } = useFolderNavigation();
  const folderItems = useFolderItems(currentFolderId);
  const fileSearch = useFileSearch(currentFolderId);
  const [modalType, setModalType] = useState<ItemType | null>(null);
  const [itemToDelete, setItemToDelete] = useState<FileItem | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const createItem = async (name: string, type: ItemType) => {
    const createdItem =
      type === ItemType.Folder
        ? await createFolder(name, currentFolderId)
        : await createFile(name, currentFolderId);

    folderItems.addItem(createdItem);
    setToast({
      message: type === ItemType.Folder ? 'Folder created' : 'File created',
      type: 'success',
    });
  };

  const deleteItem = async (itemId: number) => {
    const deletedItem = itemToDelete;

    try {
      await deleteItemRequest(itemId);
      folderItems.removeItem(itemId);
      fileSearch.removeSearchResult(itemId);

      if (deletedItem?.type === ItemType.Folder) {
        removeDeletedFolderFromHistory(deletedItem.id);
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

  return {
    activeSearchQuery: fileSearch.activeSearchQuery,
    breadcrumbs,
    canGoBack,
    canGoForward,
    closeCreateModal: () => setModalType(null),
    closeDeleteModal: () => setItemToDelete(null),
    closeToast: () => setToast(null),
    createItem,
    deleteItem,
    error: fileSearch.error || folderItems.error,
    goBack,
    goForward,
    isLoading: fileSearch.isLoading || folderItems.isLoading,
    isSearchActive: fileSearch.isSearchActive,
    itemToDelete,
    items: fileSearch.searchResults ?? folderItems.items,
    modalType,
    openCreateFileModal: () => setModalType(ItemType.File),
    openCreateFolderModal: () => setModalType(ItemType.Folder),
    openFolder,
    requestDelete: setItemToDelete,
    searchFiles: fileSearch.searchFiles,
    searchQuery: fileSearch.searchQuery,
    searchScope: fileSearch.searchScope,
    selectSearchSuggestion: fileSearch.selectSearchSuggestion,
    suggestions: fileSearch.suggestions,
    toast,
    updateSearchQuery: fileSearch.updateSearchQuery,
    updateSearchScope: fileSearch.updateSearchScope,
  };
}
