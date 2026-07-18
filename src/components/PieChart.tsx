import React from 'react';

export interface PieSlice {
  label: string;
  count: number;
}

// Dedicated chart palette (design-system/tokens/colors.css) spans the full hue range so
// neighboring slices never look alike, even with 10+ categories — the brand's red/charcoal/
// grey/yellow set alone doesn't have enough distinct hues for that.
const SLICE_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
  'var(--chart-9)',
  'var(--chart-10)',
  'var(--chart-11)',
  'var(--chart-12)',
];

function polarPoint(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Donut chart with numbered slices (1, 2, 3...) plus a legend mapping number → label — used
 *  instead of full text labels directly on the chart, since operating model / budget band labels
 *  are too long to fit legibly inside or next to a slice. */
export function PieChart({ data, size = 200 }: { data: PieSlice[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const r = size / 2;
  const innerR = r * 0.55;

  if (total === 0) {
    return <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>no data yet.</p>;
  }

  let cursor = 0;
  const slices = data.map((d, i) => {
    const startAngle = (cursor / total) * 360;
    cursor += d.count;
    const endAngle = (cursor / total) * 360;
    const pct = d.count / total;
    const large = endAngle - startAngle > 180 ? 1 : 0;
    const outerStart = polarPoint(r, r, r, startAngle);
    const outerEnd = polarPoint(r, r, r, endAngle);
    const innerStart = polarPoint(r, r, innerR, endAngle);
    const innerEnd = polarPoint(r, r, innerR, startAngle);
    const path = [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${r} ${r} 0 ${large} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerStart.x} ${innerStart.y}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${innerEnd.x} ${innerEnd.y}`,
      'Z',
    ].join(' ');
    const midAngle = (startAngle + endAngle) / 2;
    const labelPoint = polarPoint(r, r, (r + innerR) / 2, midAngle);
    return { path, color: SLICE_COLORS[i % SLICE_COLORS.length], number: i + 1, pct, labelPoint };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexWrap: 'wrap' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
        {slices.map((s) => (
          <path key={s.number} d={s.path} fill={s.color} stroke="var(--surface-card)" strokeWidth={1} />
        ))}
        {slices
          .filter((s) => s.pct > 0.06)
          .map((s) => (
            <text
              key={`label-${s.number}`}
              x={s.labelPoint.x}
              y={s.labelPoint.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={12}
              fontWeight={700}
              fill="var(--text-inverse)"
            >
              {s.number}
            </text>
          ))}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', minWidth: 180 }}>
        {slices.map((s, i) => (
          <div key={s.number} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--fs-small)' }}>
            <span style={{ width: 12, height: 12, background: s.color, flexShrink: 0 }} />
            <span style={{ width: 16, color: 'var(--text-muted)', fontWeight: 'var(--fw-bold)' as unknown as number }}>{s.number}</span>
            <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{data[i].label}</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 'var(--fw-bold)' as unknown as number }}>{data[i].count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
