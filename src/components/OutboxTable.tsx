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
  provider: string;
}

// date + time of day, not just the date — so it's actually possible to tell when an email went
// out, not just which day.
function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

const TONE_FOR_STATUS: Record<string, 'neutral' | 'red' | 'ink' | 'yellow' | 'outline'> = {
  QUEUED: 'yellow',
  APPROVED: 'outline',
  SENT: 'red',
  FAILED: 'neutral',
  SKIPPED: 'neutral',
};

/** Owns its own data via a direct fetch to /api/outbox instead of trusting the server-rendered
 *  `initialEmails` prop to stay current through Next's router.refresh()/revalidatePath path —
 *  that mechanism wasn't reliably showing a freshly sent email in this table in practice. Polls
 *  on an interval and re-fetches immediately after any send/edit action anywhere in this table,
 *  so what's on screen is always a real read of the database, not a cached route render. */
export function OutboxTable({ emails: initialEmails, canSend }: { emails: OutboxTableRowData[]; canSend: boolean }) {
  const { push } = useToast();
  const [emails, setEmails] = React.useState(initialEmails);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = React.useState(false);
  // TEMPORARY diagnostic — remove once the live-refresh issue is confirmed fixed. Shows exactly
  // when the client last polled /api/outbox and what it got back, so we can tell from the screen
  // alone whether the polling loop is even running in this browser session.
  const [debugInfo, setDebugInfo] = React.useState('not checked yet');
  const queuedEmails = emails.filter((e) => e.status === 'QUEUED');
  const allQueuedSelected = queuedEmails.length > 0 && queuedEmails.every((e) => selected.has(e.id));

  const refreshEmails = React.useCallback(async () => {
    const now = new Date().toLocaleTimeString('en-GB');
    try {
      const res = await fetch('/api/outbox', { cache: 'no-store' });
      if (!res.ok) {
        setDebugInfo(`${now} — fetch failed, status ${res.status}`);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data.emails)) {
        setEmails(data.emails);
        setDebugInfo(`${now} — got ${data.emails.length} rows`);
      } else {
        setDebugInfo(`${now} — unexpected response shape`);
      }
    } catch (err) {
      setDebugInfo(`${now} — fetch threw: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }, []);

  React.useEffect(() => {
    refreshEmails();
    const interval = setInterval(refreshEmails, 8000);
    return () => clearInterval(interval);
  }, [refreshEmails]);

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
      await refreshEmails();
    } finally {
      setBulkSending(false);
    }
  }

  return (
    <Card padding="0" style={{ overflowX: 'auto' }}>
      <div style={{ padding: 'var(--space-2) var(--space-4)', fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', background: 'var(--surface-canvas)' }}>
        debug: last poll {debugInfo}
      </div>
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
            <OutboxTableRow key={e.id} email={e} canSend={canSend} selected={selected.has(e.id)} onToggle={() => toggle(e.id)} onSent={refreshEmails} />
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
  onSent,
}: {
  email: OutboxTableRowData;
  canSend: boolean;
  selected: boolean;
  onToggle: () => void;
  onSent: () => Promise<void>;
}) {
  const { id, orgName, to, subject, body, template, status, createdAt, sentAt, provider } = email;
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
          {formatDateTime(createdAt)}
          {sentAt ? (
            <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>sent {formatDateTime(sentAt)}</div>
          ) : null}
        </td>
        <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
          <Badge tone={TONE_FOR_STATUS[status] ?? 'neutral'}>{status.toLowerCase()}</Badge>
          {/* diagnostic aid — if this ever says "stub" on a real send attempt, EMAIL_PROVIDER
              isn't actually set to gmail/resend and nothing left the server despite the status
              above. */}
          <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>via {provider}</div>
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
                      await onSent();
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
            {/* a failed send previously had no way to retry from this table at all — approveAndSendOutboxEmail
                always re-attempts regardless of the row's current status, so this is a safe, real retry, not
                just re-reporting the old failure. */}
            {canSend && status === 'FAILED' && (
              <form
                action={async (formData) => {
                  setPending(true);
                  try {
                    const result = await approveAndSendAction(formData);
                    if (result.status === 'SENT') push('sent', `email to ${orgName} sent.`, 'success');
                    else push('send failed', result.error ?? `email to ${orgName} could not be sent.`, 'error');
                    await onSent();
                  } finally {
                    setPending(false);
                  }
                }}
              >
                <input type="hidden" name="outboxId" value={id} />
                <Button type="submit" variant="cta" size="sm" disabled={pending}>
                  {pending ? 'retrying…' : 'try again'}
                </Button>
              </form>
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
                await onSent();
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
