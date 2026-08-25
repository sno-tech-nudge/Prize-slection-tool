'use client';
import { useRouter } from 'next/navigation';
import { CompositeBadge } from '@/components/StatusBadges';
import { JuryConsensusBadge } from '@/components/JuryConsensusBadge';
import { Badge } from '@/design-system';
import { OrgTitle } from '@/components/OrgTitle';

export interface InternalJuryRowData {
  id: string;
  orgName: string;
  bench: { name: string; jurors: { id: string; name: string }[] } | null;
  humanReviews: { composite: number }[];
  juryScores: { jurorId: string; composite: number; verdict: string; juror: { name: string } }[];
}

/** Same trimmed table + double-click-to-open pattern as the jury member's own applications
 *  list — the internal team's jury dashboard is deliberately the same view, just across every
 *  bench, with one column per juror seat on the bench (j1, j2, …) so progress is visible without
 *  opening each application; the full per-criterion breakdown still lives on the detail page's
 *  jury score card. Columns are keyed to the bench's juror list (alphabetical), not the order
 *  scores were submitted in, so "j2" always means the same person across every row that shares a
 *  bench — a juror who hasn't scored yet still gets their column, just empty.
 *  `jurorColumnCount` is the largest bench's juror count across the whole filtered list, computed
 *  by the parent, so every row renders the same number of columns. */
export function InternalJuryRow({ app, jurorColumnCount }: { app: InternalJuryRowData; jurorColumnCount: number }) {
  const router = useRouter();
  const href = `/jury/${app.id}`;
  // the internal (human) review team's own score — not the automatic AI read — null until
  // someone on the review team has actually scored it.
  const internalScore =
    app.humanReviews.length > 0 ? Math.round(app.humanReviews.reduce((sum, r) => sum + r.composite, 0) / app.humanReviews.length) : null;
  const avgJuryScore =
    app.juryScores.length > 0 ? Math.round(app.juryScores.reduce((sum, s) => sum + s.composite, 0) / app.juryScores.length) : null;
  const scoresByJurorId = new Map(app.juryScores.map((s) => [s.jurorId, s.composite]));

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
        {internalScore !== null ? <CompositeBadge score={internalScore} /> : <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>—</span>}
      </td>
      {Array.from({ length: jurorColumnCount }, (_, i) => {
        const juror = app.bench?.jurors[i];
        const score = juror ? scoresByJurorId.get(juror.id) : undefined;
        return (
          <td key={i} style={{ padding: 'var(--space-3) var(--space-4)' }} title={juror?.name}>
            {score !== undefined ? (
              <CompositeBadge score={score} />
            ) : (
              <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>{juror ? '—' : ''}</span>
            )}
          </td>
        );
      })}
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        {avgJuryScore !== null ? <CompositeBadge score={avgJuryScore} /> : <Badge tone="yellow">no scores yet</Badge>}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <JuryConsensusBadge
          verdicts={app.juryScores.map((s) => s.verdict)}
          breakdown={app.juryScores.map((s) => ({ label: s.juror.name, verdict: s.verdict }))}
        />
      </td>
    </tr>
  );
}
