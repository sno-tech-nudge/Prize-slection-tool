import Link from 'next/link';
import { FileText } from 'lucide-react';
import { CompositeBadge } from '@/components/StatusBadges';
import { Badge as DsBadge } from '@/design-system';
import { OrgTitle } from '@/components/OrgTitle';
import { ReviewStatusDropdown } from '@/components/ReviewStatusDropdown';
import { isReviewed, computeHumanComposite } from '@/lib/applications/reviewStatus';
import { JURY_RUBRIC_MAX_TOTAL } from '@/lib/scoring/juryRubric';
import { LEGAL_REGISTRATION_TYPE_LABEL, type LegalRegistrationTypeValue } from '@/lib/constants';

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
  round1Decision: string | null;
  legalRegistrationType: string | null;
  fcraStatus: string | null;
  cert12A: string | null;
  cert80G: string | null;
  csr1Registration: string | null;
  darpanRegistered: string | null;
  deckUrl: string | null;
  targetMatch: { name: string } | null;
  founders: { fullName: string; email: string | null; linkedin: string | null }[];
  humanReviews: { id: string; composite: number; submittedAt: Date }[];
  reviewAssignments: { id: string; reviewer: { name: string } }[];
  juryScores: { composite: number }[];
  bench: { name: string } | null;
}

/** Row navigates to the full application record page (/applications/[id]) on click — a real
 *  anchor, so left-click, middle-click, ctrl/cmd-click and right-click "open in new tab" all
 *  behave the way the browser expects, with no JS interception. */
export function ApplicationRow({ app, queryString = '' }: { app: ApplicationRowData; queryString?: string }) {
  const humanComposite = computeHumanComposite(app);
  const avgJuryScore =
    app.juryScores.length > 0 ? Math.round(app.juryScores.reduce((sum, s) => sum + s.composite, 0) / app.juryScores.length) : null;

  const reviewedBy = app.reviewAssignments.length > 0 ? app.reviewAssignments.map((r) => r.reviewer.name).join(', ') : 'unassigned';

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
        {humanComposite !== null ? (
          <CompositeBadge score={humanComposite} />
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>not reviewed yet</span>
        )}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>{reviewedBy}</td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        {avgJuryScore !== null ? (
          <CompositeBadge score={avgJuryScore} max={JURY_RUBRIC_MAX_TOTAL} />
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>—</span>
        )}
      </td>
      <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>{app.bench?.name ?? '—'}</td>
      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
        {app.deckUrl ? (
          <a
            href={app.deckUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--delta-red)', fontSize: 'var(--fs-small)' }}
          >
            <FileText size={14} strokeLinejoin="miter" strokeLinecap="square" /> pdf
          </a>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-caption)' }}>—</span>
        )}
      </td>
    </tr>
  );
}
