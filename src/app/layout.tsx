import type { Metadata } from 'next';
import { ToastProvider } from '@/design-system';
import { THEME_BOOT_SCRIPT } from '@/lib/theme';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'the^delta prize',
  description: 'the^delta prize · rapid re.gen challenge application platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
