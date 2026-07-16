'use client';
import React from 'react';
import { X, ListChecks } from 'lucide-react';
import { Button } from '@/design-system';
import { RUBRIC_CRITERIA } from '@/lib/scoring/rubric';

export function RubricSidePanel({ weights }: { weights: Record<string, number> }) {
  const [open, setOpen] = React.useState(false);
  const maxWeight = Math.max(...RUBRIC_CRITERIA.map((c) => weights[c.key] ?? 1), 1);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <ListChecks size={14} strokeLinejoin="miter" strokeLinecap="square" />
          explore rubric
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
              width: 420,
              maxWidth: '100%',
              height: '100%',
              background: 'var(--surface-card)',
              borderLeft: '4px solid var(--delta-red)',
              overflowY: 'auto',
              padding: 'var(--space-6)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
              <div>
                <h2 style={{ fontSize: 'var(--fs-h4)' }}>scoring rubric</h2>
                <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                  the 8 criteria the AI and human reviewers score every application against, 0-5 each.
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {RUBRIC_CRITERIA.map((c, i) => {
                const weight = weights[c.key] ?? 1;
                const pct = Math.round((weight / maxWeight) * 100);
                return (
                  <div key={c.key} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-2)' }}>
                      <span style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)' as unknown as number, color: 'var(--text-primary)' }}>
                        {i + 1}. {c.label}
                      </span>
                      <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>weight {weight}</span>
                    </div>
                    <div style={{ background: 'var(--grey-100)', height: 6, marginBottom: 'var(--space-2)' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--delta-red)' }} />
                    </div>
                    <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)' }}>{c.prompt}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
