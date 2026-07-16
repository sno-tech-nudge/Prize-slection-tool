'use client';
import React from 'react';
import India from '@react-map/india';

export interface StateCount {
  state: string;
  count: number;
}

// the map package still lists the pre-2020 union territories separately; our own data uses the
// merged name, so both map regions need to pick up that one entry's count/color.
const STATE_ALIASES: Record<string, string[]> = {
  'Dadra and Nagar Haveli and Daman and Diu': ['Dadra and Nagar Haveli', 'Daman and Diu'],
};

// sequential ramp, one hue (brand red), light → dark by volume — grey for states with no
// applicants at all, so "zero" reads as a distinct, deliberate step rather than the lightest red.
const BUCKETS = [
  { max: 0, color: 'var(--grey-100)', label: 'no applicants' },
  { max: 0.25, color: 'var(--red-050)', label: 'low' },
  { max: 0.5, color: 'var(--red-500)', label: 'moderate' },
  { max: 0.75, color: 'var(--delta-red)', label: 'high' },
  { max: 1, color: 'var(--red-700)', label: 'highest' },
];

function bucketFor(count: number, max: number) {
  if (count === 0 || max === 0) return BUCKETS[0];
  const pct = count / max;
  if (pct <= 0.25) return BUCKETS[1];
  if (pct <= 0.5) return BUCKETS[2];
  if (pct <= 0.75) return BUCKETS[3];
  return BUCKETS[4];
}

export function IndiaStatesMap({ data }: { data: StateCount[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [hover, setHover] = React.useState<{ state: string; count: number; x: number; y: number } | null>(null);

  const countByState = new Map(data.map((d) => [d.state, d.count]));
  const maxCount = Math.max(...data.map((d) => d.count), 0);

  // reverse-lookup so hovering either half of a merged UT (see STATE_ALIASES) still resolves
  // back to the display name and count of our own data's single entry for it.
  const displayNameFor = new Map<string, string>();
  for (const [state] of countByState) {
    displayNameFor.set(state, state);
    for (const alias of STATE_ALIASES[state] ?? []) displayNameFor.set(alias, state);
  }

  const cityColors: Record<string, string> = {};
  for (const [state, count] of countByState) {
    const color = bucketFor(count, maxCount).color;
    cityColors[state] = color;
    for (const alias of STATE_ALIASES[state] ?? []) {
      cityColors[alias] = color;
    }
  }

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleMove(e: MouseEvent) {
      const target = (e.target as Element | null)?.closest('path');
      if (!target || !target.id) {
        setHover(null);
        return;
      }
      // id format is `${stateName}-${reactInstanceId}` — the instance id is alphanumeric only
      // (colons stripped from useId()), so the last hyphen always separates it from the name.
      const rawState = target.id.slice(0, target.id.lastIndexOf('-'));
      const state = displayNameFor.get(rawState) ?? rawState;
      setHover({ state, count: countByState.get(state) ?? 0, x: e.clientX, y: e.clientY });
    }
    function handleLeave() {
      setHover(null);
    }

    container.addEventListener('mousemove', handleMove);
    container.addEventListener('mouseleave', handleLeave);
    return () => {
      container.removeEventListener('mousemove', handleMove);
      container.removeEventListener('mouseleave', handleLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div ref={containerRef} style={{ flexShrink: 0, position: 'relative' }}>
        <India
          type="select-single"
          size={340}
          mapColor="var(--grey-100)"
          strokeColor="var(--surface-card)"
          strokeWidth={0.5}
          hoverColor="var(--delta-charcoal)"
          cityColors={cityColors}
          disableClick
        />
        {hover && (
          <div
            style={{
              position: 'fixed',
              left: hover.x + 16,
              top: hover.y + 16,
              zIndex: 1000,
              pointerEvents: 'none',
              background: 'var(--delta-charcoal)',
              color: 'var(--text-inverse)',
              padding: 'var(--space-2) var(--space-3)',
              fontSize: 'var(--fs-small)',
              whiteSpace: 'nowrap',
            }}
          >
            <strong>{hover.state}</strong>: {hover.count} application{hover.count === 1 ? '' : 's'}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', minWidth: 160 }}>
        {BUCKETS.map((b) => (
          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--fs-small)' }}>
            <span style={{ width: 14, height: 14, background: b.color, flexShrink: 0, border: '1px solid var(--border-subtle)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>{b.label}</span>
          </div>
        ))}
        <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
          hover a state to see its name and application count. shaded by applications operating in that state
          (multi-select, so an application can count toward more than one).
        </p>
      </div>
    </div>
  );
}
