import { redirect } from 'next/navigation';
import { Card, Logo } from '@/design-system';
import { LoginForm } from '@/components/LoginForm';
import { getCurrentUser } from '@/lib/auth/session';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-canvas)',
        padding: 'var(--space-6)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
          <Logo program="prize" size={30} />
        </div>
        <div
          style={{
            background: 'var(--delta-black)',
            padding: 'var(--space-5) var(--space-6)',
            marginBottom: 'var(--space-8)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 'var(--fs-h2)', fontWeight: 'var(--fw-bold)' as unknown as number, color: 'var(--text-inverse)', lineHeight: 1.1 }}>
            rapid <span style={{ color: 'var(--delta-yellow)' }}>re.gen</span>
          </div>
          <div style={{ fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-light)' as unknown as number, color: 'var(--text-inverse)', lineHeight: 1.1 }}>
            challenge
          </div>
        </div>
        <Card accent>
          <h1 style={{ fontSize: 'var(--fs-h4)', marginBottom: 'var(--space-1)' }}>sign in</h1>
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
            internal platform · rapid re.gen challenge
          </p>
          <LoginForm />
        </Card>
      </div>
    </div>
  );
}
