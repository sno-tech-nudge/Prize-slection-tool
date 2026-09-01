'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input, Select } from '@/design-system';
import { FILTER_CONTROL_HEIGHT } from '@/components/ApplicationFilters';

const compactFieldStyle: React.CSSProperties = {
  height: FILTER_CONTROL_HEIGHT,
  boxSizing: 'border-box',
  fontSize: 'var(--fs-caption)',
  padding: '0 var(--space-3)',
  border: '1px solid var(--border-strong)',
};

/** Jury's own filter bar — search, scored/not-scored, and sort (alphabetical, interview slot, or
 *  score). Deliberately just these: no decision status, registration type, operating model,
 *  state, or eligibility selects — jury only ever sees their own bench's shortlisted applications,
 *  and only needs to find and order them, not slice by the same operational filters the internal
 *  team uses. */
export function JuryApplicationFilters() {
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
    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
      <Input
        placeholder="search by organisation name"
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => setParam('q', e.target.value)}
        containerStyle={{ width: 220, minWidth: 0, flexShrink: 0 }}
        style={compactFieldStyle}
      />
      <Select
        aria-label="filter by scored status"
        defaultValue={searchParams.get('scored') ?? ''}
        onChange={(e) => setParam('scored', e.target.value)}
        containerStyle={{ width: 170, minWidth: 0, flexShrink: 0 }}
        style={{ ...compactFieldStyle, padding: '0 var(--space-6) 0 var(--space-3)' }}
      >
        <option value="">scored: all</option>
        <option value="YES">completed</option>
        <option value="NO">yet to score</option>
      </Select>
      <Select
        aria-label="sort applications"
        defaultValue={searchParams.get('sort') ?? ''}
        onChange={(e) => setParam('sort', e.target.value)}
        containerStyle={{ width: 170, minWidth: 0, flexShrink: 0 }}
        style={{ ...compactFieldStyle, padding: '0 var(--space-6) 0 var(--space-3)' }}
      >
        <option value="">sort: alphabetical</option>
        <option value="slot">slot: earliest first</option>
        <option value="score_desc">score: high to low</option>
        <option value="score_asc">score: low to high</option>
      </Select>
    </div>
  );
}
