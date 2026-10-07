export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'delta-theme';

// the internal app only — the public pages (apply, challenge, status) and the login screen stay on
// the light brand look no matter what's stored.
const INTERNAL_PATH = /^\/(dashboard|applications|outreach|targets|settings|review|jury|jury-guide|analytics)(\/|$)/;

export function readTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // private mode / blocked storage — the choice just won't survive a reload
  }
}

export function applyTheme(theme: Theme) {
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
  else document.documentElement.removeAttribute('data-theme');
}

/** Runs in <head> before first paint so a stored dark choice never flashes light first. */
export const THEME_BOOT_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})==="dark"&&${INTERNAL_PATH.toString()}.test(location.pathname))document.documentElement.setAttribute("data-theme","dark")}catch(e){}`;
