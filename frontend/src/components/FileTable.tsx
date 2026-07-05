import { ItemType, type FileItem } from '../types';
import { formatFilePath } from '../utils/filePath';
import { FileIcon, FolderIcon, TrashIcon } from './Icons';

type FileTableProps = {
  items: FileItem[];
  onDeleteRequest: (item: FileItem) => void;
  onOpenFolder: (item: FileItem) => void;
};

function FileTable({ items, onDeleteRequest, onOpenFolder }: FileTableProps) {
  return (
    <div className="file-table">
      <div className="table-row table-head">
        <div className="name-cell">
          Name
          <span className="sort-arrow">↓</span>
        </div>
        <div>Modified</div>
        <div>Actions</div>
      </div>

      {items.map((item) => {
        const filePath = formatFilePath(item);

        return (
          <div className="table-row" key={item.id}>
            <div className="name-cell item-name">
              {item.type === ItemType.Folder ? (
                <button className="item-open-button" type="button" onClick={() => onOpenFolder(item)}>
                  <FolderIcon />
                  <span>{item.name}</span>
                </button>
              ) : (
                <>
                  <FileIcon />
                  <span className="item-name-content">
                    <span>{item.name}</span>
                    {filePath && <span className="item-path">{filePath}</span>}
                  </span>
                </>
              )}
            </div>
            <div className="date-cell">{item.modified}</div>
            <div className="delete-cell">
              <button type="button" onClick={() => onDeleteRequest(item)} aria-label={`Delete ${item.name}`}>
                <TrashIcon />
              </button>
            </div>
          </div>
        );
      })}

      <div className="table-footer">Showing {items.length} items</div>
    </div>
  );
}

export default FileTable;
