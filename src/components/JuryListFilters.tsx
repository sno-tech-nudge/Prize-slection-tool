'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input, Select } from '@/design-system';
import { MultiSelect } from '@/components/MultiSelect';
import { SCORE_BUCKETS, JURY_SORT_OPTIONS } from '@/lib/benches/queries';

const HEIGHT = 38;
const fieldStyle = { height: HEIGHT, boxSizing: 'border-box' as const, fontSize: 'var(--fs-caption)', padding: '0 var(--space-3)', border: '1px solid var(--border-strong)' };

/** The filter set for the internal jury oversight list — name, bench, int (human review) score
 *  bucket, and average jury score bucket. Bench, int score, and jury score are all multi-select
 *  (checkbox dropdowns, same MultiSelect component and comma-separated-URL-param convention as
 *  the main applications table), so more than one bench or score band can be selected at once. */
export function JuryListFilters({ benches }: { benches: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function setMultiParam(key: string, values: string[]) {
    setParam(key, values.join(','));
  }

  function getMultiParam(key: string): string[] {
    return (searchParams.get(key) ?? '').split(',').filter(Boolean);
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
      <MultiSelect
        label="bench"
        width={160}
        selected={getMultiParam('bench')}
        onChange={(v) => setMultiParam('bench', v)}
        options={benches.map((b) => ({ value: b.id, label: b.name }))}
      />
      <MultiSelect
        label="int score"
        width={160}
        selected={getMultiParam('intScore')}
        onChange={(v) => setMultiParam('intScore', v)}
        options={SCORE_BUCKETS.map((b) => ({ value: b, label: `int score: ${b}` }))}
      />
      <MultiSelect
        label="jury score"
        width={160}
        selected={getMultiParam('score')}
        onChange={(v) => setMultiParam('score', v)}
        options={SCORE_BUCKETS.map((b) => ({ value: b, label: `score: ${b}` }))}
      />
      <Select
        aria-label="sort by"
        defaultValue={searchParams.get('sort') ?? 'name'}
        onChange={(e) => setParam('sort', e.target.value === 'name' ? '' : e.target.value)}
        containerStyle={{ width: 170, minWidth: 0, flexShrink: 0 }}
        style={{ ...fieldStyle, padding: '0 var(--space-6) 0 var(--space-3)' }}
      >
        {JURY_SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            sort: {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
