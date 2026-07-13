/* the^delta collateral kit — reusable creative templates.
   Text is live (edit freely); photos are drop-in <image-slot>s. */
const { Logo, Button } = window.TheDeltaDesignSystem_88b8ab;

/* 1 — Impact social post (square). White caret top-right, B&W photo,
   headline with an Argent-italic emphasis word. */
function ImpactPost() {
  return (
    <div style={{ position: 'relative', width: 480, height: 480, background: 'var(--delta-charcoal)', overflow: 'hidden' }}>
      <image-slot id="post-impact" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        shape="rect" fit="cover" placeholder="drop a B&W photo"></image-slot>
      <div style={{ position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, rgba(26,29,30,0.75) 0%, rgba(26,29,30,0.15) 60%, rgba(26,29,30,0) 100%)' }} />
      <div style={{ position: 'absolute', top: 22, right: 22 }}>
        <Logo variant="mark" tone="light" size={40} />
      </div>
      <div style={{ position: 'absolute', left: 32, bottom: 40, color: '#fff', maxWidth: 300 }}>
        <div style={{ fontWeight: 300, fontSize: 22, lineHeight: 1.2 }}>transform your ideas into</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 600,
          fontSize: 68, lineHeight: 1 }}>impact</div>
      </div>
    </div>
  );
}

/* 2 — Testimonial card (square). */
function TestimonialCard() {
  return (
    <div style={{ width: 480, height: 480, background: 'var(--surface-canvas)',
      display: 'flex', flexDirection: 'column' }}>
      <div style={{ textAlign: 'center', padding: '22px 0 16px' }}>
        <Logo size={22} program="incubator" />
      </div>
      <div style={{ flex: 1, display: 'flex', gap: 18, padding: '0 26px' }}>
        <div style={{ flex: 1.2 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, color: 'var(--delta-yellow)',
            fontSize: 56, lineHeight: 0.5, height: 26 }}>&ldquo;</div>
          <div style={{ fontWeight: 700, fontSize: 30, textTransform: 'lowercase', color: 'var(--delta-red)',
            marginTop: 10 }}>sonali saini</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 16,
            color: 'var(--text-secondary)' }}>Founder, Sol's ARC</div>
          <p style={{ marginTop: 12, fontWeight: 300, fontSize: 13.5, lineHeight: 1.55,
            color: 'var(--text-primary)' }}>
            the^delta incubator was a game-changer — strategic guidance, mentorship and ecosystem
            support to scale our impact and strengthen our model.
          </p>
        </div>
        <image-slot id="post-portrait" style={{ width: 150, alignSelf: 'flex-end', height: 300 }}
          shape="rect" fit="cover" src="../../assets/imagery/portrait-sonali-bw.png"></image-slot>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 26px', borderTop: '1px solid var(--border-subtle)' }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 17,
          color: 'var(--text-primary)' }}>transform your ideas into impact</span>
        <span style={{ background: 'var(--delta-red)', color: '#fff', fontWeight: 700, fontSize: 12,
          letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 14px' }}>apply now</span>
      </div>
    </div>
  );
}

/* 3 — Program web banner (wide). */
function ProgramBanner() {
  return (
    <div style={{ position: 'relative', width: 900, height: 320, background: '#fff', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0,
        borderTop: '90px solid var(--delta-red)', borderRight: '90px solid transparent' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 0, height: 0,
        borderBottom: '320px solid var(--delta-red)', borderLeft: '150px solid transparent' }} />
      <image-slot id="banner-group" style={{ position: 'absolute', right: 40, bottom: 0, width: 360, height: 250 }}
        shape="rect" fit="cover" placeholder="drop a B&W group photo"></image-slot>
      <div style={{ position: 'absolute', left: 44, top: 54 }}>
        <div style={{ fontWeight: 700, fontSize: 44, textTransform: 'lowercase', letterSpacing: '-0.01em' }}>
          the<span style={{ color: 'var(--delta-red)' }}>^</span>delta
          <span style={{ color: 'var(--text-secondary)', fontWeight: 300 }}> incubator</span>
        </div>
        <div style={{ marginTop: 8, fontWeight: 300, fontSize: 18, color: 'var(--text-secondary)' }}>
          registration now open for 2025 cohort</div>
        <div style={{ marginTop: 44, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 600,
            fontSize: 30, color: 'var(--delta-red)' }}>apply now</span>
          <span style={{ width: 0, height: 0, borderLeft: '14px solid var(--delta-red)',
            borderTop: '9px solid transparent', borderBottom: '9px solid transparent' }} />
        </div>
      </div>
    </div>
  );
}

function Gallery() {
  const label = (t) => (
    <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
      color: 'var(--text-muted)', marginBottom: 12 }}>{t}</div>
  );
  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 32px 80px' }}>
      <h1 style={{ fontWeight: 700, fontSize: 34, textTransform: 'lowercase', margin: '0 0 4px' }}>collateral templates</h1>
      <p style={{ fontWeight: 300, color: 'var(--text-secondary)', margin: '0 0 36px', fontSize: 16 }}>
        editable text · drop your own black-and-white photography.</p>
      <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>{label('social post · square')}<ImpactPost /></div>
        <div>{label('testimonial · square')}<TestimonialCard /></div>
      </div>
      <div style={{ marginTop: 44 }}>{label('program banner · wide')}<ProgramBanner /></div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Gallery />);
