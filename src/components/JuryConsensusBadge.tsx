'use client';
import React from 'react';
import { computeJuryConsensus } from '@/lib/scoring/juryConsensus';

function colorFor(status: string): string | null {
  if (status === 'green') return 'var(--status-good)';
  if (status === 'yellow') return 'var(--status-warn)';
  if (status === 'red') return 'var(--status-bad)';
  return null;
}

/** Majority-vote badge for a bench's jury verdicts — green/red when unanimous, yellow when split
 *  (including an exact tie), grey "not yet scored" before anyone's voted. Hovering shows the
 *  breakdown: named per-juror verdicts when `breakdown` is given (the internal oversight view,
 *  where admin already sees everything), or just a yes/no tally when it isn't (a juror's own
 *  applications list — the aggregate signal is useful, but who specifically voted which way isn't
 *  shown there, keeping individual jurors' verdicts from influencing each other). */
export function JuryConsensusBadge({ verdicts, breakdown }: { verdicts: string[]; breakdown?: { label: string; verdict: string }[] }) {
  const consensus = computeJuryConsensus(verdicts);
  const [hover, setHover] = React.useState(false);
  const bg = colorFor(consensus.status);

  return (
    <span style={{ position: 'relative', display: 'inline-block' }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: 'var(--space-1) var(--space-2)',
          fontSize: 'var(--fs-caption)',
          fontWeight: 'var(--fw-bold)' as unknown as number,
          lineHeight: 1.4,
          textTransform: 'uppercase',
          letterSpacing: 'var(--ls-wide)',
          whiteSpace: 'nowrap',
          color: bg ? 'var(--text-inverse)' : 'var(--text-muted)',
          background: bg ?? 'var(--surface-canvas)',
          border: bg ? 'none' : '1px solid var(--border-strong)',
        }}
      >
        {consensus.label}
      </span>
      {hover && consensus.status !== 'none' && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 'var(--z-overlay)' as unknown as number,
            marginTop: 4,
            background: 'var(--surface-card)',
            border: '1px solid var(--border-strong)',
            boxShadow: 'var(--shadow-md)',
            padding: 'var(--space-3)',
            minWidth: 140,
            whiteSpace: 'nowrap',
          }}
        >
          {breakdown ? (
            breakdown.map((b) => (
              <div key={b.label} style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-1)' }}>
                {b.label}: <strong style={{ color: b.verdict === 'YES' ? 'var(--status-good)' : 'var(--status-bad)' }}>{b.verdict.toLowerCase()}</strong>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
              {consensus.yesCount} yes · {consensus.noCount} no
            </div>
          )}
        </div>
      )}
    </span>
  );
}
