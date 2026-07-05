import { FilePlusIcon, FolderPlusIcon } from '../Icons';
import { SearchScope, type BreadcrumbItem } from '../../types';
import { formatBreadcrumbPath } from '../../utils/filePath';

type FilePageHeaderProps = {
  activeSearchQuery: string;
  breadcrumbs: BreadcrumbItem[];
  canGoBack: boolean;
  canGoForward: boolean;
  isSearchActive: boolean;
  searchScope: SearchScope;
  onBack: () => void;
  onForward: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
};

function FilePageHeader({
  activeSearchQuery,
  breadcrumbs,
  canGoBack,
  canGoForward,
  isSearchActive,
  searchScope,
  onBack,
  onForward,
  onNewFile,
  onNewFolder,
}: FilePageHeaderProps) {
  const currentFolderName = breadcrumbs.at(-1)?.name;
  const currentPath = formatBreadcrumbPath(breadcrumbs);
  const searchContext =
    searchScope === SearchScope.AllFiles
      ? 'Searching all files from CloudStorage'
      : `Searching this folder: ${currentPath}`;

  return (
    <div className="page-header">
      <div>
        <h1>{isSearchActive ? `Search results for "${activeSearchQuery}"` : currentFolderName ?? 'All Files'}</h1>
        <div className="folder-navigation">
          <div className="navigation-controls" aria-label="Folder navigation">
            <button type="button" onClick={onBack} disabled={!canGoBack} aria-label="Go back">
              &larr;
            </button>
            <button type="button" onClick={onForward} disabled={!canGoForward} aria-label="Go forward">
              &rarr;
            </button>
          </div>

          {isSearchActive ? (
            <p className="search-context">{searchContext}</p>
          ) : (
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <span>CloudStorage</span>
              {breadcrumbs.map((item) => (
                <span className="breadcrumb-item" key={item.id}>
                  <span className="separator">›</span>
                  <span>{item.name}</span>
                </span>
              ))}
            </nav>
          )}
        </div>
      </div>

      <div className="actions">
        <button type="button" onClick={onNewFolder}>
          <FolderPlusIcon />
          New Folder
        </button>
        <button type="button" onClick={onNewFile}>
          <FilePlusIcon />
          New File
        </button>
      </div>
    </div>
  );
}

export default FilePageHeader;
