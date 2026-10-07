'use client';
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/design-system';
import { applyTheme, readTheme, saveTheme, type Theme } from '@/lib/theme';

/** Light / dark switch. The icon shows the mode you are in right now: a sun in light mode, a moon
 *  in dark mode. The choice is remembered in this browser only (localStorage). */
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

  return (
    <Button
      variant="secondary"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'dark mode on, switch to light mode' : 'light mode on, switch to dark mode'}
      title={theme === 'dark' ? 'switch to light mode' : 'switch to dark mode'}
    >
      <Icon size={16} strokeLinejoin="miter" strokeLinecap="square" />
      {theme === 'dark' ? 'dark mode' : 'light mode'}
    </Button>
  );
}
