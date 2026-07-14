'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/design-system';
import { setReviewStageAction } from '@/lib/applications/actions';

const EARLY_PIPELINE_STAGES = ['SUBMITTED', 'SCREENING', 'UNDER_REVIEW'];

/** Compact dropdown for toggling an application's reviewed / not-reviewed status straight from
 *  the applications table, without opening the full record. Same underlying action as the stage
 *  action panel's toggle (src/components/StageActionBar.tsx) — only shown as an editable control
 *  for early-pipeline applications (not yet shortlisted), since setReviewStage can move an
 *  application backward to SUBMITTED and that shouldn't clobber real shortlist/jury progress.
 *  Applications past that point show a plain read-only badge instead. */
export function ReviewStatusDropdown({
  applicationId,
  stageStatus,
  canManage,
}: {
  applicationId: string;
  stageStatus: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const reviewed = !EARLY_PIPELINE_STAGES.includes(stageStatus) || stageStatus === 'UNDER_REVIEW';

  if (!canManage || !EARLY_PIPELINE_STAGES.includes(stageStatus)) {
    return <Badge tone={reviewed ? 'red' : 'outline'}>{reviewed ? 'reviewed' : 'not reviewed'}</Badge>;
  }

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value === 'true';
    setPending(true);
    const formData = new FormData();
    formData.set('applicationId', applicationId);
    formData.set('reviewed', String(value));
    try {
      await setReviewStageAction(formData);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <select
      value={String(reviewed)}
      disabled={pending}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      aria-label="review status"
      style={{
        appearance: 'none',
        fontFamily: 'var(--font-sans)',
        fontSize: 'var(--fs-caption)',
        textTransform: 'lowercase',
        padding: 'var(--space-2) var(--space-3)',
        background: reviewed ? 'var(--delta-red)' : 'transparent',
        color: reviewed ? 'var(--text-inverse)' : 'var(--text-primary)',
        border: `1px solid ${reviewed ? 'var(--delta-red)' : 'var(--border-strong)'}`,
        cursor: pending ? 'default' : 'pointer',
      }}
    >
      <option value="false">not reviewed</option>
      <option value="true">reviewed</option>
    </select>
  );
}
