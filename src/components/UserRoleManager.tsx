'use client';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, Select, Input, Button, Badge } from '@/design-system';
import { setUserRoleAction, addUserAction, updateUserAction, deleteUserAction } from '@/lib/auth/actions';
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
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [removeError, setRemoveError] = React.useState<string | null>(null);

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

  async function remove() {
    const confirmed = window.confirm(`remove ${user.name} (${user.email}) from the team entirely? this can't be undone.`);
    if (!confirmed) return;

    setRemoving(true);
    setRemoveError(null);
    try {
      const formData = new FormData();
      formData.set('userId', user.id);
      const result = await deleteUserAction(formData);
      if (result.error) {
        setRemoveError(result.error);
      } else {
        router.refresh();
      }
    } finally {
      setRemoving(false);
    }
  }

  if (editing) {
    return (
      <form
        action={async (formData) => {
          setSaving(true);
          formData.set('userId', user.id);
          try {
            await updateUserAction(formData);
            router.refresh();
            setEditing(false);
          } finally {
            setSaving(false);
          }
        }}
        style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}
      >
        <Input name="name" label="name" defaultValue={user.name} required containerStyle={{ minWidth: 160, flex: 1 }} />
        <Input name="email" type="email" label="email" defaultValue={user.email} required containerStyle={{ minWidth: 200, flex: 1 }} />
        <Button type="submit" variant="cta" size="sm" disabled={saving}>
          {saving ? 'saving…' : 'save'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
          cancel
        </Button>
      </form>
    );
  }

  return (
    <div style={{ padding: 'var(--space-3) 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto auto', alignItems: 'center', gap: 'var(--space-4)' }}>
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
        <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
          edit
        </Button>
        <Button variant="secondary" size="sm" disabled={removing} onClick={remove}>
          {removing ? 'removing…' : 'remove'}
        </Button>
      </div>
      {removeError && <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--delta-red)', marginTop: 'var(--space-2)' }}>{removeError}</p>}
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
        assign who&apos;s admin, reviewer, jury or observer, edit their name/email, or remove them entirely — this
        covers jury members and reviewers too, not just admins. adding a person here only creates their profile —
        real login credentials (username/password) still need to be provisioned separately, except for jury
        members, which the <Link href="/settings/benches" style={{ color: 'var(--delta-red)' }}>bench settings</Link>{' '}
        page can create with a real login in one step.
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
