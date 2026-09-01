import { Card } from '@/design-system';

const THRESHOLDS = [
  {
    title: 'soil health',
    points: ['improve SOC by ≥0.3 pp and restore N:P:K balance to optimal levels', 'improve earthworm density by 2–3× and microbial activity ≥20%'],
  },
  {
    title: 'farmer income & adoption',
    points: ["increase farmers' net income by 25%", 'reduce chemical inputs by 70%'],
  },
];

const FUNNEL = [
  { n: '341', label: 'applications' },
  { n: '50', label: 'jury round', active: true },
  { n: '15', label: 'field evaluations' },
  { n: '8', label: 'cohort' },
];

const AGENDA = [
  { time: '0–2 min', label: 'intro & settling in' },
  { time: '2–12 min', label: 'organisation presentation' },
  { time: '12–45 min', label: 'jury Q&A' },
  { time: '+10 min', label: 'post-interview discussion & scoring', plus: true },
];

const GUIDELINES = [
  'review the synopsis and internal remarks for each assigned organisation beforehand. the remarks flag specific areas for further probing which you may draw on during your interview time.',
  'evaluate against the challenge, not legacy or adjacent work. the problem statement is the core of this process — assess organisations on their potential to meet and surpass it, not on the size or track record of the organisation itself. we are not simply looking for the biggest players with numbers already in hand, but for models with the potential to effect change at the India level.',
  'look for differentiators. keep a lens on organisations pushing the boundaries of the field, not just executing a known playbook well.',
];

const GUIDELINES_FLAGGED = 'applicant materials, scores, and jury deliberations are confidential. please don’t share synopses, reviewer remarks, scores, or discussion outside the panel.';

const FIT_TEST = [
  'proposing to work in geographies with average SOC of 0.3 pp or below',
  'working with smallholder farmers (SHFs)',
  'working across crops grown at scale in India',
  'clear that this is a competition — a prize — and not a project proposal',
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>{children}</h2>;
}

function PointList({ points, flagged }: { points: string[]; flagged?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {points.map((p, i) => (
        <div
          key={p}
          style={{
            display: 'flex',
            gap: 'var(--space-3)',
            padding: 'var(--space-3) 0',
            borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ color: 'var(--delta-red)', flexShrink: 0 }}>·</span>
          <p style={{ margin: 0, fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)' }}>{p}</p>
        </div>
      ))}
      {flagged && (
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-3)',
            padding: 'var(--space-4)',
            background: 'var(--surface-canvas)',
            border: '1px solid var(--delta-red)',
          }}
        >
          <span style={{ color: 'var(--delta-red)', flexShrink: 0 }}>·</span>
          <p style={{ margin: 0, fontSize: 'var(--fs-small)', color: 'var(--text-primary)', lineHeight: 'var(--lh-relaxed)' }}>{flagged}</p>
        </div>
      )}
    </div>
  );
}

/** The real jury briefing content — challenge statement, thresholds, selection process/interview
 *  agenda, the jury guide, and a quick contextual-fit check — for the /jury-guide page.
 *  Static, hand-authored content (not an admin upload), rendered with this app's own design
 *  tokens rather than the original document's own styling, so it reads consistently with every
 *  other page a juror sees. */
export function JuryBriefingContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <Card accent>
        <SectionHeading>the challenge statement</SectionHeading>
        <p style={{ margin: 0, fontSize: 'var(--fs-h4)', fontWeight: 'var(--fw-semibold)' as unknown as number, color: 'var(--text-primary)', lineHeight: 'var(--lh-relaxed)' }}>
          double soil organic carbon within 24 months and increase smallholder farmer net incomes by at least 25%, through
          tech-enabled, replicable regenerative transition models reaching 5,000–10,000 farmers across ≥5,000 hectares.
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-2) var(--space-5)',
            marginTop: 'var(--space-4)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: 'var(--fs-small)',
            color: 'var(--text-secondary)',
          }}
        >
          <span>impact cluster: <strong style={{ color: 'var(--text-primary)' }}>2–5 contiguous blocks</strong> within a district</span>
          <span>eligible: <strong style={{ color: 'var(--text-primary)' }}>non-profits, CSOs, FPOs</strong></span>
          <span>prize purse: <strong style={{ color: 'var(--text-primary)' }}>INR 6.5 Cr</strong></span>
        </div>
      </Card>

      <Card accent>
        <SectionHeading>challenge thresholds</SectionHeading>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          {THRESHOLDS.map((t) => (
            <div key={t.title} style={{ border: '1px solid var(--border-subtle)', padding: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--delta-red)', marginBottom: 'var(--space-2)', fontWeight: 'var(--fw-bold)' as unknown as number }}>
                {t.title}
              </div>
              <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)' }}>
                {t.points.map((p) => (
                  <li key={p} style={{ marginBottom: 'var(--space-1)' }}>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <Card accent>
        <SectionHeading>selection process</SectionHeading>
        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)', marginTop: 0 }}>
          341 applications were received. this round interviews the top 50 shortlisted organisations, narrowing to a top 15
          who advance toward the final cohort of 8.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          {FUNNEL.map((stage, i) => (
            <div key={stage.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              {i > 0 && <span style={{ color: 'var(--text-muted)' }}>→</span>}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 'var(--space-2)',
                  padding: stage.active ? 'var(--space-2) var(--space-3)' : 0,
                  border: stage.active ? '1px solid var(--delta-red)' : 'none',
                }}
              >
                <strong style={{ fontSize: 'var(--fs-h4)', color: stage.active ? 'var(--delta-red)' : 'var(--text-primary)' }}>{stage.n}</strong>
                <span style={{ fontSize: 'var(--fs-caption)', color: stage.active ? 'var(--delta-red)' : 'var(--text-muted)', fontWeight: 'var(--fw-semibold)' as unknown as number }}>
                  {stage.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--text-muted)', marginTop: 'var(--space-6)', marginBottom: 'var(--space-1)' }}>
          jury interview agenda
        </div>
        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)', margin: '0 0 var(--space-3)' }}>
          45 minutes per organisation, followed by 10 minutes for the jury to discuss and score.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
          {AGENDA.map((a) => (
            <div
              key={a.time}
              style={{
                border: a.plus ? '1px dashed var(--border-strong)' : '1px solid var(--border-subtle)',
                background: a.plus ? 'var(--surface-canvas)' : 'transparent',
                padding: 'var(--space-3)',
              }}
            >
              <div style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)' as unknown as number, color: a.plus ? 'var(--text-secondary)' : 'var(--delta-red)', marginBottom: 'var(--space-1)' }}>
                {a.time}
              </div>
              <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)' }}>{a.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card accent>
        <SectionHeading>jury guide</SectionHeading>
        <PointList points={GUIDELINES} flagged={GUIDELINES_FLAGGED} />
      </Card>

      <Card accent>
        <SectionHeading>a quick check</SectionHeading>
        <div style={{ border: '1px solid var(--border-subtle)', padding: 'var(--space-4)' }}>
          <div style={{ fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--delta-red)', marginBottom: 'var(--space-2)', fontWeight: 'var(--fw-bold)' as unknown as number }}>
            contextual fit test
          </div>
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', margin: '0 0 var(--space-3)' }}>
            a simple test you can run with each organisation — are they:
          </p>
          <ol style={{ margin: 0, paddingLeft: 'var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)' }}>
            {FIT_TEST.map((p) => (
              <li key={p} style={{ marginBottom: 'var(--space-1)' }}>
                {p}
              </li>
            ))}
          </ol>
        </div>
      </Card>

      <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', textAlign: 'center' }}>confidential — for jury use only</p>
    </div>
  );
}
