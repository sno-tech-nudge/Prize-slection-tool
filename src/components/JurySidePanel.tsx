import { Card, Badge } from '@/design-system';
import { JuryScoringForm } from '@/components/JuryScoringForm';
import type { JuryScore } from '@prisma/client';

export interface JurySidePanelProps {
  applicationId: string;
  myScore?: JuryScore;
  juryScores: { id: string; composite: number; verdict: string; comment: string | null; juror: { name: string } }[];
  isAdmin: boolean;
}

/** The jury's scoring workflow, relocated from the old standalone /jury/[id] "reviewer console"
 *  into the right panel of the unified application detail page — same blind-until-submit logic,
 *  just living alongside the rest of the application instead of a separate route. */
export function JurySidePanel({ applicationId, myScore, juryScores, isAdmin }: JurySidePanelProps) {
  const hasSubmitted = !!myScore || isAdmin;

  return (
    <>
      <Card accent accentSide="left" style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-1)' }}>{myScore ? 'update your verdict' : 'your jury score'}</h2>
        <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', marginBottom: 'var(--space-5)' }}>
          blind by default. other jurors&apos; scores unlock once you submit yours.
        </p>
        <JuryScoringForm applicationId={applicationId} existing={myScore} />
      </Card>

      <Card style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: 'var(--fs-h3)' }}>jury aggregate</h2>
          {!hasSubmitted && <Badge tone="yellow">locked</Badge>}
        </div>
        {!hasSubmitted ? (
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
            {juryScores.length} juror{juryScores.length === 1 ? ' has' : 's have'} submitted so far. submit your own score to see everyone&apos;s
            verdict.
          </p>
        ) : juryScores.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {juryScores.map((s) => (
              <div key={s.id} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{s.juror.name}</strong>
                  <span>
                    {s.composite}/100 · {s.verdict.toLowerCase()}
                  </span>
                </div>
                <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>{s.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>no jury scores yet. you&apos;re first.</p>
        )}
      </Card>
    </>
  );
}
