'use client';
import React from 'react';
import { Card, Badge } from '@/design-system';
import { CompositeBadge } from '@/components/StatusBadges';
import { parseCriteria } from '@/lib/scoring/parse';
import { JURY_RUBRIC_CRITERIA } from '@/lib/scoring/juryRubric';

export interface JuryScoresTableRow {
  id: string;
  composite: number;
  verdict: string;
  comment: string | null;
  criteria: string;
  juror: { name: string; benches: { name: string }[] };
}

/** Every juror's score on this application — a short overview row per juror (who, which bench,
 *  overall score), then one comparison table with every juror's per-criterion scores and
 *  comments lined up side by side, so there's exactly one place to read the full breakdown
 *  instead of repeating it in a separate per-juror toggle. Shared between the admin sidebar (on
 *  the regular application page) and the internal jury-dashboard page. */
export function JuryScoresTable({ juryScores }: { juryScores: JuryScoresTableRow[] }) {
  const scoresByJuror = React.useMemo(
    () => juryScores.map((s) => ({ score: s, byKey: Object.fromEntries(parseCriteria(s.criteria).map((c) => [c.key, c])) })),
    [juryScores],
  );

  if (juryScores.length === 0) {
    return (
      <Card style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>juror scores &amp; comments</h2>
        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>no jury scores yet.</p>
      </Card>
    );
  }

  return (
    <Card style={{ marginBottom: 'var(--space-6)' }}>
      <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-4)' }}>juror scores &amp; comments</h2>

      <div style={{ overflowX: 'auto', marginBottom: 'var(--space-6)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
              {['juror', 'benches', 'score'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    fontSize: 'var(--fs-caption)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--ls-wide)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {juryScores.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)' as unknown as number }}>
                  {s.juror.name}
                </td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
                  {s.juror.benches.length > 0 ? s.juror.benches.map((b) => b.name).join(', ') : '—'}
                </td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <CompositeBadge score={s.composite} />
                    <Badge tone="outline">{s.verdict.toLowerCase()}</Badge>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* every juror's per-criterion score and comment lined up side by side */}
      <div>
        <div style={{ fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
          full rubric comparison
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
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {JURY_RUBRIC_CRITERIA.map((c) => (
                <tr key={c.key} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--fs-small)', verticalAlign: 'top' }}>
                    {c.label} <span style={{ color: 'var(--text-muted)' }}>/ {c.maxScore}</span>
                  </td>
                  {scoresByJuror.map(({ score, byKey }) => (
                    <td key={score.id} style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--fs-small)', textAlign: 'right', verticalAlign: 'top' }}>
                      <div style={{ fontWeight: 'var(--fw-bold)' as unknown as number }}>{byKey[c.key]?.score ?? '—'}</div>
                      {byKey[c.key]?.comment && (
                        <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', textAlign: 'left', whiteSpace: 'pre-wrap', marginTop: 'var(--space-1)' }}>
                          {byKey[c.key].comment}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)' as unknown as number }}>composite</td>
                {scoresByJuror.map(({ score }) => (
                  <td key={score.id} style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right' }}>
                    <CompositeBadge score={score.composite} />
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)' as unknown as number, verticalAlign: 'top' }}>
                  why a winning model
                </td>
                {scoresByJuror.map(({ score }) => (
                  <td key={score.id} style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', textAlign: 'left', verticalAlign: 'top', whiteSpace: 'pre-wrap' }}>
                    {score.comment || '—'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
