'use client';
import React from 'react';
import { Toast, type ToastProps } from './Toast';

interface ToastEntry {
  id: number;
  status: ToastProps['status'];
  title: string;
  body?: string;
}

interface ToastContextValue {
  push: (title: string, body?: string, status?: ToastProps['status']) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// held fully visible, then fades out over FADE_MS before actually unmounting — a toast that's
// just wiped from the array with no transition reads as a glitch, not a "disappearing" popup.
const VISIBLE_MS = 2400;
const FADE_MS = 350;

function ToastItem({ entry, onDone }: { entry: ToastEntry; onDone: () => void }) {
  const [shown, setShown] = React.useState(false);

  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    const hide = setTimeout(() => setShown(false), VISIBLE_MS);
    const remove = setTimeout(onDone, VISIBLE_MS + FADE_MS);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(hide);
      clearTimeout(remove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(6px)',
        transition: `opacity ${FADE_MS}ms var(--ease-out), transform ${FADE_MS}ms var(--ease-out)`,
      }}
    >
      <Toast status={entry.status} title={entry.title} onClose={onDone}>
        {entry.body}
      </Toast>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastEntry[]>([]);

  const push = React.useCallback((title: string, body?: string, status: ToastProps['status'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, title, body, status }]);
  }, []);

  const remove = React.useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 'var(--space-6)',
          right: 'var(--space-6)',
          zIndex: 'var(--z-toast)' as unknown as number,
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} entry={t} onDone={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
