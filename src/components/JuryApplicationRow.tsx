import Link from 'next/link';
import { CompositeBadge } from '@/components/StatusBadges';
import { JuryConsensusBadge } from '@/components/JuryConsensusBadge';
import { Badge, Button } from '@/design-system';
import { OrgTitle } from '@/components/OrgTitle';

export interface JuryApplicationRowData {
  id: string;
  orgName: string;
  juryScores: { composite: number; verdict: string }[];
  benchVerdicts: string[];
}

/** Organisation name and the "view application" action both link to the same place — a real
 *  anchor, so left-click, middle-click, and ctrl/cmd-click "open in new tab" all work as expected,
 *  same convention as the admin/reviewer list. */
export function JuryApplicationRow({ app, queryString = '' }: { app: JuryApplicationRowData; queryString?: string }) {
  const myScore = app.juryScores[0];
  const href = `/applications/${app.id}${queryString}`;

  return (
    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <Link href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontWeight: 'var(--fw-bold)' as unknown as number }}>
            <OrgTitle>{app.orgName}</OrgTitle>
          </div>
        </Link>
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <Badge tone={myScore ? 'red' : 'yellow'}>{myScore ? 'completed' : 'yet to score'}</Badge>
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        {myScore ? <CompositeBadge score={myScore.composite} /> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <JuryConsensusBadge verdicts={app.benchVerdicts} />
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <Link href={href} style={{ textDecoration: 'none' }}>
          <Button variant="cta" size="sm">
            view application
          </Button>
        </Link>
      </td>
    </tr>
  );
}
