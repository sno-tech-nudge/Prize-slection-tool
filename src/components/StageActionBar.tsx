'use client';
import React from 'react';
import { Button, Select, Textarea } from '@/design-system';
import { STAGE_STATUS_LABEL, type StageStatusValue } from '@/lib/constants';
import { transitionApplicationAction, setReviewStageAction } from '@/lib/applications/actions';
import { LEGAL_TRANSITIONS } from '@/lib/stages/rules';

const EARLY_PIPELINE_STAGES: StageStatusValue[] = ['SUBMITTED', 'SCREENING', 'UNDER_REVIEW'];

function pillStyle(active: boolean, disabled: boolean): React.CSSProperties {
  return {
    fontSize: 'var(--fs-caption)',
    textTransform: 'lowercase',
    padding: 'var(--space-2) var(--space-3)',
    border: `1px solid ${active ? 'var(--delta-red)' : 'var(--border-strong)'}`,
    background: active ? 'var(--delta-red)' : 'transparent',
    color: active ? 'var(--text-inverse)' : 'var(--text-primary)',
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    fontFamily: 'var(--font-sans)',
  };
}

/** Early-pipeline applications (not yet shortlisted) get a plain two-state pipeline-stage toggle
 *  instead of the full stage dropdown. This only moves `stageStatus` between SUBMITTED and
 *  UNDER_REVIEW — it is NOT the same signal as "reviewed" elsewhere in the app (that's derived
 *  purely from whether a HumanReview exists, see ReviewStatusDropdown / visibleApplicationWhere).
 *  Labels intentionally say "submitted"/"under review", not "reviewed"/"not reviewed", so this
 *  control can't be mistaken for the thing that drives the dashboard KPI and applications filter.
 *  Applications that have already progressed to shortlist or beyond fall through to the full
 *  stage dropdown below, since that real progression (jury / finalist / winner / reject) still
 *  needs the validated stage machine.
 *
 *  Every reviewer sees this exact toggle on every application, assigned to them or not —
 *  `canManage` only disables it, it never swaps in a different read-only view, so a reviewer
 *  looking at a colleague's application can still see the current stage at a glance. */
function ReviewStageToggle({
  applicationId,
  currentStage,
  canManage,
}: {
  applicationId: string;
  currentStage: StageStatusValue;
  canManage: boolean;
}) {
  const [pending, setPending] = React.useState(false);
  const underReview = currentStage === 'UNDER_REVIEW';
  const rejectOptions = LEGAL_TRANSITIONS[currentStage].filter((s) => s === 'REJECTED');
  const disabled = pending || !canManage;

  async function setStage(value: boolean) {
    if (!canManage) return;
    setPending(true);
    const formData = new FormData();
    formData.set('applicationId', applicationId);
    formData.set('reviewed', String(value));
    try {
      await setReviewStageAction(formData);
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button type="button" disabled={disabled} onClick={() => setStage(false)} style={pillStyle(!underReview, disabled)}>
          {STAGE_STATUS_LABEL.SUBMITTED}
        </button>
        <button type="button" disabled={disabled} onClick={() => setStage(true)} style={pillStyle(underReview, disabled)}>
          {STAGE_STATUS_LABEL.UNDER_REVIEW}
        </button>
      </div>
      {canManage && rejectOptions.length > 0 && (
        <form
          action={async (formData) => {
            setPending(true);
            try {
              await transitionApplicationAction(formData);
            } finally {
              setPending(false);
            }
          }}
          style={{ display: 'flex', gap: 'var(--space-3)' }}
        >
          <input type="hidden" name="applicationId" value={applicationId} />
          {rejectOptions.map((s) => (
            <button
              key={s}
              type="submit"
              name="toStatus"
              value={s}
              disabled={pending}
              style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
            >
              reject application
            </button>
          ))}
        </form>
      )}
    </div>
  );
}

/** `canManage` gates whether the controls actually do anything — true for admin always, and for
 *  a reviewer only on an application they're actually assigned to (canManageApplication, enforced
 *  again server-side in transitionApplicationAction/setReviewStageAction). It never hides the
 *  button view itself: every reviewer sees the same stage controls on every application, assigned
 *  to them or not, so they can always see the current status at a glance — clicking just does
 *  nothing (disabled) when it isn't theirs to change.
 *  Early-pipeline stages get the two-state toggle (see ReviewStageToggle). Later stages
 *  (shortlisted onward) get the full validated dropdown when editable, or a single highlighted
 *  pill showing the current stage when not — that form's reason field/audit trail doesn't have a
 *  meaningful disabled "view" equivalent, so it collapses to the same pill style used everywhere
 *  else in this panel instead of a dead form. */
export function StageActionBar({
  applicationId,
  currentStage,
  canManage,
}: {
  applicationId: string;
  currentStage: StageStatusValue;
  canManage: boolean;
}) {
  if (EARLY_PIPELINE_STAGES.includes(currentStage)) {
    return <ReviewStageToggle applicationId={applicationId} currentStage={currentStage} canManage={canManage} />;
  }
  if (!canManage) {
    return (
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button type="button" disabled style={pillStyle(true, true)}>
          {STAGE_STATUS_LABEL[currentStage]}
        </button>
      </div>
    );
  }
  return <LegalTransitionForm applicationId={applicationId} currentStage={currentStage} />;
}

/** Full validated stage dropdown for applications already past the early-review zone —
 *  shortlist/jury/finalist/winner/reject progression. Withdrawal isn't offered as an admin-side
 *  action here — WITHDRAWN remains a legal stage (e.g. for data already in that state) but no UI
 *  on the individual application initiates it. */
function LegalTransitionForm({ applicationId, currentStage }: { applicationId: string; currentStage: StageStatusValue }) {
  const options = (LEGAL_TRANSITIONS[currentStage] ?? []).filter((s) => s !== 'WITHDRAWN');
  const [toStatus, setToStatus] = React.useState<string>(options[0] ?? '');
  const [pending, setPending] = React.useState(false);

  if (options.length === 0) {
    return (
      <div style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
        this application is in a terminal state ({STAGE_STATUS_LABEL[currentStage]}). no further transitions are possible.
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        setPending(true);
        try {
          await transitionApplicationAction(formData);
        } finally {
          setPending(false);
        }
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}
    >
      <input type="hidden" name="applicationId" value={applicationId} />
      <Select name="toStatus" value={toStatus} onChange={(e) => setToStatus(e.target.value)} label="move to">
        {options.map((s) => (
          <option key={s} value={s}>
            {STAGE_STATUS_LABEL[s]}
          </option>
        ))}
      </Select>
      <Textarea name="reason" label="reason (recorded in the audit log)" rows={2} placeholder="why is this application moving stage?" />
      <Button type="submit" variant="cta" disabled={pending}>
        {pending ? 'saving…' : 'confirm transition'}
      </Button>
    </form>
  );
}
