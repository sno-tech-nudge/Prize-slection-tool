'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/design-system';
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
  const [selected, setSelected] = React.useState<Set<string>>(new Set(assignedReviewerIds));
  const [pending, setPending] = React.useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setPending(true);
    const formData = new FormData();
    formData.set('applicationId', applicationId);
    selected.forEach((id) => formData.append('reviewerIds', id));
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {reviewers.map((r) => (
          <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--fs-small)', cursor: 'pointer' }}>
            <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
            <span>
              {r.name} <span style={{ color: 'var(--text-muted)' }}>· {r.email}</span>
            </span>
          </label>
        ))}
      </div>
      <Button variant="secondary" size="sm" disabled={pending} onClick={save} style={{ alignSelf: 'flex-start' }}>
        {pending ? 'saving…' : 'save reviewers'}
      </Button>
    </div>
  );
}
