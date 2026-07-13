import { AngularBanner, Card, Input, Button, Badge } from '@/design-system';
import { OrgTitle } from '@/components/OrgTitle';
import { prisma } from '@/lib/db';
import type { StageStatusValue } from '@/lib/constants';

const PLAIN_LANGUAGE: Record<StageStatusValue, string> = {
  SUBMITTED: 'we have received your application. it is in queue for screening.',
  SCREENING: 'your application is being screened for eligibility and duplicates.',
  UNDER_REVIEW: 'your application is being reviewed by our evaluation panel.',
  SHORTLISTED: 'your application has been shortlisted and is moving on to jury review.',
  JURY_REVIEW: 'your application is with our jury panel now.',
  FINALIST: 'your application has been selected as a finalist.',
  WINNER: 'your application has won the^delta prize.',
  REJECTED: 'your application was not advanced this cycle. check your inbox for a note from our team.',
  WITHDRAWN: 'this application has been withdrawn.',
};

export default async function StatusPage({ searchParams }: { searchParams: { email?: string; ref?: string } }) {
  const { email, ref } = searchParams;
  let result: { orgName: string; stageStatus: string } | null = null;
  let searched = false;

  if (email && ref) {
    searched = true;
    result = await prisma.application.findFirst({
      where: { id: ref, email: { equals: email } },
      select: { orgName: true, stageStatus: true },
    });
  }

  return (
    <div>
      <AngularBanner eyebrow="rapid re.gen challenge" title="check your application status" subtitle="enter the email you applied with and your reference id." />
      <div style={{ padding: 'var(--space-10)', maxWidth: 560, margin: '0 auto' }}>
        <Card accent>
          <form method="get" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input name="email" type="email" label="email used to apply" defaultValue={email} required />
            <Input name="ref" label="application reference id" defaultValue={ref} required />
            <Button type="submit" variant="cta">
              check status
            </Button>
          </form>
        </Card>

        {searched && (
          <Card style={{ marginTop: 'var(--space-6)' }}>
            {result ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                  <strong><OrgTitle>{result.orgName}</OrgTitle></strong>
                  <Badge tone="outline">{result.stageStatus.toLowerCase().replace('_', ' ')}</Badge>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>{PLAIN_LANGUAGE[result.stageStatus as StageStatusValue]}</p>
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>
                we couldn&apos;t find an application matching that email and reference id. double-check both and try again.
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
