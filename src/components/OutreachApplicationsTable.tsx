'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, Badge, Button, Checkbox, Select, Dialog, Input, useToast } from '@/design-system';
import { OrgTitle } from '@/components/OrgTitle';
import { bulkSendOutreachAction, previewOutreachEmailAction, sendIndividualOutreachAction } from '@/lib/mail/actions';

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

const BULK_TEMPLATE_KIND: Record<string, string> = {
  bulk_acceptance: 'acceptance',
  bulk_rejection: 'rejection',
  bulk_query: 'query',
};

function outreachStatus(row: OutreachApplicationRow): string {
  const bulk = row.outboxEmails.find((e) => e.template in BULK_TEMPLATE_KIND);
  if (!bulk) return 'not contacted';
  return `${BULK_TEMPLATE_KIND[bulk.template]} ${bulk.status.toLowerCase()}`;
}

export function OutreachApplicationsTable({ applications, canSend }: { applications: OutreachApplicationRow[]; canSend: boolean }) {
  const router = useRouter();
  const { push } = useToast();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [pending, setPending] = React.useState<'acceptance' | 'rejection' | 'query' | null>(null);
  const [query, setQuery] = React.useState('');

  const filteredApplications = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter(
      (a) =>
        a.orgName.toLowerCase().includes(q) ||
        `${a.pocFirstName} ${a.pocLastName}`.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q),
    );
  }, [applications, query]);

  const allSelected = filteredApplications.length > 0 && filteredApplications.every((a) => selected.has(a.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (allSelected) {
        const next = new Set(prev);
        filteredApplications.forEach((a) => next.delete(a.id));
        return next;
      }
      const next = new Set(prev);
      filteredApplications.forEach((a) => next.add(a.id));
      return next;
    });
  }

  // an in-app Dialog instead of window.confirm() — see the matching note on the per-row send
  // confirmation below; native confirm() is silently swallowed by CDP-automated browsers
  // (including the Claude Code preview pane), which made bulk actions look like dead buttons
  // when tested there.
  const [confirmKind, setConfirmKind] = React.useState<'acceptance' | 'rejection' | 'query' | null>(null);

  async function runBulk(kind: 'acceptance' | 'rejection' | 'query') {
    setConfirmKind(null);
    setPending(kind);
    try {
      const formData = new FormData();
      selected.forEach((id) => formData.append('applicationId', id));
      formData.set('kind', kind);
      const result = await bulkSendOutreachAction(formData);
      setSelected(new Set());
      const parts = [`${result.sent} sent`];
      if (result.failed) parts.push(`${result.failed} failed`);
      if (result.skipped) parts.push(`${result.skipped} already contacted, skipped`);
      const detail = result.errors.length ? `${parts.join(', ')}. ${result.errors.join(' ')}` : parts.join(', ');
      push(
        result.failed ? 'sent with errors' : 'sent',
        result.failed ? `${detail} select the same applications and send again to retry the failed ones.` : detail,
        result.failed ? 'error' : 'success',
      );
      router.refresh();
    } finally {
      setPending(null);
    }
  }

  const bulkVerb =
    confirmKind === 'acceptance'
      ? 'send an acceptance email'
      : confirmKind === 'rejection'
        ? 'send a rejection email'
        : 'send a query email';

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
            {selected.size} selected — bulk actions send immediately once you confirm, straight to each applicant.
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
            <Input
              placeholder="search by name or email"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              containerStyle={{ width: 220, minWidth: 0 }}
              style={{ height: 34, boxSizing: 'border-box', fontSize: 'var(--fs-caption)', padding: '0 var(--space-3)' }}
            />
            <Button variant="secondary" size="sm" disabled={selected.size === 0 || pending !== null} onClick={() => setConfirmKind('acceptance')}>
              {pending === 'acceptance' ? 'sending…' : 'bulk send (acceptance)'}
            </Button>
            <Button variant="secondary" size="sm" disabled={selected.size === 0 || pending !== null} onClick={() => setConfirmKind('rejection')}>
              {pending === 'rejection' ? 'sending…' : 'bulk reject'}
            </Button>
            <Button variant="secondary" size="sm" disabled={selected.size === 0 || pending !== null} onClick={() => setConfirmKind('query')}>
              {pending === 'query' ? 'sending…' : 'bulk send (query)'}
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={confirmKind !== null}
        onClose={() => setConfirmKind(null)}
        title="confirm bulk action"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmKind(null)}>
              cancel
            </Button>
            <Button variant="cta" size="sm" onClick={() => confirmKind && runBulk(confirmKind)}>
              confirm
            </Button>
          </>
        }
      >
        {bulkVerb} for {selected.size} application{selected.size === 1 ? '' : 's'}? this sends right away — applications already
        contacted with this template are skipped.
      </Dialog>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
            {canSend && (
              <th style={{ padding: 'var(--space-3) var(--space-4)', width: 40 }}>
                <Checkbox checked={allSelected} onChange={toggleAll} aria-label="select all" />
              </th>
            )}
            {['organisation', 'poc contact', 'decision', 'outreach status', canSend ? 'send individually' : ''].filter(Boolean).map((h) => (
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
          {filteredApplications.map((app) => (
            <OutreachApplicationTableRow
              key={app.id}
              app={app}
              canSend={canSend}
              selected={selected.has(app.id)}
              onToggle={() => toggle(app.id)}
            />
          ))}
          {filteredApplications.length === 0 && (
            <tr>
              <td colSpan={canSend ? 6 : 4} style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                no applications match this filter.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}

function OutreachApplicationTableRow({
  app,
  canSend,
  selected,
  onToggle,
}: {
  app: OutreachApplicationRow;
  canSend: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [kind, setKind] = React.useState<'acceptance' | 'rejection' | 'query'>(app.internalDecision === 'YES' ? 'acceptance' : 'rejection');
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [preview, setPreview] = React.useState<{ subject: string; body: string } | null>(null);
  const [sending, setSending] = React.useState(false);
  // an in-app Dialog instead of window.confirm() — native confirm() dialogs are invisible to
  // (and silently auto-dismissed by) any CDP-automated browser, including the Claude Code
  // preview pane, which made this button look like it did nothing at all when tested there. A
  // real in-DOM dialog needs the same explicit click to proceed either way, so the "no email
  // sends without a human approving it" guarantee is unchanged.
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  async function openPreview() {
    setPreview(null);
    setPreviewOpen(true);
    setPreviewLoading(true);
    try {
      const formData = new FormData();
      formData.set('applicationId', app.id);
      formData.set('kind', kind);
      const result = await previewOutreachEmailAction(formData);
      setPreview(result);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function sendNow() {
    setConfirmOpen(false);
    setSending(true);
    try {
      const formData = new FormData();
      formData.set('applicationId', app.id);
      formData.set('kind', kind);
      const result = await sendIndividualOutreachAction(formData);
      if (result.status === 'SENT') push('sent', `${kind} email to ${app.orgName} sent.`, 'success');
      else {
        const reason = result.error ?? `${kind} email to ${app.orgName} could not be sent.`;
        push('send failed', `${reason} click send again to try again.`, 'error');
      }
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {canSend && (
          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <Checkbox checked={selected} onChange={onToggle} aria-label={`select ${app.orgName}`} />
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
        {canSend && (
          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <Select aria-label={`template for ${app.orgName}`} value={kind} onChange={(e) => setKind(e.target.value as 'acceptance' | 'rejection' | 'query')}>
                <option value="acceptance">acceptance</option>
                <option value="rejection">rejection</option>
                <option value="query">query</option>
              </Select>
              <Button variant="secondary" size="sm" onClick={openPreview}>
                preview
              </Button>
              <Button variant="cta" size="sm" disabled={sending} onClick={() => setConfirmOpen(true)}>
                {sending ? 'sending…' : 'send'}
              </Button>
            </div>
          </td>
        )}
      </tr>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} title={preview?.subject ?? 'preview'} width={680}>
        {previewLoading || !preview ? (
          <p style={{ color: 'var(--text-secondary)' }}>loading preview…</p>
        ) : (
          <iframe title="email preview" srcDoc={preview.body} style={{ width: '100%', height: 420, border: '1px solid var(--border-subtle)' }} />
        )}
      </Dialog>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="send this email?"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(false)}>
              cancel
            </Button>
            <Button variant="cta" size="sm" onClick={sendNow}>
              send now
            </Button>
          </>
        }
      >
        send a {kind} email to {app.pocFirstName} {app.pocLastName} ({app.email}) right now?
      </Dialog>
    </>
  );
}
