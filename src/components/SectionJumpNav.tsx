'use client';

export interface JumpNavSection {
  id: string;
  label: string;
}

/** Quick-jump nav — renders exactly the sections passed in, in the exact order given. The caller
 *  (ApplicationMainContent) computes this list from what actually rendered, in its actual render
 *  order, so a hidden section or a reordered one can never drift out of sync with these tabs the
 *  way a separate hardcoded list once did. */
export function SectionJumpNav({ sections }: { sections: JumpNavSection[] }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-2)',
        flexWrap: 'wrap',
        marginBottom: 'var(--space-6)',
        position: 'sticky',
        top: 0,
        background: 'var(--surface-canvas)',
        zIndex: 'var(--z-sticky)' as unknown as number,
        paddingTop: 'var(--space-2)',
        paddingBottom: 'var(--space-3)',
      }}
    >
      {sections.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          style={{
            fontSize: 'var(--fs-caption)',
            textTransform: 'lowercase',
            padding: 'var(--space-2) var(--space-3)',
            border: '1px solid var(--border-strong)',
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
