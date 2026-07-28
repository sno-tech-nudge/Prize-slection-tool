import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { AngularBanner, Badge, Button } from '@/design-system';
import { CompositeBadge } from '@/components/StatusBadges';
import { JuryScoreCard } from '@/components/JuryScoreCard';
import { getApplicationDetail } from '@/lib/applications/queries';
import { getCurrentUser } from '@/lib/auth/session';

/** The internal team's jury-dashboard detail page — a single full-width jury score card, no
 *  application content and no admin sidebar. Section 1 (this banner): org name, its AI/int
 *  score, and a link out to the full application record. Section 2+3 (JuryScoreCard): avg score,
 *  then every juror's per-criterion breakdown side by side. */
export default async function JuryDashboardDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (user?.role === 'JURY') redirect(`/applications/${params.id}`);

  const app = await getApplicationDetail(params.id);
  if (!app) notFound();

  const intScore = app.aiEvaluations[0]?.composite;

  return (
    <div>
      <AngularBanner
        eyebrow="jury oversight · rapid re.gen challenge"
        title={app.orgName}
        subtitle={`${app.pocFirstName} ${app.pocLastName}${app.designation ? `, ${app.designation}` : ''}`}
        action={
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
            {app.targetMatch && <Badge tone="red">target wishlist match</Badge>}
            {intScore !== undefined && <CompositeBadge score={intScore} />}
            <Link href={`/applications/${app.id}`}>
              <Button variant="secondary">view application</Button>
            </Link>
          </div>
        }
      />

      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto' }}>
        <JuryScoreCard juryScores={app.juryScores} />
      </div>
    </div>
  );
}
