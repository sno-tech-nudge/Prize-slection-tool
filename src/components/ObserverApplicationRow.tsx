import Link from 'next/link';
import { CompositeBadge, SolutionCategoryTag } from '@/components/StatusBadges';
import { Badge as DsBadge } from '@/design-system';
import { OrgTitle } from '@/components/OrgTitle';
import { ReviewStatusDropdown } from '@/components/ReviewStatusDropdown';
import { isReviewed } from '@/lib/applications/reviewStatus';
import {
  OPERATING_MODEL_ARCHETYPE_LABEL,
  LEGAL_REGISTRATION_TYPE_LABEL,
  INTERNAL_DECISION_LABEL,
  type OperatingModelArchetypeValue,
  type LegalRegistrationTypeValue,
  type InternalDecisionValue,
} from '@/lib/constants';
import type { ApplicationRowData } from '@/components/ApplicationRow';

/** Observer's own trimmed row — organisation, registration type, review status, decision status,
 *  operating model, states, score. All read-only display, same as the rest of this view —
 *  ReviewStatusDropdown (despite its name) and the decision/score badges are already just static
 *  badges, not editable controls, so reusing them here doesn't grant any write ability. Reviewer
 *  and eligibility are still deliberately excluded — internal working detail, not requested. */
export function ObserverApplicationRow({ app, queryString = '' }: { app: ApplicationRowData; queryString?: string }) {
  const humanComposite =
    app.humanReviews.length > 0
      ? Math.round(app.humanReviews.reduce((sum, r) => sum + r.composite, 0) / app.humanReviews.length)
      : null;

  const internalTone =
    app.internalDecision === 'YES' ? 'red' : app.internalDecision === 'NO' || app.internalDecision === 'ECOSYSTEM_PARTNER' ? 'neutral' : 'outline';
  const internalLabel = app.internalDecision ? (INTERNAL_DECISION_LABEL[app.internalDecision as InternalDecisionValue] ?? 'undecided') : 'undecided';

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
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <ReviewStatusDropdown reviewed={isReviewed(app)} />
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <DsBadge tone={internalTone}>{internalLabel}</DsBadge>
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
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        {humanComposite !== null ? (
          <CompositeBadge score={humanComposite} />
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>not reviewed yet</span>
        )}
      </td>
    </tr>
  );
}
