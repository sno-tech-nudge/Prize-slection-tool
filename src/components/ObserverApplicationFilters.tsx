'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input } from '@/design-system';

/** Observer's only filter control — search by organisation name. Deliberately no other filters
 *  (decision status, registration type, operating model, state, eligibility selects) — observer's
 *  view is meant to be simple browsing, not the full admin filter bar. */
export function ObserverApplicationFilters() {
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
    <div style={{ display: 'flex', marginBottom: 'var(--space-6)' }}>
      <Input
        placeholder="search by organisation name"
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => setParam('q', e.target.value)}
        containerStyle={{ width: 260, minWidth: 0 }}
        style={{ height: 38, boxSizing: 'border-box', fontSize: 'var(--fs-caption)', padding: '0 var(--space-3)' }}
      />
    </div>
  );
}
