/* the^delta website — Programs listing screen. */
const { Tabs, Card, Badge, Button } = window.TheDeltaDesignSystem_88b8ab;

function Programs({ onNav }) {
  const [tab, setTab] = React.useState('all');
  const rows = [
    { name: 'incubator', stage: 'idea → early stage', dur: '6 months', mode: 'hybrid', tag: 'applications open' },
    { name: 'accelerator', stage: 'early → scaling', dur: '4 months', mode: 'in-person', tag: 'applications open' },
    { name: 'prize', stage: 'recognition', dur: 'annual', mode: 'remote', tag: 'nominations soon' },
  ];
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 32px 96px' }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: 'var(--delta-red)' }}>our programs</div>
      <h1 style={{ margin: '10px 0 0', fontWeight: 700, fontSize: 44, textTransform: 'lowercase',
        letterSpacing: '-0.01em' }}>find the programme that fits your stage</h1>
      <p style={{ marginTop: 12, fontWeight: 300, fontSize: 18, color: 'var(--text-secondary)', maxWidth: 620 }}>
        every the^delta programme pairs deep, practical support with an ecosystem of mentors, partners and funders.
      </p>

      <div style={{ marginTop: 32 }}>
        <Tabs value={tab} onChange={setTab} items={[
          { id: 'all', label: 'all' }, { id: 'open', label: 'open now' }, { id: 'upcoming', label: 'upcoming' },
        ]} />
      </div>

      <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {rows.map((r) => (
          <Card key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 24, textTransform: 'lowercase' }}>
                  the<span style={{color:'var(--delta-red)'}}>^</span>delta {r.name}</div>
                <Badge tone={r.tag==='applications open'?'red':'neutral'}>{r.tag}</Badge>
              </div>
              <div style={{ marginTop: 6, fontWeight: 300, color: 'var(--text-secondary)', fontSize: 15 }}>
                {r.stage} · {r.dur} · {r.mode}</div>
            </div>
            <Button variant="secondary" size="sm" onClick={()=>onNav('apply')}>apply</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

window.Programs = Programs;
