'use client';
import { useRouter } from 'next/navigation';
import { CompositeBadge } from '@/components/StatusBadges';
import { Badge } from '@/design-system';
import { OrgTitle } from '@/components/OrgTitle';

export interface InternalJuryRowData {
  id: string;
  orgName: string;
  bench: { name: string } | null;
  aiEvaluations: { composite: number }[];
  juryScores: { composite: number; verdict: string; juror: { name: string } }[];
}

function JurorCell({ score }: { score?: { composite: number; verdict: string; juror: { name: string } } }) {
  if (!score) return <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>—</span>;
  return (
    <div style={{ fontSize: 'var(--fs-small)' }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-caption)' }}>{score.juror.name}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <CompositeBadge score={score.composite} />
        <Badge tone="outline">{score.verdict.toLowerCase()}</Badge>
      </div>
    </div>
  );
}

/** Same trimmed table + double-click-to-open pattern as the jury member's own applications
 *  list — the internal team's jury dashboard is deliberately the same view, just across every
 *  bench, with "jury scores" showing the average and fixed J1/J2/J3 columns breaking out each
 *  individual juror's score without needing to open the row. */
export function InternalJuryRow({ app }: { app: InternalJuryRowData }) {
  const router = useRouter();
  const href = `/jury/${app.id}`;
  const intScore = app.aiEvaluations[0]?.composite;
  const avgJuryScore =
    app.juryScores.length > 0 ? Math.round(app.juryScores.reduce((sum, s) => sum + s.composite, 0) / app.juryScores.length) : null;

  return (
    <tr
      onMouseEnter={() => router.prefetch(href)}
      onDoubleClick={() => router.push(href)}
      style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
      title="double-click to open"
    >
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--fw-bold)' as unknown as number }}>
        <OrgTitle>{app.orgName}</OrgTitle>
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>{app.bench?.name ?? '—'}</td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        {intScore !== undefined ? <CompositeBadge score={intScore} /> : <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>—</span>}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        {avgJuryScore !== null ? <CompositeBadge score={avgJuryScore} /> : <Badge tone="yellow">no scores yet</Badge>}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <JurorCell score={app.juryScores[0]} />
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <JurorCell score={app.juryScores[1]} />
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        {app.juryScores.length > 3 ? (
          <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>+{app.juryScores.length - 2} more</span>
        ) : (
          <JurorCell score={app.juryScores[2]} />
        )}
      </td>
    </tr>
  );
}
