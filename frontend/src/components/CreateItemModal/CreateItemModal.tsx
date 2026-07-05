import { FormEvent, useEffect, useState } from 'react';
import { ItemType } from '../../types';
import './CreateItemModal.css';

type CreateItemModalProps = {
  itemType: ItemType | null;
  onClose: () => void;
  onCreate: (name: string, type: ItemType) => Promise<void> | void;
};

function CreateItemModal({ itemType, onClose, onCreate }: CreateItemModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (itemType) {
      setName('');
      setError('');
    }
  }, [itemType]);

  if (!itemType) {
    return null;
  }

  const label = itemType === ItemType.Folder ? ItemType.Folder : ItemType.File;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    try {
      await onCreate(trimmedName, itemType);
      onClose();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create item');
    }
  };

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="create-modal" aria-labelledby="create-modal-title" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 id="create-modal-title">Create {label}</h2>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Close modal">
            x
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label htmlFor="item-name">{itemType === ItemType.Folder ? 'Folder' : 'File'} name</label>
          <input
            autoFocus
            id="item-name"
            onChange={(event) => {
              setName(event.target.value);
              setError('');
            }}
            placeholder={itemType === ItemType.Folder ? 'New Folder' : 'new-file.docx'}
            type="text"
            value={name}
          />
          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" disabled={!name.trim()} type="submit">
              Create
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default CreateItemModal;
