import Link from 'next/link';
import { CircleAlert } from 'lucide-react';
import { CompositeBadge, SolutionCategoryTag } from '@/components/StatusBadges';
import { Badge as DsBadge } from '@/design-system';
import { OrgTitle } from '@/components/OrgTitle';
import { ReviewStatusDropdown } from '@/components/ReviewStatusDropdown';
import { evaluateEligibility } from '@/lib/scoring/eligibility';
import { isReviewed } from '@/lib/applications/reviewStatus';
import {
  OPERATING_MODEL_ARCHETYPE_LABEL,
  LEGAL_REGISTRATION_TYPE_LABEL,
  type OperatingModelArchetypeValue,
  type LegalRegistrationTypeValue,
} from '@/lib/constants';

export interface ApplicationRowData {
  id: string;
  orgName: string;
  pocFirstName: string;
  pocLastName: string;
  designation: string | null;
  phone: string | null;
  email: string;
  website: string | null;
  linkedinUrl: string | null;
  stageStatus: string;
  solutionCategory: string;
  operatingModelArchetype: string | null;
  statesOperating: string | null;
  internalDecision: string | null;
  legalRegistrationType: string | null;
  fcraStatus: string | null;
  cert12A: string | null;
  cert80G: string | null;
  csr1Registration: string | null;
  darpanRegistered: string | null;
  targetMatch: { name: string } | null;
  founders: { fullName: string; email: string | null; linkedin: string | null }[];
  humanReviews: { id: string; composite: number }[];
  reviewAssignments: { id: string; reviewer: { name: string } }[];
}

/** Row navigates to the full application record page (/applications/[id]) on click — a real
 *  anchor, so left-click, middle-click, ctrl/cmd-click and right-click "open in new tab" all
 *  behave the way the browser expects, with no JS interception. */
export function ApplicationRow({ app, queryString = '' }: { app: ApplicationRowData; queryString?: string }) {
  const humanComposite =
    app.humanReviews.length > 0
      ? Math.round(app.humanReviews.reduce((sum, r) => sum + r.composite, 0) / app.humanReviews.length)
      : null;

  const internalTone = app.internalDecision === 'YES' ? 'red' : app.internalDecision === 'NO' ? 'neutral' : 'outline';
  const internalLabel = app.internalDecision === 'YES' ? 'decision: yes' : app.internalDecision === 'NO' ? 'decision: no' : 'undecided';

  const reviewedBy = app.reviewAssignments.length > 0 ? app.reviewAssignments.map((r) => r.reviewer.name).join(', ') : 'unassigned';

  const eligibility = evaluateEligibility(app);

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
        {app.targetMatch && (
          <DsBadge tone="red" style={{ marginTop: 'var(--space-2)' }}>
            target match
          </DsBadge>
        )}
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
      <td
        style={{ padding: 'var(--space-3) var(--space-4)' }}
        title={eligibility.eligible ? eligibility.identityGaps.join('; ') : eligibility.failedReasons.join('; ')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--fs-small)' }}>
          {!eligibility.eligible && <CircleAlert size={14} color="var(--delta-red)" strokeLinejoin="miter" strokeLinecap="square" />}
          {eligibility.eligible && eligibility.identityGaps.length > 0 && (
            <CircleAlert size={14} color="var(--delta-yellow)" strokeLinejoin="miter" strokeLinecap="square" />
          )}
          <span
            style={{
              color: !eligibility.eligible
                ? 'var(--delta-red)'
                : eligibility.identityGaps.length > 0
                  ? 'var(--yellow-600)'
                  : 'var(--text-secondary)',
            }}
          >
            {eligibility.eligible ? 'yes' : 'no'}
          </span>
        </div>
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        {humanComposite !== null ? (
          <CompositeBadge score={humanComposite} />
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>not reviewed yet</span>
        )}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>{reviewedBy}</td>
    </tr>
  );
}
