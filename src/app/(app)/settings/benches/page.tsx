import Link from 'next/link';
import { AngularBanner } from '@/design-system';
import { BenchManager } from '@/components/BenchManager';
import { listBenches, listJuryUsers, listJuryEligibleApplications } from '@/lib/benches/queries';

export default async function BenchesSettingsPage() {
  const [benches, juryUsers, eligibleApplications] = await Promise.all([
    listBenches(),
    listJuryUsers(),
    listJuryEligibleApplications(),
  ]);

  return (
    <div>
      <AngularBanner
        eyebrow="internal platform"
        title="bench settings"
        subtitle="manage jury panels — who's on which bench, and which shortlisted companies each bench reviews."
      />
      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-lg)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <Link href="/settings" style={{ fontSize: 'var(--fs-small)', color: 'var(--delta-red)', textDecoration: 'none' }}>
          ← back to settings
        </Link>
        <BenchManager
          benches={benches.map((b) => ({ id: b.id, name: b.name, jurorCount: b.jurors.length, applicationCount: b._count.applications }))}
          juryUsers={juryUsers.map((j) => ({ id: j.id, name: j.name, email: j.email, benchIds: j.benches.map((b) => b.id) }))}
          eligibleApplications={eligibleApplications.map((a) => ({ id: a.id, orgName: a.orgName, benchId: a.benchId }))}
        />
      </div>
    </div>
  );
}
