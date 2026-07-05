import type { BreadcrumbItem, FileItem } from '../types';

export const formatBreadcrumbPath = (path: BreadcrumbItem[] = []) =>
  ['CloudStorage', ...path.map((pathItem) => pathItem.name)].join(' > ');

export const formatFilePath = (item: FileItem) => {
  if (item.path === undefined) {
    return null;
  }

  return formatBreadcrumbPath(item.path);
};
