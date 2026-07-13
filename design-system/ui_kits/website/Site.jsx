/* the^delta website — shared chrome: top nav + footer.
   Exposes Nav, Footer on window for the other kit scripts. */
const { Logo, Button } = window.TheDeltaDesignSystem_88b8ab;

function Nav({ route, onNav }) {
  const items = [
    { id: 'home', label: 'home' },
    { id: 'programs', label: 'programs' },
    { id: 'stories', label: 'stories' },
    { id: 'apply', label: 'apply' },
  ];
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100, background: 'var(--surface-card)',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '18px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="#" onClick={(e)=>{e.preventDefault();onNav('home');}} style={{ textDecoration: 'none' }}>
          <Logo size={26} />
        </a>
        <nav style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {items.slice(0,3).map((it) => (
            <a key={it.id} href="#" onClick={(e)=>{e.preventDefault();onNav(it.id);}}
              style={{
                textDecoration: 'none', textTransform: 'lowercase',
                fontFamily: 'var(--font-sans)', fontWeight: route===it.id?700:600,
                fontSize: 15, color: route===it.id ? 'var(--delta-red)' : 'var(--text-secondary)',
              }}>{it.label}</a>
          ))}
          <Button size="sm" onClick={()=>onNav('apply')}>apply now</Button>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  const cols = [
    { h: 'programs', links: ['incubator', 'accelerator', 'prize'] },
    { h: 'ecosystem', links: ['mentors', 'partners', 'funders'] },
    { h: 'about', links: ['our mission', 'team', 'contact'] },
  ];
  return (
    <footer style={{ background: 'var(--surface-ink)', color: 'var(--text-inverse)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 32px 40px',
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40 }}>
        <div>
          <Logo size={28} tone="light" />
          <p style={{ marginTop: 16, maxWidth: 300, fontWeight: 300, lineHeight: 1.6,
            color: 'rgba(255,255,255,0.7)', fontSize: 15 }}>
            a platform and social ecosystem to turn passion into purpose — and ideas into lasting impact.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.h}>
            <div style={{ textTransform: 'uppercase', letterSpacing: '0.08em',
              fontSize: 12, fontWeight: 700, color: 'var(--delta-yellow)', marginBottom: 14 }}>{c.h}</div>
            {c.links.map((l) => (
              <a key={l} href="#" onClick={(e)=>e.preventDefault()} style={{ display: 'block', textDecoration: 'none',
                color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: 300, padding: '5px 0',
                textTransform: 'lowercase' }}>{l}</a>
            ))}
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)',
        padding: '20px 32px', maxWidth: 1200, margin: '0 auto',
        display: 'flex', justifyContent: 'space-between',
        fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
        <span>© 2025 the^delta · a the/nudge initiative</span>
        <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>transform your ideas into impact</span>
      </div>
    </footer>
  );
}

window.Nav = Nav;
window.Footer = Footer;
