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

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastEntry[]>([]);

  const push = React.useCallback((title: string, body?: string, status: ToastProps['status'] = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, title, body, status }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
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
          <Toast key={t.id} status={t.status} title={t.title} onClose={() => setToasts((cur) => cur.filter((x) => x.id !== t.id))}>
            {t.body}
          </Toast>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
