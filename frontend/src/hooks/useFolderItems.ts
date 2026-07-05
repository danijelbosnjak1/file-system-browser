import { useEffect, useState } from 'react';
import { getItems } from '../api/fileSystemApi';
import { ItemType, type FileItem } from '../types';

const sortItems = (items: FileItem[]) =>
  [...items].sort((firstItem, secondItem) => {
    if (firstItem.type !== secondItem.type) {
      return firstItem.type === ItemType.Folder ? -1 : 1;
    }

    return firstItem.name.localeCompare(secondItem.name);
  });

export function useFolderItems(currentFolderId: number | null) {
  const [items, setItems] = useState<FileItem[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let shouldIgnoreResponse = false;

    setIsLoading(true);
    setError('');

    getItems(currentFolderId)
      .then((loadedItems) => {
        if (!shouldIgnoreResponse) {
          setItems(loadedItems);
        }
      })
      .catch((loadError) => {
        if (!shouldIgnoreResponse) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load items');
          setItems([]);
        }
      })
      .finally(() => {
        if (!shouldIgnoreResponse) {
          setIsLoading(false);
        }
      });

    return () => {
      shouldIgnoreResponse = true;
    };
  }, [currentFolderId]);

  return {
    addItem: (item: FileItem) => setItems((currentItems) => sortItems([...currentItems, item])),
    error,
    isLoading,
    items,
    removeItem: (itemId: number) => setItems((currentItems) => currentItems.filter((item) => item.id !== itemId)),
  };
}
