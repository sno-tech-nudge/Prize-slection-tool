/* the^delta website — Home screen. */
const { AngularBanner, Button, Card, Badge, Quote, Tag } = window.TheDeltaDesignSystem_88b8ab;

function Stat({ value, label }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 800, fontSize: 48,
        lineHeight: 1, color: 'var(--delta-red)' }}>{value}</div>
      <div style={{ marginTop: 8, fontWeight: 300, fontSize: 15, color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  );
}

function ProgramCard({ name, blurb, tag }) {
  return (
    <Card accent style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Badge tone="outline">{tag}</Badge>
      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 22,
        textTransform: 'lowercase' }}>the<span style={{color:'var(--delta-red)'}}>^</span>delta {name}</div>
      <p style={{ margin: 0, fontWeight: 300, fontSize: 15, lineHeight: 1.6,
        color: 'var(--text-secondary)' }}>{blurb}</p>
      <a href="#" onClick={(e)=>e.preventDefault()} style={{ marginTop: 'auto', textDecoration: 'none',
        color: 'var(--delta-red)', fontWeight: 700, fontSize: 14, textTransform: 'lowercase' }}>learn more →</a>
    </Card>
  );
}

function Home({ onNav }) {
  return (
    <div>
      <AngularBanner
        eyebrow="registration now open · 2025 cohort"
        title="transform your ideas into impact"
        subtitle="the^delta is the platform and social ecosystem where changemakers learn, collaborate and build the networks that turn passion into purpose."
        action={<div style={{ display:'flex', gap:12 }}>
          <Button variant="cta" onClick={()=>onNav('apply')}>apply now</Button>
          <Button variant="secondary" onClick={()=>onNav('programs')}>explore programs</Button>
        </div>}
        style={{ padding: '96px 32px' }}
      >
        <div style={{ maxWidth: 640 }} />
      </AngularBanner>

      {/* Stats */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 32px',
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32 }}>
        <Stat value="480+" label="ventures supported" />
        <Stat value="₹120cr" label="capital unlocked" />
        <Stat value="26" label="states reached" />
        <Stat value="9M" label="lives touched" />
      </section>

      {/* Programs */}
      <section style={{ background: 'var(--surface-canvas)', padding: '72px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
          <h2 style={{ margin: 0, fontWeight: 700, fontSize: 32, textTransform: 'lowercase',
            letterSpacing: '-0.01em' }}>three ways we accelerate change</h2>
          <p style={{ marginTop: 8, fontWeight: 300, fontSize: 18, color: 'var(--text-secondary)' }}>
            pick the stage that meets your venture where it is.</p>
          <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            <ProgramCard name="incubator" tag="idea → early stage"
              blurb="structured guidance, mentorship and ecosystem support to shape an idea into a fundable, scalable venture." />
            <ProgramCard name="accelerator" tag="early → scaling"
              blurb="intensive, cohort-based support to sharpen your model and unlock the capital and partnerships to grow." />
            <ProgramCard name="prize" tag="recognition"
              blurb="catalytic, unrestricted funding that celebrates and amplifies the boldest solutions to social problems." />
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 32px' }}>
        <Quote
          quote="the^delta incubator was a game-changer — it gave us the strategic guidance, mentorship and ecosystem support to scale our impact and strengthen our model for young people with disabilities."
          name="sonali saini"
          role="Founder, Sol's ARC"
          portrait="../../assets/imagery/portrait-sonali-bw.png"
        />
      </section>

      {/* CTA strip */}
      <section style={{ background: 'var(--surface-ink)', color: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontWeight: 700, fontSize: 30, textTransform: 'lowercase' }}>
              ready to build the delta?</h2>
            <p style={{ margin: '8px 0 0', fontWeight: 300, fontSize: 17, color: 'rgba(255,255,255,0.75)' }}>
              applications for the 2025 cohort close 31 march.</p>
          </div>
          <Button variant="cta" onClick={()=>onNav('apply')}>apply now</Button>
        </div>
      </section>
    </div>
  );
}

window.Home = Home;
