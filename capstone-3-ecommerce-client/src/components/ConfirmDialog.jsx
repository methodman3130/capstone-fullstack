import { useEffect } from 'react';
import { Button } from './ui';

/**
 * A custom dialog instead of window.confirm().
 * Native confirm() blocks the whole browser thread and cannot be styled.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onCancel();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
