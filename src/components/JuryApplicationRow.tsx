'use client';
import { useRouter } from 'next/navigation';
import { CompositeBadge } from '@/components/StatusBadges';
import { Badge } from '@/design-system';
import { OrgTitle } from '@/components/OrgTitle';

export interface JuryApplicationRowData {
  id: string;
  orgName: string;
  bench: { name: string } | null;
  statesOperating: string | null;
  aiEvaluations: { composite: number }[];
  juryScores: { composite: number; verdict: string }[];
}

/** Jury rows open the full application page on double-click rather than single-click — jury
 *  members skim this trimmed table looking at scores across many rows, so a single click
 *  shouldn't immediately navigate away from the list. */
export function JuryApplicationRow({ app, queryString = '' }: { app: JuryApplicationRowData; queryString?: string }) {
  const router = useRouter();
  const myScore = app.juryScores[0];
  const intScore = app.aiEvaluations[0]?.composite;
  const href = `/applications/${app.id}${queryString}`;
  const state = app.statesOperating?.split(';').filter(Boolean)[0];

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
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
        {app.bench?.name ?? '—'}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>{state ?? '—'}</td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        {intScore !== undefined ? <CompositeBadge score={intScore} /> : <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>—</span>}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        {myScore ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <CompositeBadge score={myScore.composite} />
            <Badge tone="outline">{myScore.verdict.toLowerCase()}</Badge>
          </div>
        ) : (
          <Badge tone="yellow">awaiting your score</Badge>
        )}
      </td>
    </tr>
  );
}
