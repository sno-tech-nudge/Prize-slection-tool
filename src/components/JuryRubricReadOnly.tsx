import { JURY_RUBRIC_CRITERIA } from '@/lib/scoring/juryRubric';
import { JurySectionInfo } from '@/components/JurySectionInfo';

/** A read-only reference view of the jury rubric — same heading/weightage/establish-text/info-
 *  button layout as the actual scoring form (JuryScoringForm.tsx), minus the score input and
 *  comment box, since this is just for looking the rubric up, not scoring against it. Sourced
 *  from the same JURY_RUBRIC_CRITERIA data the scoring form uses, not whatever file happens to be
 *  uploaded in settings — a rubric needs the same designed layout every time it's referenced, not
 *  a raw text dump of an arbitrary upload. */
export function JuryRubricReadOnly() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {JURY_RUBRIC_CRITERIA.map((c) => (
        <div key={c.key} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
              <strong style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)' as unknown as number }}>{c.label}</strong>
              <JurySectionInfo label={c.label} coreQuestions={c.coreQuestions} />
            </div>
            <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', whiteSpace: 'nowrap', flexShrink: 0 }}>/ {c.maxScore}</span>
          </div>
          <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)', margin: 0 }}>{c.establishText}</p>
        </div>
      ))}
    </div>
  );
}
