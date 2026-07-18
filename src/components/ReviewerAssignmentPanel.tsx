'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Select, Button } from '@/design-system';
import { setApplicationReviewersAction } from '@/lib/applications/actions';

export interface ReviewerOption {
  id: string;
  name: string;
  email: string;
}

export function ReviewerAssignmentPanel({
  applicationId,
  reviewers,
  assignedReviewerIds,
}: {
  applicationId: string;
  reviewers: ReviewerOption[];
  assignedReviewerIds: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<string>(assignedReviewerIds[0] ?? '');
  const [pending, setPending] = React.useState(false);

  async function save(value: string) {
    setSelected(value);
    setPending(true);
    const formData = new FormData();
    formData.set('applicationId', applicationId);
    if (value) formData.append('reviewerIds', value);
    try {
      await setApplicationReviewersAction(formData);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  if (reviewers.length === 0) {
    return <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>no reviewer accounts exist yet — add one in settings.</p>;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
      <Select
        aria-label="assigned reviewer"
        value={selected}
        disabled={pending}
        onChange={(e) => save(e.target.value)}
        containerStyle={{ minWidth: 260 }}
      >
        <option value="">unassigned</option>
        {reviewers.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name} · {r.email}
          </option>
        ))}
      </Select>
      {pending && <Button variant="ghost" size="sm" disabled>saving…</Button>}
    </div>
  );
}
