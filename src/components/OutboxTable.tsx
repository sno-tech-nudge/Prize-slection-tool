'use client';
import React from 'react';
import { Card, Badge, Button, Dialog, Input, Textarea, Checkbox, useToast } from '@/design-system';
import { approveAndSendAction, updateOutboxEmailAction, bulkApproveAndSendAction } from '@/lib/mail/actions';
import { OrgTitle } from '@/components/OrgTitle';

export interface OutboxTableRowData {
  id: string;
  orgName: string;
  to: string;
  subject: string;
  body: string;
  template: string;
  status: string;
  createdAt: string;
  sentAt: string | null;
}

const TONE_FOR_STATUS: Record<string, 'neutral' | 'red' | 'ink' | 'yellow' | 'outline'> = {
  QUEUED: 'yellow',
  APPROVED: 'outline',
  SENT: 'red',
  FAILED: 'neutral',
  SKIPPED: 'neutral',
};

export function OutboxTable({ emails, canSend }: { emails: OutboxTableRowData[]; canSend: boolean }) {
  const { push } = useToast();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = React.useState(false);
  const queuedEmails = emails.filter((e) => e.status === 'QUEUED');
  const allQueuedSelected = queuedEmails.length > 0 && queuedEmails.every((e) => selected.has(e.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allQueuedSelected ? new Set() : new Set(queuedEmails.map((e) => e.id)));
  }

  async function sendSelected() {
    setBulkSending(true);
    const formData = new FormData();
    selected.forEach((id) => formData.append('outboxId', id));
    try {
      const result = await bulkApproveAndSendAction(formData);
      setSelected(new Set());
      if (result.failed === 0) {
        push('sent', `${result.sent} email${result.sent === 1 ? '' : 's'} sent successfully.`, 'success');
      } else {
        const detail = result.errors.length ? result.errors.join('; ') : `${result.sent} sent, ${result.failed} failed — check status below.`;
        push('some emails failed', detail, 'error');
      }
    } finally {
      setBulkSending(false);
    }
  }

  return (
    <Card padding="0" style={{ overflowX: 'auto' }}>
      {canSend && selected.size > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-3) var(--space-4)',
            background: 'var(--surface-canvas)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)' as unknown as number }}>{selected.size} selected</span>
          <Button variant="cta" size="sm" disabled={bulkSending} onClick={sendSelected}>
            {bulkSending ? 'sending…' : `approve + send ${selected.size}`}
          </Button>
        </div>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
            {canSend && (
              <th style={{ padding: 'var(--space-3) var(--space-4)', width: 40 }}>
                <Checkbox checked={allQueuedSelected} onChange={toggleAll} disabled={queuedEmails.length === 0} aria-label="select all queued" />
              </th>
            )}
            {['organisation', 'subject', 'template', 'created', 'status', ''].map((h) => (
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
          {emails.map((e) => (
            <OutboxTableRow key={e.id} email={e} canSend={canSend} selected={selected.has(e.id)} onToggle={() => toggle(e.id)} />
          ))}
          {emails.length === 0 && (
            <tr>
              <td colSpan={canSend ? 7 : 6} style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                no emails queued yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}

function OutboxTableRow({
  email,
  canSend,
  selected,
  onToggle,
}: {
  email: OutboxTableRowData;
  canSend: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const { id, orgName, to, subject, body, template, status, createdAt, sentAt } = email;
  const { push } = useToast();
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<'preview' | 'edit'>('preview');
  const [pending, setPending] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  return (
    <>
      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {canSend && (
          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
            {status === 'QUEUED' && <Checkbox checked={selected} onChange={onToggle} aria-label={`select ${orgName}`} />}
          </td>
        )}
        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
          <div style={{ fontWeight: 'var(--fw-bold)' as unknown as number }}>
            <OrgTitle>{orgName}</OrgTitle>
          </div>
          <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>to {to}</div>
        </td>
        <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>{subject}</td>
        <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
          {template.replace(/_/g, ' ')}
        </td>
        <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
          {new Date(createdAt).toLocaleDateString('en-GB')}
          {sentAt ? (
            <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>sent {new Date(sentAt).toLocaleDateString('en-GB')}</div>
          ) : null}
        </td>
        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
          <Badge tone={TONE_FOR_STATUS[status] ?? 'neutral'}>{status.toLowerCase()}</Badge>
        </td>
        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setMode('preview');
                setOpen(true);
              }}
            >
              preview
            </Button>
            {canSend && status === 'QUEUED' && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setMode('edit');
                    setOpen(true);
                  }}
                >
                  edit
                </Button>
                <form
                  action={async (formData) => {
                    setPending(true);
                    try {
                      const result = await approveAndSendAction(formData);
                      if (result.status === 'SENT') push('sent', `email to ${orgName} sent.`, 'success');
                      else push('send failed', result.error ?? `email to ${orgName} could not be sent.`, 'error');
                    } finally {
                      setPending(false);
                    }
                  }}
                >
                  <input type="hidden" name="outboxId" value={id} />
                  <Button type="submit" variant="cta" size="sm" disabled={pending}>
                    {pending ? 'sending…' : 'approve + send'}
                  </Button>
                </form>
              </>
            )}
          </div>
        </td>
      </tr>

      <Dialog open={open} onClose={() => setOpen(false)} title={mode === 'edit' ? 'edit before sending' : subject} width={680}>
        {mode === 'preview' ? (
          <iframe title="email preview" srcDoc={body} style={{ width: '100%', height: 420, border: '1px solid var(--border-subtle)' }} />
        ) : (
          <form
            action={async (formData) => {
              setSaving(true);
              try {
                await updateOutboxEmailAction(formData);
                setMode('preview');
              } finally {
                setSaving(false);
              }
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
          >
            <input type="hidden" name="outboxId" value={id} />
            <Input name="to" label="recipient" defaultValue={to} required />
            <Input name="subject" label="subject" defaultValue={subject} required />
            <Textarea name="body" label="email HTML" rows={12} defaultValue={body} style={{ fontSize: 12 }} />
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Button type="submit" variant="cta" size="sm" disabled={saving}>
                {saving ? 'saving…' : 'save changes'}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setMode('preview')}>
                cancel
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
}
