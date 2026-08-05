'use client';
import React from 'react';
import { X, ListChecks } from 'lucide-react';
import { Button } from '@/design-system';
import { RUBRIC_CRITERIA, RUBRIC_SECTIONS } from '@/lib/scoring/rubric';

export function RubricSidePanel() {
  const [open, setOpen] = React.useState(false);

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
              width: 460,
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
                  the team&apos;s real selection rubric — 14 scored criteria across 4 sections (each on its own point scale, summing
                  to 100) plus a free-text USP line.
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-7)' }}>
              {RUBRIC_SECTIONS.map((section) => (
                <div key={section.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-4)' }}>
                    <h3 style={{ fontSize: 'var(--fs-small)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--text-primary)' }}>
                      {section.label}
                    </h3>
                    {section.weight > 0 && (
                      <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--delta-red)', fontWeight: 'var(--fw-bold)' as unknown as number }}>
                        weight {section.weight}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {RUBRIC_CRITERIA.filter((c) => c.section === section.key).map((c, i) => (
                      <div key={c.key} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 'var(--space-2)' }}>
                          <span style={{ fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)' as unknown as number, color: 'var(--text-primary)' }}>
                            {i + 1}. {c.label}
                          </span>
                          <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>
                            {c.maxScore > 0 ? `max ${c.maxScore}` : 'not scored'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {c.description.map((d) => (
                            <div key={d} style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--fs-caption)' }}>
                              <span style={{ color: 'var(--delta-red)', flexShrink: 0 }}>·</span>
                              <span style={{ color: 'var(--text-secondary)' }}>{d}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
