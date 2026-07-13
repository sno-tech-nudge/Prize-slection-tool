/* the^delta website — Application form screen. */
const { Input, Textarea, Select, Checkbox, Radio, Button, Card, Toast } = window.TheDeltaDesignSystem_88b8ab;

function Apply({ onNav }) {
  const [sent, setSent] = React.useState(false);
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 32px 96px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: 'var(--delta-red)' }}>2025 cohort · incubator</div>
      <h1 style={{ margin: '10px 0 0', fontWeight: 700, fontSize: 40, textTransform: 'lowercase' }}>
        tell us about your venture</h1>
      <p style={{ marginTop: 10, fontWeight: 300, fontSize: 17, color: 'var(--text-secondary)' }}>
        it takes about ten minutes. we read every application.</p>

      {sent && (
        <div style={{ marginTop: 24 }}>
          <Toast status="success" title="application received" onClose={()=>setSent(false)}>
            thank you — we'll be in touch within two weeks.
          </Toast>
        </div>
      )}

      <Card style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Input label="your name" placeholder="e.g. asha mehta" />
          <Input label="email" placeholder="you@venture.in" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Input label="venture name" placeholder="what are you building?" />
          <Select label="sector">
            <option>livelihoods</option><option>education</option>
            <option>health</option><option>climate</option><option>financial inclusion</option>
          </Select>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>what stage are you at?</div>
          <Radio name="stage" defaultValue="idea" options={[
            { value: 'idea', label: 'just an idea' },
            { value: 'early', label: 'early stage — first users' },
            { value: 'scaling', label: 'scaling — proven model' },
          ]} />
        </div>
        <Textarea label="the change you want to make" rows={4}
          placeholder="describe the problem and your solution in a few sentences…" />
        <Checkbox label="I agree to the^delta's terms and privacy policy" />
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="cta" onClick={()=>setSent(true)}>submit application</Button>
          <Button variant="ghost" onClick={()=>onNav('home')}>save & exit</Button>
        </div>
      </Card>
    </div>
  );
}

window.Apply = Apply;
