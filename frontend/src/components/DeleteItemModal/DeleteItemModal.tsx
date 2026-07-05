import type { FileItem } from '../../types';
import '../CreateItemModal/CreateItemModal.css';

type DeleteItemModalProps = {
  item: FileItem | null;
  onClose: () => void;
  onDelete: (itemId: number) => Promise<void> | void;
};

function DeleteItemModal({ item, onClose, onDelete }: DeleteItemModalProps) {
  if (!item) {
    return null;
  }

  const handleDelete = async () => {
    try {
      await onDelete(item.id);
      onClose();
    } catch {
      // The file browser shows delete failures in a toast.
    }
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="create-modal" aria-labelledby="delete-modal-title" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 id="delete-modal-title">Delete item</h2>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close modal">
            x
          </button>
        </div>

        <div className="modal-body">
          <p>Are you sure you want to delete this item?</p>
          <strong>{item.name}</strong>

          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="danger-button" type="button" onClick={handleDelete}>
              Delete
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DeleteItemModal;
