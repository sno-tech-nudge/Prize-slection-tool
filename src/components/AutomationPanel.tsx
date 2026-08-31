'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Send, RefreshCw, Globe, FileText, type LucideIcon } from 'lucide-react';
import { Card, Button, Badge, Input, useToast } from '@/design-system';
import {
  scoreAllUnscoredAction,
  rerunMatcherAction,
  enrichAllAction,
  reassignAllInRotationOrderAction,
  reassignReviewerAction,
  reassignJurorAction,
  regenerateAllSynopsesAction,
} from '@/lib/automation/actions';
import { Users, ArrowRightLeft } from 'lucide-react';

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
  synopsisJobsInFlight: number;
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
  const { push } = useToast();
  const [scoring, setScoring] = React.useState(false);
  const [matching, setMatching] = React.useState(false);
  const [enriching, setEnriching] = React.useState(false);
  const [reassigning, setReassigning] = React.useState(false);
  const [movingAssignments, setMovingAssignments] = React.useState(false);
  const [movingJuror, setMovingJuror] = React.useState(false);
  const [regeneratingSynopses, setRegeneratingSynopses] = React.useState(false);
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

  async function runRegenerateSynopses() {
    setRegeneratingSynopses(true);
    try {
      const { queued } = await regenerateAllSynopsesAction();
      push('queued', `${queued} application synopsis regeneration${queued === 1 ? '' : 's'} queued — drains over the next few minutes.`, 'success');
      router.refresh();
    } finally {
      setRegeneratingSynopses(false);
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

  async function moveAssignments(formData: FormData) {
    setMovingAssignments(true);
    try {
      const result = await reassignReviewerAction(formData);
      if (result.error) {
        push('reassignment failed', result.error, 'error');
      } else {
        push(
          'reassigned',
          `moved ${result.movedAssignments} assignment${result.movedAssignments === 1 ? '' : 's'} and ${result.movedReviews} submitted review${result.movedReviews === 1 ? '' : 's'}.`,
          'success',
        );
        router.refresh();
      }
    } finally {
      setMovingAssignments(false);
    }
  }

  async function moveJuror(formData: FormData) {
    setMovingJuror(true);
    try {
      const result = await reassignJurorAction(formData);
      if (result.error) {
        push('reassignment failed', result.error, 'error');
      } else {
        push(
          'reassigned',
          `moved ${result.movedBenches} bench${result.movedBenches === 1 ? '' : 'es'} and ${result.movedScores} submitted score${result.movedScores === 1 ? '' : 's'}.`,
          'success',
        );
        router.refresh();
      }
    } finally {
      setMovingJuror(false);
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4) 0', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--fs-small)', color: 'var(--text-primary)' }}>
          <FileText size={14} color="var(--text-muted)" strokeLinejoin="miter" strokeLinecap="square" />
          application synopsis — regenerate every yes-marked application under the current prompt
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {stats.synopsisJobsInFlight > 0 && (
            <Badge tone="yellow">{stats.synopsisJobsInFlight} remaining</Badge>
          )}
          <Button variant="secondary" size="sm" disabled={regeneratingSynopses} onClick={runRegenerateSynopses}>
            {regeneratingSynopses ? 'queuing…' : 'regenerate all synopses'}
          </Button>
        </div>
      </div>

      <form
        action={moveAssignments}
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
          padding: 'var(--space-4) 0',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ flex: '0 0 100%', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--fs-small)', color: 'var(--text-primary)' }}>
          <ArrowRightLeft size={14} color="var(--text-muted)" strokeLinejoin="miter" strokeLinecap="square" />
          move one reviewer&apos;s assignments and submitted reviews to another account
        </div>
        <Input name="fromEmail" type="email" label="from" placeholder="old.login@example.org" required containerStyle={{ minWidth: 200, flex: 1 }} />
        <Input name="toEmail" type="email" label="to" placeholder="new.login@example.org" required containerStyle={{ minWidth: 200, flex: 1 }} />
        <Button type="submit" variant="secondary" size="sm" disabled={movingAssignments}>
          {movingAssignments ? 'moving…' : 'move reviewer'}
        </Button>
      </form>

      <form
        action={moveJuror}
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
          padding: 'var(--space-4) 0',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ flex: '0 0 100%', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--fs-small)', color: 'var(--text-primary)' }}>
          <ArrowRightLeft size={14} color="var(--text-muted)" strokeLinejoin="miter" strokeLinecap="square" />
          move one juror&apos;s bench membership and submitted scores to another account
        </div>
        <Input name="fromEmail" type="email" label="from" placeholder="old.login@example.org" required containerStyle={{ minWidth: 200, flex: 1 }} />
        <Input name="toEmail" type="email" label="to" placeholder="new.login@example.org" required containerStyle={{ minWidth: 200, flex: 1 }} />
        <Button type="submit" variant="secondary" size="sm" disabled={movingJuror}>
          {movingJuror ? 'moving…' : 'move juror'}
        </Button>
      </form>

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
