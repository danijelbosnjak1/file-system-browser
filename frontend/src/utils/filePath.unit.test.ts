import { describe, expect, it } from 'vitest';
import { ItemType, type FileItem } from '../types';
import { formatBreadcrumbPath, formatFilePath } from './filePath';

describe('file path utilities', () => {
  it('formats the root breadcrumb path', () => {
    expect(formatBreadcrumbPath()).toBe('CloudStorage');
  });

  it('formats nested breadcrumb paths', () => {
    expect(
      formatBreadcrumbPath([
        { id: 1, name: 'Documents' },
        { id: 2, name: 'Reports' },
      ]),
    ).toBe('CloudStorage > Documents > Reports');
  });

  it('returns null when a file item has no path', () => {
    const item: FileItem = {
      id: 1,
      name: 'report.txt',
      type: ItemType.File,
      modified: 'Jul 5, 2026',
    };

    expect(formatFilePath(item)).toBeNull();
  });

  it('formats a file item path', () => {
    const item: FileItem = {
      id: 1,
      name: 'report.txt',
      type: ItemType.File,
      modified: 'Jul 5, 2026',
      path: [{ id: 2, name: 'Documents' }],
    };

    expect(formatFilePath(item)).toBe('CloudStorage > Documents');
  });
});
