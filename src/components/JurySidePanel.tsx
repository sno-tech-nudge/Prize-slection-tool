import { Card } from '@/design-system';
import { JuryScoringForm } from '@/components/JuryScoringForm';
import type { JuryScore } from '@prisma/client';

export interface JurySidePanelProps {
  applicationId: string;
  myScore?: JuryScore;
}

/** The jury's scoring workflow, relocated from the old standalone /jury/[id] "reviewer console"
 *  into the right panel of the unified application detail page. Jury only ever sees their own
 *  score — no other jurors' verdicts, scores, or comments are shown here at any point, blind or
 *  otherwise, so there's no cross-juror influence on an independent read. */
export function JurySidePanel({ applicationId, myScore }: JurySidePanelProps) {
  return (
    <Card accent accentSide="left" style={{ marginBottom: 'var(--space-6)' }}>
      <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-1)' }}>{myScore ? 'update your verdict' : 'your jury score'}</h2>
      <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', marginBottom: 'var(--space-5)' }}>
        score independently — only you can see your own verdict here.
      </p>
      <JuryScoringForm applicationId={applicationId} existing={myScore} />
    </Card>
  );
}
