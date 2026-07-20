'use client';
import React from 'react';
import type { HumanReview } from '@prisma/client';
import { X, ClipboardCheck } from 'lucide-react';
import { Button } from '@/design-system';
import { ReviewScoringForm } from '@/components/ReviewScoringForm';

export function ReviewSidePanel({
  applicationId,
  orgName,
  existing,
}: {
  applicationId: string;
  orgName: string;
  existing?: HumanReview;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="cta" onClick={() => setOpen(true)}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <ClipboardCheck size={14} strokeLinejoin="miter" strokeLinecap="square" />
          {existing ? 'update your review' : 'review'}
        </span>
      </Button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', justifyContent: 'flex-end' }}>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'var(--surface-ink)', opacity: 0.5 }}
          />
          <div
            style={{
              position: 'relative',
              width: 520,
              maxWidth: '100%',
              height: '100%',
              background: 'var(--surface-card)',
              borderLeft: '4px solid var(--delta-red)',
              overflowY: 'auto',
              padding: 'var(--space-6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-2)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--fs-h4)' }}>score {orgName}</h2>
                <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                  score every criterion against the rubric below, then submit your recommendation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="close"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--space-1)' }}
              >
                <X size={18} strokeLinejoin="miter" strokeLinecap="square" color="var(--text-secondary)" />
              </button>
            </div>

            <ReviewScoringForm applicationId={applicationId} existing={existing} onSubmitted={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
