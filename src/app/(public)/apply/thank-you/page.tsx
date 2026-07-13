import Link from 'next/link';
import { AngularBanner, Card, Button } from '@/design-system';
import { prisma } from '@/lib/db';

export default async function ThankYouPage({ searchParams }: { searchParams: { ref?: string } }) {
  const app = searchParams.ref ? await prisma.application.findUnique({ where: { id: searchParams.ref } }) : null;

  return (
    <div>
      <AngularBanner
        eyebrow="application received"
        title="application received"
        subtitle="your application is now in our screening queue. our team will be in touch as it moves through review."
      />
      <div style={{ padding: 'var(--space-10)', maxWidth: 640, margin: '0 auto' }}>
        <Card accent>
          <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)' }}>
            reference
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-h4)', marginBottom: 'var(--space-4)' }}>{app?.id ?? searchParams.ref}</div>
          <div style={{ color: 'var(--text-secondary)' }}>organisation: {app?.orgName}</div>
          <div style={{ color: 'var(--text-secondary)' }}>email on file: {app?.email}</div>
        </Card>
        <div style={{ marginTop: 'var(--space-8)', display: 'flex', gap: 'var(--space-4)' }}>
          <Link href="/status">
            <Button variant="secondary">check status any time</Button>
          </Link>
          <Link href="/challenge">
            <Button variant="ghost">back to the challenge page</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
