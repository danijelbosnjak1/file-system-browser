import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchScope } from '../types';
import FilePageHeader from './FilePageHeader';

const defaultProps = {
  activeSearchQuery: '',
  breadcrumbs: [],
  canGoBack: false,
  canGoForward: false,
  isSearchActive: false,
  searchScope: SearchScope.ThisFolder,
  onBack: vi.fn(),
  onForward: vi.fn(),
  onNewFile: vi.fn(),
  onNewFolder: vi.fn(),
};

describe('FilePageHeader', () => {
  it('shows root browsing state', () => {
    render(<FilePageHeader {...defaultProps} />);

    expect(screen.getByRole('heading', { name: 'All Files' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent('CloudStorage');
    expect(screen.getByRole('button', { name: 'Go back' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Go forward' })).toBeDisabled();
  });

  it('shows the current folder breadcrumb', () => {
    render(
      <FilePageHeader
        {...defaultProps}
        breadcrumbs={[
          { id: 1, name: 'Docs' },
          { id: 2, name: 'Reports' },
        ]}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Reports' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent('CloudStorage›Docs›Reports');
  });

  it('shows global search context', () => {
    render(
      <FilePageHeader
        {...defaultProps}
        activeSearchQuery="report.txt"
        isSearchActive
        searchScope={SearchScope.AllFiles}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Search results for "report.txt"' })).toBeInTheDocument();
    expect(screen.getByText('Searching all files from CloudStorage')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).not.toBeInTheDocument();
  });

  it('shows folder-scoped search context', () => {
    render(
      <FilePageHeader
        {...defaultProps}
        activeSearchQuery="report.txt"
        breadcrumbs={[{ id: 1, name: 'Docs' }]}
        isSearchActive
        searchScope={SearchScope.ThisFolder}
      />,
    );

    expect(screen.getByText('Searching this folder: CloudStorage > Docs')).toBeInTheDocument();
  });

  it('calls action handlers', async () => {
    const user = userEvent.setup();
    const onNewFile = vi.fn();
    const onNewFolder = vi.fn();

    render(<FilePageHeader {...defaultProps} onNewFile={onNewFile} onNewFolder={onNewFolder} />);

    await user.click(screen.getByRole('button', { name: 'New File' }));
    await user.click(screen.getByRole('button', { name: 'New Folder' }));

    expect(onNewFile).toHaveBeenCalledOnce();
    expect(onNewFolder).toHaveBeenCalledOnce();
  });
});
