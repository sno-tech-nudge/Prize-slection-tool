import Link from 'next/link';
import { SolutionCategoryTag } from '@/components/StatusBadges';
import { OrgTitle } from '@/components/OrgTitle';
import {
  OPERATING_MODEL_ARCHETYPE_LABEL,
  LEGAL_REGISTRATION_TYPE_LABEL,
  type OperatingModelArchetypeValue,
  type LegalRegistrationTypeValue,
} from '@/lib/constants';
import type { ApplicationRowData } from '@/components/ApplicationRow';

/** Observer's own trimmed row — organisation, registration type, operating model, states.
 *  Explicitly no review status, decision status, reviewer, eligibility, or score columns — purely
 *  identifying/operational fields, no scoring of any kind. */
export function ObserverApplicationRow({ app, queryString = '' }: { app: ApplicationRowData; queryString?: string }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <Link href={`/applications/${app.id}${queryString}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div style={{ fontWeight: 'var(--fw-bold)' as unknown as number }}>
            <OrgTitle>{app.orgName}</OrgTitle>
          </div>
          <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
            {app.pocFirstName} {app.pocLastName}
          </div>
        </Link>
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
        {app.legalRegistrationType
          ? (LEGAL_REGISTRATION_TYPE_LABEL[app.legalRegistrationType as LegalRegistrationTypeValue] ?? app.legalRegistrationType)
          : '—'}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', minWidth: 260 }}>
        {app.operatingModelArchetype
          ? (() => {
              const values = app.operatingModelArchetype.split(';').filter(Boolean);
              const label = OPERATING_MODEL_ARCHETYPE_LABEL[values[0] as OperatingModelArchetypeValue] ?? values[0];
              return values.length > 1 ? `${label} +${values.length - 1}` : label;
            })()
          : app.solutionCategory
            ? <SolutionCategoryTag category={app.solutionCategory} />
            : '—'}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
        {app.statesOperating ? app.statesOperating.split(';').filter(Boolean).slice(0, 2).join(', ') : '—'}
      </td>
    </tr>
  );
}
