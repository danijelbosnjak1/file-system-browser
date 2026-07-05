import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ItemType, SearchScope, type FileItem } from '../../types';
import Header from './Header';

const suggestions: FileItem[] = [
  {
    id: 1,
    name: 'report.txt',
    type: ItemType.File,
    modified: 'Jul 5, 2026',
    path: [{ id: 10, name: 'Docs' }],
  },
];

const defaultProps = {
  searchQuery: '',
  searchScope: SearchScope.ThisFolder,
  suggestions: [],
  onSearchQueryChange: vi.fn(),
  onSearchScopeChange: vi.fn(),
  onSearchSubmit: vi.fn(),
  onSuggestionSelect: vi.fn(),
};

describe('Header', () => {
  it('calls onSearchQueryChange when the input changes', () => {
    const onSearchQueryChange = vi.fn();

    render(<Header {...defaultProps} onSearchQueryChange={onSearchQueryChange} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Search by exact name' }), {
      target: { value: 'report' },
    });

    expect(onSearchQueryChange).toHaveBeenCalledWith('report');
  });

  it('submits the exact-name search on Enter', async () => {
    const user = userEvent.setup();
    const onSearchSubmit = vi.fn();

    render(<Header {...defaultProps} searchQuery="report.txt" onSearchSubmit={onSearchSubmit} />);

    await user.click(screen.getByRole('textbox', { name: 'Search by exact name' }));
    await user.keyboard('{Enter}');

    expect(onSearchSubmit).toHaveBeenCalledOnce();
  });

  it('shows suggestions again after submitting a search and changing the input', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Header {...defaultProps} searchQuery="missing-file" suggestions={suggestions} />,
    );

    await user.click(screen.getByRole('textbox', { name: 'Search by exact name' }));

    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Enter}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.type(screen.getByRole('textbox', { name: 'Search by exact name' }), '2');

    rerender(<Header {...defaultProps} searchQuery="missing-file2" suggestions={suggestions} />);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('switches search scope', async () => {
    const user = userEvent.setup();
    const onSearchScopeChange = vi.fn();

    render(<Header {...defaultProps} onSearchScopeChange={onSearchScopeChange} />);

    expect(screen.getByRole('button', { name: 'This folder' })).toHaveClass('is-active');

    await user.click(screen.getByRole('button', { name: 'All files' }));

    expect(onSearchScopeChange).toHaveBeenCalledWith(SearchScope.AllFiles);
  });

  it('shows suggestions on focus and selects one', async () => {
    const user = userEvent.setup();
    const onSuggestionSelect = vi.fn();

    render(
      <Header
        {...defaultProps}
        searchQuery="rep"
        suggestions={suggestions}
        onSuggestionSelect={onSuggestionSelect}
      />,
    );

    await user.click(screen.getByRole('textbox', { name: 'Search by exact name' }));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('report.txt')).toBeInTheDocument();
    expect(screen.getByText('CloudStorage > Docs')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /report.txt/ }));

    expect(onSuggestionSelect).toHaveBeenCalledWith(suggestions[0]);
  });
});
