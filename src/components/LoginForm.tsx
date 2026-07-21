'use client';
import React from 'react';
import { Input, Button } from '@/design-system';
import { loginAction } from '@/lib/auth/actions';

export function LoginForm() {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <form
      action={async (formData) => {
        setPending(true);
        setError(null);
        try {
          const result = await loginAction(formData);
          if (result?.error) setError(result.error);
        } finally {
          setPending(false);
        }
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
    >
      <Input name="username" type="email" label="email" autoComplete="email" required autoFocus />
      <Input name="password" type="password" label="password" autoComplete="current-password" required />
      {error && <p style={{ fontSize: 'var(--fs-small)', color: 'var(--delta-red)' }}>{error}</p>}
      <Button type="submit" variant="cta" size="lg" disabled={pending} style={{ marginTop: 'var(--space-2)' }}>
        {pending ? 'signing in…' : 'sign in'}
      </Button>
    </form>
  );
}
