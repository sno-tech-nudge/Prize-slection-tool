'use client';
import { useRouter } from 'next/navigation';
import { CompositeBadge } from '@/components/StatusBadges';
import { JURY_RUBRIC_MAX_TOTAL } from '@/lib/scoring/juryRubric';
import { ROUND_DECISION_LABEL, type RoundDecisionValue } from '@/lib/constants';
import { Badge } from '@/design-system';
import { OrgTitle } from '@/components/OrgTitle';

export interface Round3RowData {
  id: string;
  orgName: string;
  round3Decision: string | null;
  avgJuryScore: number | null;
}

/** Same double-click-to-open row pattern as InternalJuryRow (round 2's table) — the "round 2 score" column
 *  is round 2's avg jury score carried forward, since round 3 ("field visits") has no separate
 *  scoring mechanism of its own; it's a tracking/view page only. */
export function Round3Row({ app }: { app: Round3RowData }) {
  const router = useRouter();
  const href = `/applications/${app.id}`;

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
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        {app.avgJuryScore !== null ? (
          <CompositeBadge score={app.avgJuryScore} max={JURY_RUBRIC_MAX_TOTAL} />
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>—</span>
        )}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <Badge tone={app.round3Decision === 'YES' ? 'red' : app.round3Decision === 'NO' ? 'neutral' : 'outline'}>
          {app.round3Decision ? (ROUND_DECISION_LABEL[app.round3Decision as RoundDecisionValue] ?? 'undecided') : 'undecided'}
        </Badge>
      </td>
    </tr>
  );
}
