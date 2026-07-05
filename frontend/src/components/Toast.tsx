import { useEffect } from 'react';
import './Toast.css';

type ToastProps = {
  message: string;
  onClose: () => void;
  type: 'success' | 'error';
};

function Toast({ message, onClose, type }: ToastProps) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onClose, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [message, onClose, type]);

  return (
    <div className={`toast toast-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Close notification">
        x
      </button>
    </div>
  );
}

export default Toast;
