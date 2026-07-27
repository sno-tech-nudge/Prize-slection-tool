import { notFound, redirect } from 'next/navigation';
import { AngularBanner, Badge } from '@/design-system';
import { ApplicationMainContent } from '@/components/ApplicationMainContent';
import { JuryScoresTable } from '@/components/JuryScoresTable';
import { getApplicationDetail } from '@/lib/applications/queries';
import { getCurrentUser } from '@/lib/auth/session';

/** The internal team's jury-dashboard detail page — deliberately the same simplified view a
 *  jury member sees (no admin sidebar, no AI evaluation, no scraper data, no eligibility
 *  banners), except the right panel shows every juror's score and comment in a table instead of
 *  a single scoring form, since the internal team is here to oversee jury progress, not score. */
export default async function JuryDashboardDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (user?.role === 'JURY') redirect(`/applications/${params.id}`);

  const app = await getApplicationDetail(params.id);
  if (!app) notFound();

  return (
    <div>
      <AngularBanner
        eyebrow="jury oversight · rapid re.gen challenge"
        title={app.orgName}
        subtitle={`${app.pocFirstName} ${app.pocLastName}${app.designation ? `, ${app.designation}` : ''}`}
        action={app.targetMatch ? <Badge tone="red">target wishlist match</Badge> : undefined}
      />

      <div data-pdf-grid="true" style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-8)' }}>
        <ApplicationMainContent app={app} isJury={true} user={user} />
        <div data-pdf-exclude="true">
          <JuryScoresTable juryScores={app.juryScores} />
        </div>
      </div>
    </div>
  );
}
