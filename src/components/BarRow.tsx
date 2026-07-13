import React from 'react';

export function BarRow({ label, count, max, tone = 'red' }: { label: string; count: number; max: number; tone?: 'red' | 'ink' }) {
  const pct = max > 0 ? Math.max((count / max) * 100, count > 0 ? 2 : 0) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <div style={{ width: 160, fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, background: 'var(--grey-100)', height: 22, position: 'relative' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: tone === 'red' ? 'var(--delta-red)' : 'var(--delta-charcoal)',
          }}
        />
      </div>
      <div style={{ width: 36, textAlign: 'right', fontSize: 'var(--fs-small)', fontWeight: 'var(--fw-bold)' as unknown as number }}>{count}</div>
    </div>
  );
}
