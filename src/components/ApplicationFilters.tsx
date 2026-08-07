'use client';
import React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input, Select } from '@/design-system';
import { MultiSelect } from '@/components/MultiSelect';
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

// shared height for every filter control (search box, pill toggles, selects, multiselects) so
// the whole bar reads as one consistent row instead of a mix of box heights — MultiSelect.tsx
// hardcodes this same value on its own trigger button, since it doesn't take a style prop.
export const FILTER_CONTROL_HEIGHT = 38;

function pillStyle(active: boolean): React.CSSProperties {
  return {
    height: FILTER_CONTROL_HEIGHT,
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 'var(--fs-caption)',
    textTransform: 'lowercase',
    padding: '0 var(--space-3)',
    border: `1px solid ${active ? 'var(--delta-red)' : 'var(--border-strong)'}`,
    background: active ? 'var(--delta-red)' : 'var(--surface-card)',
    color: active ? 'var(--text-inverse)' : 'var(--text-primary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    whiteSpace: 'nowrap',
  };
}

// compact overrides on top of the design-system Input/Select defaults — same height and border
// weight as the pill buttons and MultiSelect triggers, so every control in the bar matches.
const compactFieldStyle: React.CSSProperties = {
  height: FILTER_CONTROL_HEIGHT,
  boxSizing: 'border-box',
  fontSize: 'var(--fs-caption)',
  padding: '0 var(--space-3)',
  border: '1px solid var(--border-strong)',
};
const compactSelectStyle: React.CSSProperties = {
  ...compactFieldStyle,
  padding: '0 var(--space-6) 0 var(--space-3)',
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

  function setMultiParam(key: string, values: string[]) {
    setParam(key, values.join(','));
  }

  function getMultiParam(key: string): string[] {
    return (searchParams.get(key) ?? '').split(',').filter(Boolean);
  }

  const currentReviewed = searchParams.get('reviewed') ?? '';
  const currentAssignedToMe = searchParams.get('assignedToMe') === '1';

  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', rowGap: 'var(--space-2)', marginBottom: 'var(--space-6)', alignItems: 'center' }}>
      <Input
        placeholder="search by organisation name"
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => setParam('q', e.target.value)}
        containerStyle={fixedWidth(180)}
        style={compactFieldStyle}
      />
      <button
        type="button"
        onClick={() => setParam('assignedToMe', currentAssignedToMe ? '' : '1')}
        style={pillStyle(currentAssignedToMe)}
      >
        assigned to me
      </button>
      <div role="group" aria-label="toggle review status" style={{ display: 'flex', gap: 'var(--space-1)', flexShrink: 0 }}>
        {REVIEW_TOGGLE_OPTIONS.map((o) => (
          <button key={o.value} type="button" onClick={() => setParam('reviewed', o.value)} style={pillStyle(currentReviewed === o.value)}>
            {o.label}
          </button>
        ))}
      </div>
      <MultiSelect
        label="solution category"
        width={160}
        selected={getMultiParam('category')}
        onChange={(v) => setMultiParam('category', v)}
        options={SOLUTION_CATEGORIES.map((c) => ({ value: c, label: SOLUTION_CATEGORY_LABEL[c] }))}
      />
      <Select
        aria-label="filter by decision status"
        defaultValue={searchParams.get('internal') ?? ''}
        onChange={(e) => setParam('internal', e.target.value)}
        containerStyle={fixedWidth(150)}
        style={compactSelectStyle}
      >
        <option value="">decision status: all</option>
        <option value="YES">decision: yes</option>
        <option value="NO">decision: no</option>
        <option value="ECOSYSTEM_PARTNER">potential ecosystem partner</option>
        <option value="UNDECIDED">decision: undecided</option>
      </Select>
      <MultiSelect
        label="registration type"
        width={150}
        selected={getMultiParam('registrationType')}
        onChange={(v) => setMultiParam('registrationType', v)}
        options={options.registrationTypes.map((t) => ({ value: t, label: t }))}
      />
      <MultiSelect
        label="operating model"
        width={160}
        selected={getMultiParam('operatingModel')}
        onChange={(v) => setMultiParam('operatingModel', v)}
        options={options.operatingModels.map((m) => ({ value: m, label: m }))}
      />
      <MultiSelect
        label="state"
        width={130}
        selected={getMultiParam('state')}
        onChange={(v) => setMultiParam('state', v)}
        options={options.states.map((s) => ({ value: s, label: s }))}
      />
      <Select
        aria-label="filter by eligibility"
        defaultValue={searchParams.get('eligible') ?? ''}
        onChange={(e) => setParam('eligible', e.target.value)}
        containerStyle={fixedWidth(140)}
        style={compactSelectStyle}
      >
        <option value="">eligibility: all</option>
        <option value="YES">eligible</option>
        <option value="NO">ineligible</option>
      </Select>
    </div>
  );
}
