'use client';
import React from 'react';
import { Card, Badge } from '@/design-system';
import { CompositeBadge } from '@/components/StatusBadges';
import { parseCriteria } from '@/lib/scoring/parse';
import { RUBRIC_CRITERIA, RUBRIC_SECTIONS } from '@/lib/scoring/rubric';
import type { JuryScoresTableRow } from '@/components/JuryScoresTable';

/** The internal jury dashboard's detail view — a single full-width "jury score card" instead of
 *  the regular application content: an average score up top, then every juror's per-criterion
 *  score and comment lined up side by side. No admin sidebar, no application content — this page
 *  is purely for reading jury progress; "view application" links out to the full record. */
export function JuryScoreCard({ juryScores }: { juryScores: JuryScoresTableRow[] }) {
  const scoresByJuror = React.useMemo(
    () => juryScores.map((s) => ({ score: s, byKey: Object.fromEntries(parseCriteria(s.criteria).map((c) => [c.key, c.score])) })),
    [juryScores],
  );

  const avgScore = juryScores.length > 0 ? Math.round(juryScores.reduce((sum, s) => sum + s.composite, 0) / juryScores.length) : null;

  if (juryScores.length === 0) {
    return (
      <Card>
        <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-2)' }}>jury score card</h2>
        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>no jury scores yet.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>jury score card</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', paddingBottom: 'var(--space-6)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--text-muted)' }}>
          avg score
        </div>
        {avgScore !== null && <CompositeBadge score={avgScore} />}
        <Badge tone="outline">{juryScores.length} juror{juryScores.length === 1 ? '' : 's'} scored</Badge>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
              <th style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--text-secondary)' }}>
                criterion
              </th>
              {scoresByJuror.map(({ score }) => (
                <th
                  key={score.id}
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    fontSize: 'var(--fs-caption)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--ls-wide)',
                    color: 'var(--text-secondary)',
                    textAlign: 'right',
                  }}
                >
                  {score.juror.name}
                  <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', textTransform: 'none', letterSpacing: 0 }}>
                    {score.juror.benches.length > 0 ? score.juror.benches.map((b) => b.name).join(', ') : 'unassigned bench'}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RUBRIC_SECTIONS.map((section) => (
              <React.Fragment key={section.key}>
                <tr>
                  <td colSpan={scoresByJuror.length + 1} style={{ padding: 'var(--space-2) var(--space-3) var(--space-1)', fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', fontWeight: 'var(--fw-bold)' as unknown as number }}>
                    {section.label}
                  </td>
                </tr>
                {RUBRIC_CRITERIA.filter((c) => c.section === section.key).map((c) => (
                  <tr key={c.key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--fs-small)' }}>
                      {c.label} <span style={{ color: 'var(--text-muted)' }}>/ {c.maxScore}</span>
                    </td>
                    {scoresByJuror.map(({ score, byKey }) => (
                      <td key={score.id} style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--fs-small)', textAlign: 'right', fontWeight: 'var(--fw-bold)' as unknown as number }}>
                        {byKey[c.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)' as unknown as number }}>composite</td>
              {scoresByJuror.map(({ score }) => (
                <td key={score.id} style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                    <CompositeBadge score={score.composite} />
                    <Badge tone="outline">{score.verdict.toLowerCase()}</Badge>
                  </div>
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)' as unknown as number, verticalAlign: 'top' }}>comment</td>
              {scoresByJuror.map(({ score }) => (
                <td key={score.id} style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', textAlign: 'left', verticalAlign: 'top', whiteSpace: 'pre-wrap' }}>
                  {score.comment || '—'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}
