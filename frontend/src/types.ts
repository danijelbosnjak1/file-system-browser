export enum ItemType {
  File = 'file',
  Folder = 'folder',
}

export enum SearchScope {
  ThisFolder = 'parent',
  AllFiles = 'all',
}

export type FileItem = {
  id: number;
  name: string;
  type: ItemType;
  modified: string;
  path?: BreadcrumbItem[];
};

export type BreadcrumbItem = {
  id: number;
  name: string;
};
