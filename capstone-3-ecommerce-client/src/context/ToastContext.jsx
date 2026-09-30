import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message, type = 'info') => {
      const id = nextId++;
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const toast = {
    success: (m) => push(m, 'success'),
    error: (m) => push(m, 'error'),
    info: (m) => push(m, 'info'),
  };

  const styles = {
    success: 'bg-emerald-600',
    error: 'bg-rose-600',
    info: 'bg-slate-800',
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`${styles[t.type]} flex max-w-sm items-start gap-3 rounded-lg px-4 py-3 text-sm text-white shadow-lg`}
          >
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-white/70 hover:text-white"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside a ToastProvider');
  return ctx;
}
