import Link from 'next/link';
import { Logo, Button } from '@/design-system';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          rowGap: 'var(--space-3)',
          padding: 'var(--space-5) var(--space-6)',
          background: 'var(--surface-card)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <Link href="/challenge" style={{ textDecoration: 'none' }}>
          <Logo program="prize" size={26} />
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
          <Link
            href="/status"
            style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            check status
          </Link>
          <Link href="/apply" style={{ textDecoration: 'none' }}>
            <Button variant="cta" size="sm">
              apply now
            </Button>
          </Link>
          <Link
            href="/dashboard"
            style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            team platform →
          </Link>
        </nav>
      </header>
      <main style={{ flex: 1 }}>{children}</main>
      <footer
        style={{
          padding: 'var(--space-8) var(--space-6)',
          background: 'var(--surface-ink)',
          color: 'var(--text-inverse)',
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          fontSize: 'var(--fs-small)',
        }}
      >
        <Logo tone="light" size={20} />
        <span style={{ color: 'rgba(255,255,255,0.7)' }}>a the/nudge institute initiative</span>
      </footer>
    </div>
  );
}
