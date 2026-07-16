'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Send, RefreshCw, Globe, type LucideIcon } from 'lucide-react';
import { Card, Button, Badge } from '@/design-system';
import { scoreAllUnscoredAction, rerunMatcherAction, enrichAllAction, reassignAllInRotationOrderAction } from '@/lib/automation/actions';
import { Users } from 'lucide-react';

export interface AutomationStats {
  totalApps: number;
  scoredApps: number;
  matchedTargets: number;
  totalTargets: number;
  queuedOutbox: number;
  sentOutbox: number;
  autoSendRejections: boolean;
  jobStats: { PENDING: number; RUNNING: number; DONE: number; FAILED: number };
  sitesToEnrich: number;
  enrichedApps: number;
}

function TaskRow({
  icon: Icon,
  label,
  done,
  total,
  actionLabel,
  pendingLabel,
  pending,
  disabled,
  onRun,
}: {
  icon: LucideIcon;
  label: string;
  done: number;
  total: number;
  actionLabel: string;
  pendingLabel: string;
  pending: boolean;
  disabled: boolean;
  onRun: () => void;
}) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--space-4) 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-small)', marginBottom: 'var(--space-2)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--text-primary)' }}>
            <Icon size={14} color="var(--text-muted)" strokeLinejoin="miter" strokeLinecap="square" />
            {label}
          </span>
          <strong>
            {done} / {total}
          </strong>
        </div>
        <div style={{ background: 'var(--grey-100)', height: 6 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--delta-red)' }} />
        </div>
      </div>
      <Button variant="secondary" size="sm" disabled={disabled || pending} onClick={onRun}>
        {pending ? pendingLabel : actionLabel}
      </Button>
    </div>
  );
}

export function AutomationPanel({ stats }: { stats: AutomationStats }) {
  const router = useRouter();
  const [scoring, setScoring] = React.useState(false);
  const [matching, setMatching] = React.useState(false);
  const [enriching, setEnriching] = React.useState(false);
  const [reassigning, setReassigning] = React.useState(false);
  const jobsInFlight = stats.jobStats.PENDING + stats.jobStats.RUNNING;

  async function runScore() {
    setScoring(true);
    try {
      await scoreAllUnscoredAction();
      router.refresh();
    } finally {
      setScoring(false);
    }
  }

  async function runEnrich() {
    setEnriching(true);
    try {
      await enrichAllAction();
      router.refresh();
    } finally {
      setEnriching(false);
    }
  }

  async function runMatch() {
    setMatching(true);
    try {
      await rerunMatcherAction();
      router.refresh();
    } finally {
      setMatching(false);
    }
  }

  async function runReassign() {
    setReassigning(true);
    try {
      await reassignAllInRotationOrderAction();
      router.refresh();
    } finally {
      setReassigning(false);
    }
  }

  return (
    <Card accent accentSide="left">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
        <h2 style={{ fontSize: 'var(--fs-h4)' }}>pipeline automation</h2>
        {jobsInFlight > 0 && (
          <Badge tone="yellow">
            {jobsInFlight} job{jobsInFlight === 1 ? '' : 's'} in queue
          </Badge>
        )}
      </div>

      <div>
        <TaskRow
          icon={Sparkles}
          label="AI evaluations"
          done={stats.scoredApps}
          total={stats.totalApps}
          actionLabel="score unscored"
          pendingLabel="queuing…"
          pending={scoring}
          disabled={stats.scoredApps >= stats.totalApps}
          onRun={runScore}
        />
        <TaskRow
          icon={Globe}
          label="website enrichment"
          done={stats.enrichedApps}
          total={stats.sitesToEnrich}
          actionLabel="enrich websites"
          pendingLabel="queuing…"
          pending={enriching}
          disabled={stats.enrichedApps >= stats.sitesToEnrich}
          onRun={runEnrich}
        />
        <TaskRow
          icon={RefreshCw}
          label="target wishlist matching"
          done={stats.matchedTargets}
          total={stats.totalTargets}
          actionLabel="re-run matcher"
          pendingLabel="queuing…"
          pending={matching}
          disabled={false}
          onRun={runMatch}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--fs-small)', color: 'var(--text-primary)' }}>
          <Users size={14} color="var(--text-muted)" strokeLinejoin="miter" strokeLinecap="square" />
          reviewer rotation (1-5 round robin)
        </span>
        <Button variant="secondary" size="sm" disabled={reassigning} onClick={runReassign}>
          {reassigning ? 'reassigning…' : 're-run rotation'}
        </Button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--fs-small)' }}>
          <Send size={14} strokeLinejoin="miter" strokeLinecap="square" color="var(--text-muted)" />
          <span>
            rejection bot: {stats.sentOutbox} sent{stats.queuedOutbox > 0 ? `, ${stats.queuedOutbox} queued` : ''}
          </span>
        </div>
        <Badge tone={stats.autoSendRejections ? 'red' : 'outline'}>{stats.autoSendRejections ? 'auto-send on' : 'manual approval'}</Badge>
      </div>
    </Card>
  );
}
