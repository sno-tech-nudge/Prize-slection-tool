'use client';
import React from 'react';
import { Card, Badge, Button } from '@/design-system';
import { CompositeBadge } from '@/components/StatusBadges';
import { parseCriteria } from '@/lib/scoring/parse';
import { RUBRIC_CRITERIA, RUBRIC_SECTIONS } from '@/lib/scoring/rubric';

export interface JuryScoresTableRow {
  id: string;
  composite: number;
  verdict: string;
  comment: string | null;
  criteria: string;
  juror: { name: string; bench: { name: string } | null };
}

/** Every juror's individual score + comment on this application, in a table — who scored it,
 *  which bench they're on, how much, and what they said. A toggle below lets you pick one juror
 *  at a time to see their full per-criterion rubric breakdown, and below that a single
 *  comparison table lines up every juror's per-criterion scores side by side. Shared between the
 *  admin sidebar (on the regular application page) and the internal jury-dashboard page. */
export function JuryScoresTable({ juryScores }: { juryScores: JuryScoresTableRow[] }) {
  const [selectedId, setSelectedId] = React.useState<string | null>(juryScores[0]?.id ?? null);
  const selected = juryScores.find((s) => s.id === selectedId) ?? null;
  const selectedScoresByKey = selected ? Object.fromEntries(parseCriteria(selected.criteria).map((c) => [c.key, c.score])) : {};

  const scoresByJuror = React.useMemo(
    () => juryScores.map((s) => ({ score: s, byKey: Object.fromEntries(parseCriteria(s.criteria).map((c) => [c.key, c.score])) })),
    [juryScores],
  );

  if (juryScores.length === 0) {
    return (
      <Card style={{ marginBottom: 'var(--space-6)' }}>
        <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-2)' }}>juror scores &amp; comments</h2>
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
              {['juror', 'bench', 'score', 'comment'].map((h) => (
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
                  {s.juror.bench?.name ?? '—'}
                </td>
                <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <CompositeBadge score={s.composite} />
                    <Badge tone="outline">{s.verdict.toLowerCase()}</Badge>
                  </div>
                </td>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
                  {s.comment || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* toggle to inspect one juror's full rubric breakdown at a time */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
          view rubric breakdown for
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
          {juryScores.map((s) => (
            <Button key={s.id} variant={s.id === selectedId ? 'primary' : 'secondary'} size="sm" onClick={() => setSelectedId(s.id)}>
              {s.juror.name}
            </Button>
          ))}
        </div>

        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <CompositeBadge score={selected.composite} />
              <Badge tone="outline">{selected.verdict.toLowerCase()}</Badge>
              <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>{selected.juror.bench?.name ?? 'unassigned bench'}</span>
            </div>

            {RUBRIC_SECTIONS.map((section) => (
              <div key={section.key}>
                <div
                  style={{
                    fontSize: 'var(--fs-caption)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--ls-wide)',
                    color: 'var(--text-muted)',
                    marginBottom: 'var(--space-2)',
                    borderBottom: '1px solid var(--border-subtle)',
                    paddingBottom: 'var(--space-2)',
                  }}
                >
                  {section.label} · max {section.weight}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {RUBRIC_CRITERIA.filter((c) => c.section === section.key).map((c) => (
                    <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-small)' }}>
                      <span>{c.label}</span>
                      <strong>{selectedScoresByKey[c.key] ?? '—'} / {c.maxScore}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {selected.comment && (
              <div>
                <div style={{ fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                  comment
                </div>
                <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>{selected.comment}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* every juror's per-criterion score lined up side by side, for comparing at a glance */}
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
              <tr>
                <td style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)' as unknown as number }}>composite</td>
                {scoresByJuror.map(({ score }) => (
                  <td key={score.id} style={{ padding: 'var(--space-2) var(--space-3)', textAlign: 'right' }}>
                    <CompositeBadge score={score.composite} />
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
