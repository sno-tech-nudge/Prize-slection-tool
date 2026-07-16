import Link from 'next/link';
import { Badge as DsBadge } from '@/design-system';
import { OrgTitle } from '@/components/OrgTitle';

export interface TargetRowData {
  id: string;
  name: string;
  connectStatus: string | null;
  prizeRelevance: string | null;
  focusType: string | null;
  orgFundingType: string | null;
  keyLocations: string | null;
  model: string | null;
  pocName: string | null;
  pocDesignation: string | null;
  pocEmail: string | null;
  contactNumber: string | null;
  status: string;
  applications: { id: string; orgName: string; stageStatus: string }[];
}

const PRIZE_RELEVANCE_TONE: Record<string, 'red' | 'yellow' | 'neutral' | 'outline'> = {
  High: 'red',
  Medium: 'yellow',
  Low: 'neutral',
};

function firstModelTag(model: string | null): string {
  if (!model) return '—';
  const tags = model
    .split(',')
    .map((t) => t.replace(/["]/g, '').trim())
    .filter(Boolean);
  if (tags.length === 0) return '—';
  return tags.length > 1 ? `${tags[0]} +${tags.length - 1}` : tags[0];
}

export function TargetRow({ target }: { target: TargetRowData }) {
  const matchedApp = target.applications[0];

  return (
    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <div style={{ fontWeight: 'var(--fw-bold)' as unknown as number }}>
          <OrgTitle>{target.name}</OrgTitle>
        </div>
        {matchedApp && (
          <Link href={`/applications/${matchedApp.id}`} style={{ fontSize: 'var(--fs-caption)', color: 'var(--delta-red)', textDecoration: 'none' }}>
            applied →
          </Link>
        )}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
        {target.connectStatus ?? '—'}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        {target.prizeRelevance ? <DsBadge tone={PRIZE_RELEVANCE_TONE[target.prizeRelevance] ?? 'outline'}>{target.prizeRelevance.toLowerCase()}</DsBadge> : '—'}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
        {target.focusType ?? '—'}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
        {target.orgFundingType ?? '—'}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
        {target.keyLocations ?? '—'}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', minWidth: 260 }}>
        {firstModelTag(target.model)}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
        {target.pocName ? (
          <div>
            <div>{target.pocName}</div>
            {target.pocDesignation && <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>{target.pocDesignation}</div>}
            {target.pocEmail && (
              <a href={`mailto:${target.pocEmail}`} style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
                {target.pocEmail}
              </a>
            )}
          </div>
        ) : (
          '—'
        )}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <DsBadge tone={target.status === 'NOT_APPLIED' ? 'outline' : target.status === 'CONTACTED' ? 'ink' : 'red'}>
          {target.status.replace('_', ' ').toLowerCase()}
        </DsBadge>
      </td>
    </tr>
  );
}
