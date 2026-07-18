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
    padding: 'var(--space-1) var(--space-2)',
    border: `1px solid ${active ? 'var(--delta-red)' : 'var(--border-strong)'}`,
    background: active ? 'var(--delta-red)' : 'transparent',
    color: active ? 'var(--text-inverse)' : 'var(--text-primary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    whiteSpace: 'nowrap',
  };
}

// compact overrides on top of the design-system Input/Select defaults, so the whole filter
// bar fits on one line instead of wrapping into a ragged multi-row block
const compactFieldStyle: React.CSSProperties = {
  fontSize: 'var(--fs-caption)',
  padding: 'var(--space-2)',
};
const compactSelectStyle: React.CSSProperties = {
  ...compactFieldStyle,
  padding: 'var(--space-2) var(--space-6) var(--space-2) var(--space-2)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

// a flex item's default min-width is `auto`, which lets a <select> grow to fit its widest
// <option> (some operating-model values run to 100+ characters) regardless of any minWidth set
// here — pinning an explicit width plus minWidth: 0 is what actually keeps these boxes fixed-size.
function fixedWidth(px: number): React.CSSProperties {
  return { width: px, minWidth: 0, flexShrink: 0 };
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
    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'nowrap', overflowX: 'auto', marginBottom: 'var(--space-6)', alignItems: 'center', paddingBottom: 'var(--space-1)' }}>
      <Input
        placeholder="search by organisation name"
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => setParam('q', e.target.value)}
        containerStyle={fixedWidth(160)}
        style={compactFieldStyle}
      />
      <div role="group" aria-label="toggle review status" style={{ display: 'flex', gap: 'var(--space-1)', flexShrink: 0 }}>
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
        containerStyle={fixedWidth(150)}
        style={compactSelectStyle}
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
        containerStyle={fixedWidth(130)}
        style={compactSelectStyle}
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
        containerStyle={fixedWidth(140)}
        style={compactSelectStyle}
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
        containerStyle={fixedWidth(150)}
        style={compactSelectStyle}
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
        containerStyle={fixedWidth(110)}
        style={compactSelectStyle}
      >
        <option value="">all states</option>
        {options.states.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>
      <Select
        aria-label="filter by eligibility"
        defaultValue={searchParams.get('eligible') ?? ''}
        onChange={(e) => setParam('eligible', e.target.value)}
        containerStyle={fixedWidth(120)}
        style={compactSelectStyle}
      >
        <option value="">eligibility: all</option>
        <option value="YES">eligible</option>
        <option value="NO">ineligible</option>
      </Select>
    </div>
  );
}
