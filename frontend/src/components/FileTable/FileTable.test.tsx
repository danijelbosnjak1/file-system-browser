import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ItemType, type FileItem } from '../../types';
import FileTable from './FileTable';

const items: FileItem[] = [
  {
    id: 1,
    name: 'Docs',
    type: ItemType.Folder,
    modified: 'Jul 5, 2026',
  },
  {
    id: 2,
    name: 'notes.txt',
    type: ItemType.File,
    modified: 'Jul 5, 2026',
    path: [{ id: 1, name: 'Docs' }],
  },
];

describe('FileTable', () => {
  it('renders folders, files, file locations, and item count', () => {
    render(<FileTable items={items} onDeleteRequest={vi.fn()} onOpenFolder={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Docs' })).toBeInTheDocument();
    expect(screen.getByText('notes.txt')).toBeInTheDocument();
    expect(screen.getByText('CloudStorage > Docs')).toBeInTheDocument();
    expect(screen.getByText('Showing 2 items')).toBeInTheDocument();
  });

  it('opens folders when the folder row button is clicked', async () => {
    const user = userEvent.setup();
    const onOpenFolder = vi.fn();

    render(<FileTable items={items} onDeleteRequest={vi.fn()} onOpenFolder={onOpenFolder} />);

    await user.click(screen.getByRole('button', { name: 'Docs', exact: true }));

    expect(onOpenFolder).toHaveBeenCalledWith(items[0]);
  });

  it('requests delete for the selected item', async () => {
    const user = userEvent.setup();
    const onDeleteRequest = vi.fn();

    render(<FileTable items={items} onDeleteRequest={onDeleteRequest} onOpenFolder={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Delete notes.txt' }));

    expect(onDeleteRequest).toHaveBeenCalledWith(items[1]);
  });
});
