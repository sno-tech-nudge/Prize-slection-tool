'use client';
import { useRouter } from 'next/navigation';
import { CompositeBadge } from '@/components/StatusBadges';
import { Badge } from '@/design-system';
import { OrgTitle } from '@/components/OrgTitle';

export interface InternalJuryRowData {
  id: string;
  orgName: string;
  bench: { name: string } | null;
  statesOperating: string | null;
  aiEvaluations: { composite: number }[];
  juryScores: { composite: number }[];
}

/** Same trimmed table + double-click-to-open pattern as the jury member's own applications
 *  list — the internal team's jury dashboard is deliberately the same view, just across every
 *  bench, with one column per juror (j1, j2, …) so progress is visible without opening each
 *  application; the full per-criterion breakdown still lives on the detail page's jury score card.
 *  `jurorColumnCount` is the max juror count across the whole filtered list, computed by the
 *  parent, so every row renders the same number of columns even if this application has fewer
 *  scores in so far. */
export function InternalJuryRow({ app, jurorColumnCount }: { app: InternalJuryRowData; jurorColumnCount: number }) {
  const router = useRouter();
  const href = `/jury/${app.id}`;
  const intScore = app.aiEvaluations[0]?.composite;
  const state = app.statesOperating?.split(';').filter(Boolean)[0];
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
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>{state ?? '—'}</td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        {intScore !== undefined ? <CompositeBadge score={intScore} /> : <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>—</span>}
      </td>
      {Array.from({ length: jurorColumnCount }, (_, i) => (
        <td key={i} style={{ padding: 'var(--space-3) var(--space-4)' }}>
          {app.juryScores[i] !== undefined ? (
            <CompositeBadge score={app.juryScores[i].composite} />
          ) : (
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>—</span>
          )}
        </td>
      ))}
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        {avgJuryScore !== null ? <CompositeBadge score={avgJuryScore} /> : <Badge tone="yellow">no scores yet</Badge>}
      </td>
    </tr>
  );
}
