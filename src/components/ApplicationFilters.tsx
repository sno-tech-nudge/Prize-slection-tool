'use client';
import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input, Select } from '@/design-system';
import { SOLUTION_CATEGORIES, SOLUTION_CATEGORY_LABEL } from '@/lib/constants';

export interface ApplicationFilterOptions {
  registrationTypes: string[];
  operatingModels: string[];
  states: string[];
}

const REVIEW_TOGGLE_OPTIONS = [
  { value: '', label: 'all' },
  { value: 'YES', label: 'reviewed' },
  { value: 'NO', label: 'not reviewed' },
];

function pillStyle(active: boolean): React.CSSProperties {
  return {
    fontSize: 'var(--fs-caption)',
    textTransform: 'lowercase',
    padding: 'var(--space-2) var(--space-3)',
    border: `1px solid ${active ? 'var(--delta-red)' : 'var(--border-strong)'}`,
    background: active ? 'var(--delta-red)' : 'transparent',
    color: active ? 'var(--text-inverse)' : 'var(--text-primary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  };
}

export function ApplicationFilters({ options }: { options: ApplicationFilterOptions }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  const currentReviewed = searchParams.get('reviewed') ?? '';

  return (
    <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-6)', alignItems: 'center' }}>
      <Input
        placeholder="search by organisation name"
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => setParam('q', e.target.value)}
        containerStyle={{ minWidth: 260 }}
      />
      <div role="group" aria-label="toggle review status" style={{ display: 'flex', gap: 'var(--space-2)' }}>
        {REVIEW_TOGGLE_OPTIONS.map((o) => (
          <button key={o.value} type="button" onClick={() => setParam('reviewed', o.value)} style={pillStyle(currentReviewed === o.value)}>
            {o.label}
          </button>
        ))}
      </div>
      <Select
        aria-label="filter by solution category"
        defaultValue={searchParams.get('category') ?? ''}
        onChange={(e) => setParam('category', e.target.value)}
        containerStyle={{ minWidth: 220 }}
      >
        <option value="">all solution categories</option>
        {SOLUTION_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {SOLUTION_CATEGORY_LABEL[c]}
          </option>
        ))}
      </Select>
      <Select
        aria-label="filter by decision status"
        defaultValue={searchParams.get('internal') ?? ''}
        onChange={(e) => setParam('internal', e.target.value)}
        containerStyle={{ minWidth: 180 }}
      >
        <option value="">decision status: all</option>
        <option value="YES">decision: yes</option>
        <option value="NO">decision: no</option>
        <option value="UNDECIDED">decision: undecided</option>
      </Select>
      <Select
        aria-label="filter by registration type"
        defaultValue={searchParams.get('registrationType') ?? ''}
        onChange={(e) => setParam('registrationType', e.target.value)}
        containerStyle={{ minWidth: 200 }}
      >
        <option value="">all registration types</option>
        {options.registrationTypes.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </Select>
      <Select
        aria-label="filter by operating model"
        defaultValue={searchParams.get('operatingModel') ?? ''}
        onChange={(e) => setParam('operatingModel', e.target.value)}
        containerStyle={{ minWidth: 220 }}
      >
        <option value="">all operating models</option>
        {options.operatingModels.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </Select>
      <Select
        aria-label="filter by state"
        defaultValue={searchParams.get('state') ?? ''}
        onChange={(e) => setParam('state', e.target.value)}
        containerStyle={{ minWidth: 180 }}
      >
        <option value="">all states</option>
        {options.states.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
    </div>
  );
}
