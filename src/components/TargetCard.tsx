'use client';
import React from 'react';
import Link from 'next/link';
import { Card, Badge, Button, Textarea } from '@/design-system';
import { markContactedAction } from '@/lib/targets/actions';
import { OrgTitle } from '@/components/OrgTitle';

export interface TargetCardData {
  id: string;
  name: string;
  website: string | null;
  notes: string | null;
  status: string;
  matchConfidence: number | null;
  applications: { id: string; orgName: string; stageStatus: string }[];
  canManage: boolean;
}

const STATUS_TONE: Record<string, 'neutral' | 'red' | 'ink' | 'yellow' | 'outline'> = {
  NOT_APPLIED: 'outline',
  APPLIED: 'red',
  CONTACTED: 'ink',
};

export function TargetCard({ target }: { target: TargetCardData }) {
  const [showNote, setShowNote] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const matchedApp = target.applications[0];

  return (
    <Card accent={target.status !== 'NOT_APPLIED'} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3) var(--space-6)' }}>
        <div style={{ flexGrow: 1, flexBasis: 200, fontWeight: 'var(--fw-bold)' as unknown as number }}>
          <OrgTitle>{target.name}</OrgTitle>
        </div>
        {target.website && (
          <a
            href={target.website}
            target="_blank"
            rel="noreferrer"
            style={{ flexGrow: 1, flexBasis: 160, fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}
          >
            {target.website}
          </a>
        )}
        {target.matchConfidence != null && (
          <div style={{ flexShrink: 0, fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>
            match confidence: {Math.round(target.matchConfidence * 100)}%
          </div>
        )}
        {target.notes && <p style={{ flexGrow: 2, flexBasis: 240, fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', margin: 0 }}>{target.notes}</p>}
        {matchedApp && (
          <Link href={`/applications/${matchedApp.id}`} style={{ flexShrink: 0, fontSize: 'var(--fs-small)', color: 'var(--delta-red)', textDecoration: 'none' }}>
            view application →
          </Link>
        )}
        <Badge tone={STATUS_TONE[target.status] ?? 'neutral'}>{target.status.replace('_', ' ').toLowerCase()}</Badge>
        {target.canManage && target.status !== 'CONTACTED' && (
          <Button variant="ghost" size="sm" onClick={() => setShowNote((s) => !s)}>
            mark contacted
          </Button>
        )}
      </div>

      {showNote && (
        <form
          action={async (formData) => {
            setPending(true);
            try {
              await markContactedAction(formData);
              setShowNote(false);
            } finally {
              setPending(false);
            }
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxWidth: 480, marginLeft: 'auto' }}
        >
          <input type="hidden" name="targetId" value={target.id} />
          <Textarea name="notes" label="nudge note" rows={2} />
          <Button type="submit" variant="cta" size="sm" disabled={pending}>
            save
          </Button>
        </form>
      )}
    </Card>
  );
}
