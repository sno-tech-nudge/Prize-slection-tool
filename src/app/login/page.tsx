import { redirect } from 'next/navigation';
import { Logo } from '@/design-system';
import { LoginForm } from '@/components/LoginForm';
import { getCurrentUser } from '@/lib/auth/session';

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/dashboard');

  return (
    // full-bleed split screen, no margin around it: the challenge on the left, sign-in on the right;
    // the two halves stack on narrow screens
    <div style={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap', background: 'var(--surface-card)' }}>
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: 360,
          minHeight: 420,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 'var(--space-10)',
          padding: 'var(--space-12)',
          background: 'var(--delta-black)',
        }}
      >
        <Logo program="prize" size={30} tone="light" />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              fontSize: 'var(--fs-overline)',
              letterSpacing: 'var(--ls-wide)',
              textTransform: 'uppercase',
              color: 'var(--delta-yellow)',
              fontWeight: 'var(--fw-bold)' as unknown as number,
              marginBottom: 'var(--space-4)',
            }}
          >
            internal platform
          </div>
          <div
            style={{
              fontSize: 'var(--fs-display)',
              fontWeight: 'var(--fw-bold)' as unknown as number,
              color: 'var(--text-inverse)',
              lineHeight: 1,
              textTransform: 'lowercase',
            }}
          >
            rapid <span style={{ color: 'var(--delta-yellow)' }}>re.gen</span>
          </div>
          <div
            style={{
              fontSize: 'var(--fs-h1)',
              fontWeight: 'var(--fw-light)' as unknown as number,
              color: 'var(--text-inverse)',
              lineHeight: 1.1,
              textTransform: 'lowercase',
            }}
          >
            challenge
          </div>
        </div>

        <p style={{ position: 'relative', zIndex: 1, margin: 0, fontSize: 'var(--fs-caption)', color: 'var(--grey-400)' }}>
          a the/nudge institute initiative
        </p>

        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 150,
            height: 150,
            background: 'var(--delta-red)',
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
          }}
        />
      </section>

      <section
        style={{
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: 340,
          minHeight: 420,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-12) var(--space-8)',
          background: 'var(--surface-card)',
        }}
      >
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ width: 48, height: 4, background: 'var(--delta-red)', marginBottom: 'var(--space-6)' }} />
          <h1 style={{ fontSize: 'var(--fs-h2)', marginBottom: 'var(--space-1)' }}>sign in</h1>
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginBottom: 'var(--space-8)' }}>
            use your team email and password to continue.
          </p>
          <LoginForm />
        </div>
      </section>
    </div>
  );
}
