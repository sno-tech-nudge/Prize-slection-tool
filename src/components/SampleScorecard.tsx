import { JURY_RUBRIC_CRITERIA, JURY_FRAMING_QUESTION } from '@/lib/scoring/juryRubric';
import { JurySectionInfo } from '@/components/JurySectionInfo';

/** A read-only preview of the real jury rubric — same framing question, criteria, numbering, and
 *  "i" button core questions as the actual scoring form, minus the score input and comment box,
 *  so a juror can see what they'll be asked to score before they start. */
export function SampleScorecard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)', fontStyle: 'italic', marginBottom: 'var(--space-4)' }}>
        {JURY_FRAMING_QUESTION}
      </p>
      {JURY_RUBRIC_CRITERIA.map((c, i) => (
        <div
          key={c.key}
          style={{
            borderTop: i === 0 ? 'none' : '1px solid var(--border-subtle)',
            paddingTop: i === 0 ? 0 : 'var(--space-4)',
            paddingBottom: 'var(--space-4)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <strong style={{ fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)' as unknown as number }}>
              {i + 1}. {c.label}
            </strong>
            <JurySectionInfo label={c.label} coreQuestions={c.coreQuestions} />
          </div>
          <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', lineHeight: 'var(--lh-relaxed)', margin: 'var(--space-2) 0 0' }}>
            {c.establishText}
          </p>
        </div>
      ))}
    </div>
  );
}
