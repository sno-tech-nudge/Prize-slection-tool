'use client';
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { applyTheme, readTheme, saveTheme, type Theme } from '@/lib/theme';

/** Nav-bar light / dark switch. The icon shows the mode you are in right now: a sun in light mode,
 *  a moon in dark mode. The choice is remembered in this browser only (localStorage). */
export function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>('light');

  React.useEffect(() => {
    setTheme(readTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    saveTheme(next);
    applyTheme(next);
  }

  const Icon = theme === 'dark' ? Moon : Sun;
  const label = theme === 'dark' ? 'dark mode on, switch to light mode' : 'light mode on, switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--text-secondary)',
        padding: 'var(--space-1)',
        flexShrink: 0,
      }}
    >
      <Icon size={18} strokeLinejoin="miter" strokeLinecap="square" />
    </button>
  );
}
