import { useFileBrowser } from '../../hooks/useFileBrowser';
import CreateItemModal from '../CreateItemModal';
import DeleteItemModal from '../DeleteItemModal';
import FilePageHeader from '../FilePageHeader';
import FileTable from '../FileTable';
import Header from '../Header';
import Toast from '../Toast';

function FileBrowser() {
  const {
    activeSearchQuery,
    breadcrumbs,
    canGoBack,
    canGoForward,
    error,
    isSearchActive,
    isLoading,
    items,
    itemToDelete,
    modalType,
    searchQuery,
    searchScope,
    suggestions,
    toast,
    closeCreateModal,
    closeDeleteModal,
    closeToast,
    createItem,
    deleteItem,
    goBack,
    goForward,
    openCreateFileModal,
    openCreateFolderModal,
    openFolder,
    requestDelete,
    searchFiles,
    selectSearchSuggestion,
    updateSearchQuery,
    updateSearchScope,
  } = useFileBrowser();

  return (
    <section className="workspace" aria-label="CloudStorage file browser">
      <Header
        searchQuery={searchQuery}
        searchScope={searchScope}
        suggestions={suggestions}
        onSearchQueryChange={updateSearchQuery}
        onSearchScopeChange={updateSearchScope}
        onSearchSubmit={searchFiles}
        onSuggestionSelect={selectSearchSuggestion}
      />

      <section className="content">
        <FilePageHeader
          activeSearchQuery={activeSearchQuery}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          breadcrumbs={breadcrumbs}
          isSearchActive={isSearchActive}
          searchScope={searchScope}
          onBack={goBack}
          onForward={goForward}
          onNewFile={openCreateFileModal}
          onNewFolder={openCreateFolderModal}
        />
        {error && <p className="browser-error">{error}</p>}
        {isLoading && <p className="browser-status">Loading files...</p>}
        <FileTable items={items} onDeleteRequest={requestDelete} onOpenFolder={openFolder} />
      </section>

      <CreateItemModal itemType={modalType} onClose={closeCreateModal} onCreate={createItem} />
      <DeleteItemModal item={itemToDelete} onClose={closeDeleteModal} onDelete={deleteItem} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </section>
  );
}

export default FileBrowser;
