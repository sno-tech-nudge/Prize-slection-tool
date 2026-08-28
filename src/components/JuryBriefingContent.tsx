import { Card } from '@/design-system';

const THRESHOLDS = [
  {
    title: 'soil health',
    points: ['double soil organic carbon levels', 'improve earthworm density by 2–3× and microbial activity ≥20%'],
  },
  {
    title: 'farmer income & adoption',
    points: ["increase farmers' net income by 25%", 'reduce chemical inputs by 70%'],
  },
];

const FUNNEL = [
  { n: '341', label: 'applications' },
  { n: '50', label: 'interviewed now', active: true },
  { n: '15', label: 'shortlist' },
  { n: '8', label: 'final cohort' },
];

const AGENDA = [
  { time: '0–2 min', label: 'intro & settling in' },
  { time: '2–12 min', label: 'organisation presentation' },
  { time: '12–42 min', label: 'jury Q&A (30 min)' },
  { time: '42–45 min', label: 'close' },
];

const GUIDELINES = [
  'review the synopsis and internal reviewer remarks for each assigned organisation beforehand. the remarks flag specific areas for further probing which you may draw on during your interview time.',
  'evaluate against the challenge, not legacy or adjacent work. the problem statement is the core of this process — assess organisations on their potential to meet and surpass it, not on the size or track record of the organisation itself. we are not simply looking for the biggest players with numbers already in hand, but for models with the potential to effect change at the India level.',
  'look for differentiators. keep a lens on organisations pushing the boundaries of the field, not just executing a known playbook well.',
  'time is held for both the presenter and the jury bench. the interview format allocates fixed time to presentation and to Q&A — please follow the time cues given by the the^delta team member facilitating the session, so every applicant gets a fair and consistent hearing.',
  'consult with fellow jurors before scoring. at the end of each interview, we encourage the jury to briefly discuss the organisation together before individually submitting scores.',
];

const GUIDELINES_FLAGGED = 'applicant materials, scores, and jury deliberations are confidential. please don’t share synopses, reviewer remarks, scores, or discussion outside the panel.';

const CLARIFICATIONS_FLAGGED =
  'this is a narrowing round, not a final decision. it narrows 50 organisations to 15, ahead of the final cohort of 8 — not the final cohort selection. deeper diligence (data quality, partnership scrutiny, on-ground fit) happens in later stages.';

const CLARIFICATIONS = [
  'model, not project. assess alignment with the problem statement, not deliverables or milestones.',
  "financials aren't an ask. they signal operating scale and how the grant would accelerate (not fund) the work but no commercials expected at this stage.",
  'no day-1 scale requirement. orgs start with ≥150 farmers for baselining and expand progressively.',
  'impact assessment is sample-based. assessments run on samples (~150–300 farmers for economics, ~50 farms for soil) — you may check the applicant’s monitoring approach supports this, not universal measurement.',
  'this accelerates existing work. the ₹30L support grant is results-based financing to accelerate existing programmes/teams/partnerships — not to fund a new pilot from scratch.',
  'technology is a plus, not mandatory. tech (soil testing, biologicals, advisory, remote sensing, etc.) can strengthen a bid but its absence shouldn’t count against an applicant.',
  'partnerships welcome, one lead accountable. partnership-led models are encouraged, but one eligible non-profit/CSO must be the accountable lead applicant.',
  'outcomes are a direction, not a guarantee. applicants aren’t expected to guarantee every outcome in 2 years — look for a promising model, credible science-based pathway, and ambition/capability to scale.',
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

/** The real jury briefing content — challenge statement, thresholds, timeline, guidelines, and
 *  clarifications — for the /jury-guidelines page. Static, hand-authored content (not an admin
 *  upload), rendered with this app's own design tokens rather than the original document's own
 *  styling, so it reads consistently with every other page a juror sees. */
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
        <SectionHeading>timeline</SectionHeading>
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

        <div style={{ fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--text-muted)', marginTop: 'var(--space-6)', marginBottom: 'var(--space-3)' }}>
          jury interview agenda
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-3)' }}>
          {AGENDA.map((a) => (
            <div key={a.time} style={{ border: '1px solid var(--border-subtle)', padding: 'var(--space-3)' }}>
              <div style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)' as unknown as number, color: 'var(--delta-red)', marginBottom: 'var(--space-1)' }}>{a.time}</div>
              <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)' }}>{a.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card accent>
        <SectionHeading>jury guidelines</SectionHeading>
        <PointList points={GUIDELINES} flagged={GUIDELINES_FLAGGED} />
      </Card>

      <Card accent>
        <SectionHeading>clarifications for the jury</SectionHeading>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 'var(--space-4)', background: 'var(--surface-canvas)', border: '1px solid var(--delta-red)', marginBottom: 'var(--space-3)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <span style={{ color: 'var(--delta-red)', flexShrink: 0 }}>·</span>
              <p style={{ margin: 0, fontSize: 'var(--fs-small)', color: 'var(--text-primary)', lineHeight: 'var(--lh-relaxed)' }}>{CLARIFICATIONS_FLAGGED}</p>
            </div>
          </div>
          <PointList points={CLARIFICATIONS} />
        </div>
      </Card>

      <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', textAlign: 'center' }}>confidential — for jury use only</p>
    </div>
  );
}
