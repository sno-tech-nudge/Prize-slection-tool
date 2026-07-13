'use client';
import React from 'react';
import { Card, Badge, Button, Input, Select, Textarea } from '@/design-system';
import { DISPOSITIONS } from '@/lib/constants';
import { overrideAiEvaluationAction, clearAiOverrideAction } from '@/lib/scoring/override-actions';

export interface OverrideInfo {
  overrideComposite: number | null;
  overrideDisposition: string | null;
  overrideReason: string | null;
  overriddenByName: string | null;
  overriddenAt: string | null;
}

export function AiOverridePanel({
  evaluationId,
  applicationId,
  aiComposite,
  aiDisposition,
  override,
}: {
  evaluationId: string;
  applicationId: string;
  aiComposite: number;
  aiDisposition: string;
  override: OverrideInfo;
}) {
  const [editing, setEditing] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const isOverridden = override.overrideComposite != null;

  if (isOverridden && !editing) {
    return (
      <Card style={{ marginBottom: 'var(--space-6)', borderLeft: '4px solid var(--delta-yellow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
          <Badge tone="yellow">admin override in effect</Badge>
          <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>
            {override.overriddenByName} · {override.overriddenAt ? new Date(override.overriddenAt).toLocaleDateString('en-GB') : ''}
          </span>
        </div>
        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
          AI originally scored this <strong>{Math.round(aiComposite)}/100</strong> ({aiDisposition.toLowerCase().replace('_', ' ')}), overridden to{' '}
          <strong>{Math.round(override.overrideComposite ?? 0)}/100</strong> ({(override.overrideDisposition ?? '').toLowerCase().replace('_', ' ')}).
        </p>
        {override.overrideReason && (
          <p style={{ fontSize: 'var(--fs-small)', fontStyle: 'italic', fontFamily: 'var(--font-serif)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
            &ldquo;{override.overrideReason}&rdquo;
          </p>
        )}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            edit override
          </Button>
          <form
            action={async (formData) => {
              setPending(true);
              try {
                await clearAiOverrideAction(formData);
              } finally {
                setPending(false);
              }
            }}
          >
            <input type="hidden" name="evaluationId" value={evaluationId} />
            <input type="hidden" name="applicationId" value={applicationId} />
            <Button type="submit" variant="ghost" size="sm" disabled={pending}>
              {pending ? 'clearing…' : 'clear override, revert to AI score'}
            </Button>
          </form>
        </div>
      </Card>
    );
  }

  if (!editing) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setEditing(true)} style={{ alignSelf: 'flex-start' }}>
        override this score
      </Button>
    );
  }

  return (
    <Card style={{ marginBottom: 'var(--space-6)' }}>
      <h3 style={{ fontSize: 'var(--fs-h4)', marginBottom: 'var(--space-3)' }}>override the AI score</h3>
      <form
        action={async (formData) => {
          setPending(true);
          try {
            await overrideAiEvaluationAction(formData);
            setEditing(false);
          } finally {
            setPending(false);
          }
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
      >
        <input type="hidden" name="evaluationId" value={evaluationId} />
        <input type="hidden" name="applicationId" value={applicationId} />
        <Input name="overrideComposite" type="number" min={0} max={100} label="corrected composite (0-100)" defaultValue={override.overrideComposite ?? Math.round(aiComposite)} required />
        <Select name="overrideDisposition" label="corrected disposition" defaultValue={override.overrideDisposition ?? aiDisposition}>
          {DISPOSITIONS.map((d) => (
            <option key={d} value={d}>
              {d.toLowerCase().replace('_', ' ')}
            </option>
          ))}
        </Select>
        <Textarea name="overrideReason" label="reason (recorded on the audit trail)" rows={2} defaultValue={override.overrideReason ?? ''} required />
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Button type="submit" variant="cta" size="sm" disabled={pending}>
            {pending ? 'saving…' : 'save override'}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>
            cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
