'use client';

const SECTIONS = [
  { id: 'section-organisation-profile', label: 'organisation profile' },
  { id: 'section-ai-summary', label: 'AI summary' },
  { id: 'section-model', label: 'model' },
  { id: 'section-tech-and-tools', label: 'tech and tools' },
  { id: 'section-experience-impact', label: 'experience & impact' },
  // only ever rendered on the jury's own view — see the excludeIds passed from
  // ApplicationMainContent, which drops this for every other role.
  { id: 'section-internal-reviewer-remarks', label: 'internal reviewer remarks' },
  { id: 'section-scoring', label: 'scoring & evaluation' },
  { id: 'section-scraper', label: 'scraper data' },
];

/** Quick-jump nav mirroring the real application form's own step names (organisation profile /
 *  model / tech and tools / experience & impact) — everything stays visible on one page (this is
 *  the "very detailed view", nothing hidden), these buttons just scroll to the right spot.
 *  `excludeIds` drops entries whose target section isn't rendered for the current viewer (jury
 *  don't get scoring & evaluation / scraper data, so those jump buttons would go nowhere).
 *  `labelOverrides` renames an entry's label without changing its target id — used for the real
 *  JURY role, whose trimmed field set reads better under "organisation details" / "metrics" than
 *  the admin-facing "organisation profile" / "experience & impact" names. */
export function SectionJumpNav({ excludeIds, labelOverrides }: { excludeIds?: string[]; labelOverrides?: Record<string, string> } = {}) {
  const sections = (excludeIds ? SECTIONS.filter((s) => !excludeIds.includes(s.id)) : SECTIONS).map((s) =>
    labelOverrides?.[s.id] ? { ...s, label: labelOverrides[s.id] } : s,
  );
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
