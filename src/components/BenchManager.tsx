'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, Select, Input, Button, Badge } from '@/design-system';
import { createBenchAction, deleteBenchAction, assignJurorBenchAction, assignApplicationBenchAction, addJuryMemberAction } from '@/lib/benches/actions';

export interface BenchOption {
  id: string;
  name: string;
  jurorCount: number;
  applicationCount: number;
}

export interface JuryUserRow {
  id: string;
  name: string;
  email: string;
  benchId: string | null;
}

export interface JuryEligibleAppRow {
  id: string;
  orgName: string;
  benchId: string | null;
}

const UNASSIGNED = '';

function BenchSelect({
  value,
  benches,
  onSelect,
  ariaLabel,
}: {
  value: string | null;
  benches: BenchOption[];
  onSelect: (benchId: string) => Promise<void>;
  ariaLabel: string;
}) {
  const [pending, setPending] = React.useState(false);
  return (
    <Select
      aria-label={ariaLabel}
      value={value ?? UNASSIGNED}
      disabled={pending}
      onChange={async (e) => {
        setPending(true);
        try {
          await onSelect(e.target.value);
        } finally {
          setPending(false);
        }
      }}
    >
      <option value={UNASSIGNED}>unassigned</option>
      {benches.map((b) => (
        <option key={b.id} value={b.id}>
          {b.name}
        </option>
      ))}
    </Select>
  );
}

export function BenchManager({
  benches,
  juryUsers,
  eligibleApplications,
}: {
  benches: BenchOption[];
  juryUsers: JuryUserRow[];
  eligibleApplications: JuryEligibleAppRow[];
}) {
  const router = useRouter();
  const [creatingBench, setCreatingBench] = React.useState(false);
  const [addingJuror, setAddingJuror] = React.useState(false);
  const [showJurorForm, setShowJurorForm] = React.useState(false);
  const [appFilter, setAppFilter] = React.useState('');

  async function reassignJuror(userId: string, benchId: string) {
    const formData = new FormData();
    formData.set('userId', userId);
    formData.set('benchId', benchId);
    await assignJurorBenchAction(formData);
    router.refresh();
  }

  async function reassignApplication(applicationId: string, benchId: string) {
    const formData = new FormData();
    formData.set('applicationId', applicationId);
    formData.set('benchId', benchId);
    await assignApplicationBenchAction(formData);
    router.refresh();
  }

  const filteredApps = appFilter
    ? eligibleApplications.filter((a) => a.orgName.toLowerCase().includes(appFilter.toLowerCase()))
    : eligibleApplications;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <Card accent>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
          <h2 style={{ fontSize: 'var(--fs-h4)' }}>benches</h2>
          <Badge tone="outline">{benches.length} benches</Badge>
        </div>
        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginBottom: 'var(--space-5)' }}>
          each bench is a jury panel — jurors on a bench only ever see the applications placed on that same bench,
          never the whole shortlist.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          {benches.map((b) => (
            <div
              key={b.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-3)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <strong style={{ fontSize: 'var(--fs-small)' }}>{b.name}</strong>
                <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', margin: 0 }}>
                  {b.jurorCount} juror{b.jurorCount === 1 ? '' : 's'} · {b.applicationCount} application{b.applicationCount === 1 ? '' : 's'}
                </p>
              </div>
              <form
                action={async (formData) => {
                  await deleteBenchAction(formData);
                  router.refresh();
                }}
              >
                <input type="hidden" name="benchId" value={b.id} />
                <Button type="submit" variant="secondary" size="sm">
                  delete
                </Button>
              </form>
            </div>
          ))}
          {benches.length === 0 && <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>no benches yet — add one below.</p>}
        </div>

        <form
          action={async (formData) => {
            setCreatingBench(true);
            try {
              await createBenchAction(formData);
              router.refresh();
            } finally {
              setCreatingBench(false);
            }
          }}
          style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}
        >
          <Input name="name" label="new bench name" placeholder={`Bench ${benches.length + 1}`} required containerStyle={{ minWidth: 200 }} />
          <Button type="submit" variant="secondary" disabled={creatingBench}>
            {creatingBench ? 'adding…' : 'add bench'}
          </Button>
        </form>
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
          <h2 style={{ fontSize: 'var(--fs-h4)' }}>jury members</h2>
          <Badge tone="outline">{juryUsers.length} jurors</Badge>
        </div>
        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginBottom: 'var(--space-5)' }}>
          which bench each juror sits on. jurors not on a bench see nothing on the applications page.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 'var(--space-5)' }}>
          {juryUsers.map((j) => (
            <div
              key={j.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                alignItems: 'center',
                gap: 'var(--space-4)',
                padding: 'var(--space-3) 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)' as unknown as number }}>{j.name}</div>
                <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>{j.email}</div>
              </div>
              <BenchSelect
                ariaLabel={`bench for ${j.name}`}
                value={j.benchId}
                benches={benches}
                onSelect={(benchId) => reassignJuror(j.id, benchId)}
              />
            </div>
          ))}
          {juryUsers.length === 0 && <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>no jury members yet — add one below.</p>}
        </div>

        {showJurorForm ? (
          <form
            action={async (formData) => {
              setAddingJuror(true);
              try {
                await addJuryMemberAction(formData);
                router.refresh();
                setShowJurorForm(false);
              } finally {
                setAddingJuror(false);
              }
            }}
            style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', flexWrap: 'wrap' }}
          >
            <Input name="name" label="name" placeholder="full name" required containerStyle={{ minWidth: 160 }} />
            <Input name="email" type="email" label="email (used as login)" placeholder="name@example.com" required containerStyle={{ minWidth: 220 }} />
            <Input name="password" type="text" label="password" placeholder="set a login password" required containerStyle={{ minWidth: 160 }} />
            <Select name="benchId" label="bench (optional)" defaultValue={UNASSIGNED} containerStyle={{ minWidth: 160 }}>
              <option value={UNASSIGNED}>unassigned</option>
              {benches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary" disabled={addingJuror}>
              {addingJuror ? 'adding…' : 'add jury member'}
            </Button>
          </form>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setShowJurorForm(true)}>
            add a jury member
          </Button>
        )}
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
          <h2 style={{ fontSize: 'var(--fs-h4)' }}>companies on benches</h2>
          <Badge tone="outline">{eligibleApplications.length} shortlisted</Badge>
        </div>
        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
          only applications marked &ldquo;decision: yes&rdquo; are eligible for jury — place each one on a bench so
          the jurors on that bench can see it.
        </p>
        <Input
          placeholder="filter by organisation name"
          value={appFilter}
          onChange={(e) => setAppFilter(e.target.value)}
          containerStyle={{ marginBottom: 'var(--space-4)', maxWidth: 320 }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 480, overflowY: 'auto' }}>
          {filteredApps.map((a) => (
            <div
              key={a.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                alignItems: 'center',
                gap: 'var(--space-4)',
                padding: 'var(--space-2) 0',
                borderBottom: '1px solid var(--border-subtle)',
              }}
            >
              <span style={{ fontSize: 'var(--fs-small)' }}>{a.orgName}</span>
              <BenchSelect
                ariaLabel={`bench for ${a.orgName}`}
                value={a.benchId}
                benches={benches}
                onSelect={(benchId) => reassignApplication(a.id, benchId)}
              />
            </div>
          ))}
          {filteredApps.length === 0 && <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>no matching applications.</p>}
        </div>
      </Card>
    </div>
  );
}
