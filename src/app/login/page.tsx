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
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-8)' }}>
          <Logo program="prize" size={30} />
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
