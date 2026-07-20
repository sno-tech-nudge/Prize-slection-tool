import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AngularBanner, Card, Badge } from '@/design-system';
import { CompositeBadge, SolutionCategoryTag } from '@/components/StatusBadges';
import { JuryScoringForm } from '@/components/JuryScoringForm';
import { getCurrentUser } from '@/lib/auth/session';
import { getApplicationDetail } from '@/lib/applications/queries';
import { parseCriteria } from '@/lib/scoring/parse';
import { RUBRIC_CRITERIA } from '@/lib/scoring/rubric';

function driveEmbedUrl(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
  return null;
}

export default async function JuryApplicationPage({ params }: { params: { id: string } }) {
  const [app, user] = await Promise.all([getApplicationDetail(params.id), getCurrentUser()]);
  if (!app) notFound();

  const latestEval = app.aiEvaluations[0];
  const aiCriteria = latestEval ? parseCriteria(latestEval.criteria) : [];
  const myScore = app.juryScores.find((s) => s.jurorId === user?.id);
  const hasSubmitted = !!myScore || user?.role === 'ADMIN';
  const embed = driveEmbedUrl(app.pitchDeckUrl);

  const humanAvg =
    app.humanReviews.length > 0 ? Math.round(app.humanReviews.reduce((a, r) => a + r.composite, 0) / app.humanReviews.length) : null;

  return (
    <div>
      <AngularBanner
        eyebrow="jury review · blind until you submit"
        title={app.orgName}
        subtitle={`${app.pocFirstName} ${app.pocLastName} · ${app.location ?? 'location not provided'}`}
        action={
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <SolutionCategoryTag category={app.solutionCategory} />
            {latestEval && <CompositeBadge score={latestEval.composite} />}
          </div>
        }
      />

      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-xl)', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)' }}>
        <div>
          <Card style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-3)' }}>problem, in their words</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-small)', lineHeight: 'var(--lh-relaxed)' }}>{app.problemAddressing ?? '—'}</p>
          </Card>
          <Card style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-3)' }}>solution, in their words</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-small)', lineHeight: 'var(--lh-relaxed)' }}>{app.aboutSolution ?? '—'}</p>
          </Card>

          {embed && (
            <Card style={{ marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-3)' }}>pitch deck</h2>
              <iframe title="pitch deck" src={embed} width="100%" height="420" style={{ border: 'none' }} />
            </Card>
          )}

          {latestEval && (
            <Card accent style={{ marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-3)' }}>AI digest</h2>
              <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>{latestEval.summary}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                {aiCriteria.map((c) => {
                  const def = RUBRIC_CRITERIA.find((r) => r.key === c.key);
                  return (
                    <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-small)' }}>
                      <span>{def?.label ?? c.key}</span>
                      <strong>{c.score} / {def?.maxScore ?? 5}</strong>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <Card>
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-3)' }}>reviewer consensus digest</h2>
            {humanAvg != null ? (
              <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
                {app.humanReviews.length} reviewer{app.humanReviews.length === 1 ? '' : 's'} scored this application, averaging {humanAvg}/100.
              </p>
            ) : (
              <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>no human reviews on file yet.</p>
            )}
          </Card>
        </div>

        <div>
          <Card accent accentSide="left" style={{ marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-1)' }}>{myScore ? 'update your verdict' : 'your jury score'}</h2>
            <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', marginBottom: 'var(--space-5)' }}>
              blind by default. other jurors&apos; scores unlock once you submit yours.
            </p>
            <JuryScoringForm applicationId={app.id} existing={myScore} />
          </Card>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--fs-h3)' }}>jury aggregate</h2>
              {!hasSubmitted && <Badge tone="yellow">locked</Badge>}
            </div>
            {!hasSubmitted ? (
              <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
                {app.juryScores.length} juror{app.juryScores.length === 1 ? ' has' : 's have'} submitted so far. submit your own score to see everyone&apos;s verdict.
              </p>
            ) : app.juryScores.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {app.juryScores.map((s) => (
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

          <div style={{ marginTop: 'var(--space-4)' }}>
            <Link href="/jury" style={{ fontSize: 'var(--fs-small)', color: 'var(--delta-red)', textDecoration: 'none' }}>
              ← back to jury console
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
