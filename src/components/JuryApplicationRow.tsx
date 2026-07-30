'use client';
import { useRouter } from 'next/navigation';
import { CompositeBadge } from '@/components/StatusBadges';
import { Badge } from '@/design-system';
import { OrgTitle } from '@/components/OrgTitle';
import {
  OPERATING_MODEL_ARCHETYPE_LABEL,
  LEGAL_REGISTRATION_TYPE_LABEL,
  type OperatingModelArchetypeValue,
  type LegalRegistrationTypeValue,
} from '@/lib/constants';

export interface JuryApplicationRowData {
  id: string;
  orgName: string;
  statesOperating: string | null;
  operatingModelArchetype: string | null;
  legalRegistrationType: string | null;
  juryScores: { composite: number; verdict: string }[];
}

/** Jury rows open the full application page on double-click rather than single-click — jury
 *  members skim this trimmed table looking at scores across many rows, so a single click
 *  shouldn't immediately navigate away from the list. No bench or int (AI) score column here —
 *  jury's own list is about the operating context, not an internal read they're meant to score
 *  independently of. */
export function JuryApplicationRow({ app, queryString = '' }: { app: JuryApplicationRowData; queryString?: string }) {
  const router = useRouter();
  const myScore = app.juryScores[0];
  const href = `/applications/${app.id}${queryString}`;
  const state = app.statesOperating?.split(';').filter(Boolean)[0];
  const operatingModel = app.operatingModelArchetype?.split(';').filter(Boolean)[0];

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
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>{state ?? '—'}</td>
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
        {operatingModel ? (OPERATING_MODEL_ARCHETYPE_LABEL[operatingModel as OperatingModelArchetypeValue] ?? operatingModel) : '—'}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
        {app.legalRegistrationType
          ? (LEGAL_REGISTRATION_TYPE_LABEL[app.legalRegistrationType as LegalRegistrationTypeValue] ?? app.legalRegistrationType)
          : '—'}
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
