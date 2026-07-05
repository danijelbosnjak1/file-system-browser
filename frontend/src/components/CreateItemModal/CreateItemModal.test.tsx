import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ItemType } from '../../types';
import CreateItemModal from './CreateItemModal';

describe('CreateItemModal', () => {
  it('renders file fields and disables create until a name is entered', () => {
    render(<CreateItemModal itemType={ItemType.File} onClose={vi.fn()} onCreate={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Create file' })).toBeInTheDocument();
    expect(screen.getByLabelText('File name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  it('calls onCreate with a trimmed name', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();

    render(<CreateItemModal itemType={ItemType.Folder} onClose={vi.fn()} onCreate={onCreate} />);

    await user.type(screen.getByLabelText('Folder name'), '  Project Docs  ');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(onCreate).toHaveBeenCalledWith('Project Docs', ItemType.Folder);
  });

  it('shows the create error when onCreate rejects', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockRejectedValue(new Error('A file with that name already exists in this folder'));

    render(<CreateItemModal itemType={ItemType.File} onClose={vi.fn()} onCreate={onCreate} />);

    await user.type(screen.getByLabelText('File name'), 'notes.txt');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('A file with that name already exists in this folder')).toBeInTheDocument();
    });
  });

  it('closes when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<CreateItemModal itemType={ItemType.File} onClose={onClose} onCreate={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
