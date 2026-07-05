import { ItemType, SearchScope, type BreadcrumbItem, type FileItem } from '../types';
import { formatDisplayDate } from '../utils/date';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

type ApiFileSystemNode = {
  id: number;
  name: string;
  type: ItemType;
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  path?: BreadcrumbItem[];
};

const mapNodeToFileItem = (node: ApiFileSystemNode): FileItem => ({
  id: node.id,
  name: node.name,
  type: node.type,
  modified: formatDisplayDate(node.updatedAt),
  path: node.path,
});

const getErrorMessage = async (response: Response, fallbackMessage: string) => {
  const data = await response.json().catch(() => null);

  if (data && typeof data.message === 'string') {
    return data.message;
  }

  return fallbackMessage;
};

export async function getItems(parentId: number | null): Promise<FileItem[]> {
  const query = parentId === null ? '' : `?parentId=${parentId}`;
  const response = await fetch(`${API_BASE_URL}/items${query}`);

  if (!response.ok) {
    throw new Error('Failed to load items');
  }

  const nodes: ApiFileSystemNode[] = await response.json();
  return nodes.map(mapNodeToFileItem);
}

export async function createFolder(name: string, parentId: number | null): Promise<FileItem> {
  const response = await fetch(`${API_BASE_URL}/folders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      parentId,
    }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Failed to create folder'));
  }

  const node: ApiFileSystemNode = await response.json();
  return mapNodeToFileItem(node);
}

export async function createFile(name: string, parentId: number | null): Promise<FileItem> {
  const response = await fetch(`${API_BASE_URL}/files`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      parentId,
    }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Failed to create file'));
  }

  const node: ApiFileSystemNode = await response.json();
  return mapNodeToFileItem(node);
}

export async function deleteItem(itemId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete item');
  }
}

const buildFileSearchQuery = (params: {
  parentId: number | null;
  query?: string;
  prefix?: string;
  scope: SearchScope;
  limit?: number;
}) => {
  const searchParams = new URLSearchParams({
    scope: params.scope,
  });

  if (params.query !== undefined) {
    searchParams.set('query', params.query);
  }

  if (params.prefix !== undefined) {
    searchParams.set('prefix', params.prefix);
  }

  if (params.parentId !== null) {
    searchParams.set('parentId', String(params.parentId));
  }

  if (params.limit !== undefined) {
    searchParams.set('limit', String(params.limit));
  }

  return searchParams.toString();
};

export async function searchFilesByExactName(
  query: string,
  scope: SearchScope,
  parentId: number | null,
): Promise<FileItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/search?${buildFileSearchQuery({
      query,
      scope,
      parentId,
    })}`,
  );

  if (!response.ok) {
    throw new Error('Failed to search files');
  }

  const nodes: ApiFileSystemNode[] = await response.json();
  return nodes.map(mapNodeToFileItem);
}

export async function suggestFilesByPrefix(
  prefix: string,
  scope: SearchScope,
  parentId: number | null,
): Promise<FileItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/suggestions?${buildFileSearchQuery({
      prefix,
      scope,
      parentId,
      limit: 10,
    })}`,
  );

  if (!response.ok) {
    throw new Error('Failed to load search suggestions');
  }

  const nodes: ApiFileSystemNode[] = await response.json();
  return nodes.map(mapNodeToFileItem);
}
