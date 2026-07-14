import Link from 'next/link';
import { CircleAlert } from 'lucide-react';
import { CompositeBadge, SolutionCategoryTag } from '@/components/StatusBadges';
import { Badge as DsBadge } from '@/design-system';
import { OrgTitle } from '@/components/OrgTitle';
import { ReviewStatusDropdown } from '@/components/ReviewStatusDropdown';
import { effectiveScore } from '@/lib/scoring/effective';
import { OPERATING_MODEL_ARCHETYPE_LABEL, type OperatingModelArchetypeValue } from '@/lib/constants';

const ELIGIBILITY_FIELDS = ['fcraStatus', 'cert12A', 'cert80G', 'csr1Registration'] as const;

export interface ApplicationRowData {
  id: string;
  orgName: string;
  pocFirstName: string;
  pocLastName: string;
  stageStatus: string;
  solutionCategory: string;
  operatingModelArchetype: string | null;
  farmersCount: number | null;
  statesOperating: string | null;
  internalDecision: string | null;
  fcraStatus: string | null;
  cert12A: string | null;
  cert80G: string | null;
  csr1Registration: string | null;
  targetMatch: { name: string } | null;
  humanReviews: { id: string }[];
  reviewAssignments: { id: string; reviewer: { name: string } }[];
  aiEvaluations: {
    id: string;
    composite: number;
    disposition: string;
    overrideComposite: number | null;
    overrideDisposition: string | null;
  }[];
}

/** Row navigates to the full application record page (/applications/[id]) on click — a real
 *  anchor, so left-click, middle-click, ctrl/cmd-click and right-click "open in new tab" all
 *  behave the way the browser expects, with no JS interception. */
export function ApplicationRow({ app, canManage }: { app: ApplicationRowData; canManage: boolean }) {
  const latestEval = app.aiEvaluations[0];

  const internalTone = app.internalDecision === 'YES' ? 'red' : app.internalDecision === 'NO' ? 'neutral' : 'outline';
  const internalLabel = app.internalDecision === 'YES' ? 'decision: yes' : app.internalDecision === 'NO' ? 'decision: no' : 'undecided';

  const reviewedBy = app.reviewAssignments.length > 0 ? app.reviewAssignments.map((r) => r.reviewer.name).join(', ') : 'unassigned';

  const eligibilityAnswered = ELIGIBILITY_FIELDS.filter((f) => app[f] != null).length;
  const eligibilityComplete = eligibilityAnswered === ELIGIBILITY_FIELDS.length;

  return (
    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <Link href={`/applications/${app.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
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
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <ReviewStatusDropdown applicationId={app.id} stageStatus={app.stageStatus} canManage={canManage} />
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <DsBadge tone={internalTone}>{internalLabel}</DsBadge>
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
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
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)' }}>{app.farmersCount ?? '—'}</td>
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
        {app.statesOperating ? app.statesOperating.split(';').filter(Boolean).slice(0, 2).join(', ') : '—'}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--fs-small)' }}>
          {!eligibilityComplete && <CircleAlert size={14} color="var(--delta-red)" strokeLinejoin="miter" strokeLinecap="square" />}
          <span style={{ color: eligibilityComplete ? 'var(--text-secondary)' : 'var(--delta-red)' }}>
            {eligibilityAnswered}/{ELIGIBILITY_FIELDS.length}
          </span>
        </div>
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        {latestEval ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <CompositeBadge score={effectiveScore(latestEval).composite} />
            {effectiveScore(latestEval).isOverridden && <DsBadge tone="yellow">overridden</DsBadge>}
          </div>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>not scored</span>
        )}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>{reviewedBy}</td>
    </tr>
  );
}
