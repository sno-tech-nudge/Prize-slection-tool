import Link from 'next/link';
import { AngularBanner, Card, Badge, Button } from '@/design-system';

const THRESHOLDS = [
  {
    n: '01',
    title: 'soil health',
    body: 'improve the biological, physical and chemical components of soil health.',
  },
  {
    n: '02',
    title: 'ease of adoption',
    body: 'make regenerative practices simple for farmers to adopt and sustain.',
  },
  {
    n: '03',
    title: 'cost and yield',
    body: 'lower the cost of cultivation and improve yields.',
  },
  {
    n: '04',
    title: 'farmer incomes',
    body: 'improve farmer incomes by 25% or more.',
  },
  {
    n: '05',
    title: 'chemical reduction',
    body: 'reduce chemical use by 70%.',
  },
];

const TIMELINE = [
  { label: 'applications open', detail: 'rolling intake, screened on a cycle' },
  { label: 'screening & AI-assisted review', detail: 'eligibility, duplicates, rubric scoring' },
  { label: 'human review', detail: 'assigned evaluators score against the five thresholds' },
  { label: 'shortlist', detail: 'top cohort advances to jury review' },
  { label: 'jury & winners', detail: 'results-based financing for winning teams' },
];

export default function ChallengeLandingPage() {
  return (
    <div>
      <AngularBanner
        eyebrow="the^delta prize · rapid re.gen challenge"
        title="a challenge for india's smallholder farmers"
        subtitle="double soil organic carbon within 24 months and increase smallholder farmer net incomes by at least 25%, through tech-enabled, replicable transition models for regenerative agriculture. reaching 5,000 to 10,000 farmers across at least 5,000 hectares within a cluster."
        action={
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <Link href="/apply" style={{ textDecoration: 'none' }}>
              <Button variant="cta" size="lg">
                apply now
              </Button>
            </Link>
            <Link href="/status" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="lg">
                check status
              </Button>
            </Link>
          </div>
        }
      />

      <section style={{ padding: 'var(--space-16) var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
        <h2 style={{ fontSize: 'var(--fs-h2)', marginBottom: 'var(--space-3)' }}>the challenge thresholds</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-body-lg)', maxWidth: 640, marginBottom: 'var(--space-10)' }}>
          every application is measured against these five thresholds. sponsored by DCM Shriram.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-6)' }}>
          {THRESHOLDS.map((t) => (
            <Card key={t.n} accent accentSide="left">
              <Badge tone="outline">{t.n}</Badge>
              <h3 style={{ fontSize: 'var(--fs-h4)', margin: 'var(--space-4) 0 var(--space-2)' }}>{t.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-small)', lineHeight: 'var(--lh-relaxed)' }}>{t.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section style={{ padding: 'var(--space-16) var(--space-10)', background: 'var(--surface-canvas)' }}>
        <div style={{ maxWidth: 'var(--container-lg)', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'var(--fs-h2)', marginBottom: 'var(--space-8)' }}>from submission to decision</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {TIMELINE.map((step, i) => (
              <div key={step.label} style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'var(--fs-h3)', color: 'var(--delta-red)', width: 48 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <div style={{ fontWeight: 'var(--fw-bold)' as unknown as number, textTransform: 'lowercase' }}>{step.label}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-small)' }}>{step.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: 'var(--space-16) var(--space-10)', maxWidth: 'var(--container-lg)', margin: '0 auto' }}>
        <h2 style={{ fontSize: 'var(--fs-h2)', marginBottom: 'var(--space-6)' }}>talk to the team</h2>
        <div style={{ display: 'flex', gap: 'var(--space-10)', flexWrap: 'wrap' }}>
          <Card style={{ minWidth: 260 }}>
            <div style={{ fontWeight: 'var(--fw-bold)' as unknown as number }}>Nisha Chawla</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-small)' }}>the^delta prize team</div>
          </Card>
          <Card style={{ minWidth: 260 }}>
            <div style={{ fontWeight: 'var(--fw-bold)' as unknown as number }}>Sravya Jandhyala</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-small)' }}>the^delta prize team</div>
          </Card>
        </div>
      </section>
    </div>
  );
}
