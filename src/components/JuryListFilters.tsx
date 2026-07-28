'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input, Select } from '@/design-system';

const HEIGHT = 38;
const fieldStyle = { height: HEIGHT, boxSizing: 'border-box' as const, fontSize: 'var(--fs-caption)', padding: '0 var(--space-3)', border: '1px solid var(--border-strong)' };

/** The deliberately small filter set for the internal jury oversight list — name, bench, state,
 *  operating model. */
export function JuryListFilters({
  states,
  operatingModels,
  benches,
}: {
  states: string[];
  operatingModels: string[];
  benches: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-6)', alignItems: 'center' }}>
      <Input
        placeholder="search by organisation name"
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => setParam('q', e.target.value)}
        containerStyle={{ width: 220, minWidth: 0, flexShrink: 0 }}
        style={fieldStyle}
      />
      <Select
        aria-label="filter by bench"
        defaultValue={searchParams.get('bench') ?? ''}
        onChange={(e) => setParam('bench', e.target.value)}
        containerStyle={{ width: 160, minWidth: 0, flexShrink: 0 }}
        style={{ ...fieldStyle, padding: '0 var(--space-6) 0 var(--space-3)' }}
      >
        <option value="">bench: all</option>
        {benches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </Select>
      <Select
        aria-label="filter by state"
        defaultValue={searchParams.get('state') ?? ''}
        onChange={(e) => setParam('state', e.target.value)}
        containerStyle={{ width: 160, minWidth: 0, flexShrink: 0 }}
        style={{ ...fieldStyle, padding: '0 var(--space-6) 0 var(--space-3)' }}
      >
        <option value="">state: all</option>
        {states.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
      <Select
        aria-label="filter by operating model"
        defaultValue={searchParams.get('operatingModel') ?? ''}
        onChange={(e) => setParam('operatingModel', e.target.value)}
        containerStyle={{ width: 200, minWidth: 0, flexShrink: 0 }}
        style={{ ...fieldStyle, padding: '0 var(--space-6) 0 var(--space-3)' }}
      >
        <option value="">operating model: all</option>
        {operatingModels.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </Select>
    </div>
  );
}
