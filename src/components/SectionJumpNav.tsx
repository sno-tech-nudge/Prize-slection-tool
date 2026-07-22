'use client';

const SECTIONS = [
  { id: 'section-organisation-profile', label: 'organisation profile' },
  { id: 'section-model', label: 'model' },
  { id: 'section-tech-and-tools', label: 'tech and tools' },
  { id: 'section-experience-impact', label: 'experience & impact' },
  { id: 'section-scoring', label: 'scoring & evaluation' },
  { id: 'section-scraper', label: 'scraper' },
];

/** Quick-jump nav mirroring the real application form's own step names (organisation profile /
 *  model / tech and tools / experience & impact) — everything stays visible on one page (this is
 *  the "very detailed view", nothing hidden), these buttons just scroll to the right spot. */
export function SectionJumpNav() {
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
      {SECTIONS.map((s) => (
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
