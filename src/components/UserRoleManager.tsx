'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, Select, Input, Button, Badge } from '@/design-system';
import { setUserRoleAction, addUserAction } from '@/lib/auth/actions';
import { USER_ROLES, ROLE_LABEL } from '@/lib/constants';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

function RoleRow({ user }: { user: ManagedUser }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setPending(true);
    const formData = new FormData();
    formData.set('userId', user.id);
    formData.set('role', e.target.value);
    try {
      await setUserRoleAction(formData);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div>
        <div style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)' as unknown as number, color: 'var(--text-primary)' }}>{user.name}</div>
        <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{user.email}</div>
      </div>
      <Select aria-label={`role for ${user.name}`} value={user.role} disabled={pending} onChange={onChange}>
        {USER_ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABEL[r]}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function UserRoleManager({ users }: { users: ManagedUser[] }) {
  const router = useRouter();
  const [adding, setAdding] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);

  return (
    <Card accent>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
        <h2 style={{ fontSize: 'var(--fs-h4)' }}>team &amp; roles</h2>
        <Badge tone="outline">{users.length} people</Badge>
      </div>
      <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginBottom: 'var(--space-5)' }}>
        assign who&apos;s admin, reviewer, jury or observer. this drives the dev role switcher in the header — there&apos;s no
        real login yet, so anyone with this link can pick any role. add real auth before sharing outside the team.
      </p>

      <div>
        {users.map((u) => (
          <RoleRow key={u.id} user={u} />
        ))}
      </div>

      {showForm ? (
        <form
          action={async (formData) => {
            setAdding(true);
            try {
              await addUserAction(formData);
              router.refresh();
              setShowForm(false);
            } finally {
              setAdding(false);
            }
          }}
          style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', marginTop: 'var(--space-5)', flexWrap: 'wrap' }}
        >
          <Input name="name" label="name" placeholder="full name" required containerStyle={{ minWidth: 160 }} />
          <Input name="email" type="email" label="email" placeholder="name@thedelta.org.in" required containerStyle={{ minWidth: 220 }} />
          <Select name="role" label="role" defaultValue="REVIEWER" containerStyle={{ minWidth: 140 }}>
            {USER_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary" disabled={adding}>
            {adding ? 'adding…' : 'add person'}
          </Button>
        </form>
      ) : (
        <Button variant="secondary" size="sm" style={{ marginTop: 'var(--space-5)' }} onClick={() => setShowForm(true)}>
          add a person
        </Button>
      )}
    </Card>
  );
}
