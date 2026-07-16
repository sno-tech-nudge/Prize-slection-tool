'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, Badge, Button, Checkbox } from '@/design-system';
import { OrgTitle } from '@/components/OrgTitle';
import { bulkQueueOutreachAction } from '@/lib/mail/actions';

export interface OutreachApplicationRow {
  id: string;
  orgName: string;
  pocFirstName: string;
  pocLastName: string;
  email: string;
  internalDecision: string | null;
  outboxEmails: { template: string; status: string }[];
}

const DECISION_TONE: Record<string, 'red' | 'neutral' | 'outline'> = {
  YES: 'red',
  NO: 'neutral',
};

function outreachStatus(row: OutreachApplicationRow): string {
  const bulk = row.outboxEmails.find((e) => e.template === 'bulk_acceptance' || e.template === 'bulk_rejection');
  if (!bulk) return 'not contacted';
  const kind = bulk.template === 'bulk_acceptance' ? 'acceptance' : 'rejection';
  return `${kind} ${bulk.status.toLowerCase()}`;
}

export function OutreachApplicationsTable({ applications, canSend }: { applications: OutreachApplicationRow[]; canSend: boolean }) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [pending, setPending] = React.useState<'acceptance' | 'rejection' | null>(null);

  const allSelected = applications.length > 0 && selected.size === applications.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(applications.map((a) => a.id)));
  }

  async function runBulk(kind: 'acceptance' | 'rejection') {
    if (selected.size === 0) return;
    const verb = kind === 'acceptance' ? 'queue an acceptance email' : 'queue a rejection email';
    const confirmed = window.confirm(
      `${verb} for ${selected.size} application${selected.size === 1 ? '' : 's'}? this only adds them to the review queue below — nothing is sent until you approve it there.`,
    );
    if (!confirmed) return;

    setPending(kind);
    try {
      const formData = new FormData();
      selected.forEach((id) => formData.append('applicationId', id));
      formData.set('kind', kind);
      await bulkQueueOutreachAction(formData);
      setSelected(new Set());
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  return (
    <Card padding="0" style={{ overflowX: 'auto' }}>
      {canSend && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            padding: 'var(--space-4)',
            borderBottom: '1px solid var(--border-subtle)',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
            {selected.size} selected — bulk actions queue emails for review below, they are never sent automatically.
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button variant="secondary" size="sm" disabled={selected.size === 0 || pending !== null} onClick={() => runBulk('acceptance')}>
              {pending === 'acceptance' ? 'queuing…' : 'bulk send (acceptance)'}
            </Button>
            <Button variant="secondary" size="sm" disabled={selected.size === 0 || pending !== null} onClick={() => runBulk('rejection')}>
              {pending === 'rejection' ? 'queuing…' : 'bulk reject'}
            </Button>
          </div>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
            {canSend && (
              <th style={{ padding: 'var(--space-3) var(--space-4)', width: 40 }}>
                <Checkbox checked={allSelected} onChange={toggleAll} aria-label="select all" />
              </th>
            )}
            {['organisation', 'poc contact', 'decision', 'outreach status'].map((h) => (
              <th
                key={h}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  fontSize: 'var(--fs-caption)',
                  textTransform: 'uppercase',
                  letterSpacing: 'var(--ls-wide)',
                  color: 'var(--text-secondary)',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {canSend && (
                <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                  <Checkbox checked={selected.has(app.id)} onChange={() => toggle(app.id)} aria-label={`select ${app.orgName}`} />
                </td>
              )}
              <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 'var(--fw-bold)' as unknown as number }}>
                <OrgTitle>{app.orgName}</OrgTitle>
              </td>
              <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
                <div>
                  {app.pocFirstName} {app.pocLastName}
                </div>
                <div style={{ fontSize: 'var(--fs-caption)' }}>{app.email}</div>
              </td>
              <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                <Badge tone={app.internalDecision ? (DECISION_TONE[app.internalDecision] ?? 'outline') : 'outline'}>
                  {app.internalDecision ? `decision: ${app.internalDecision.toLowerCase()}` : 'undecided'}
                </Badge>
              </td>
              <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
                {outreachStatus(app)}
              </td>
            </tr>
          ))}
          {applications.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                no applications match this filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}
