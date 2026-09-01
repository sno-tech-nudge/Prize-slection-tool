'use client';
import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Button, Checkbox } from '@/design-system';
import { VIEW_SECTIONS, VIEW_FIELDS, type ViewSectionDef } from '@/lib/visibility/fieldRegistry';
import type { FieldVisibilityConfig } from '@/lib/visibility/settings';
import { updateFieldVisibilityAction } from '@/lib/visibility/actions';

function moveItem(arr: string[], index: number, direction: -1 | 1): string[] {
  const target = index + direction;
  if (target < 0 || target >= arr.length) return arr;
  const next = [...arr];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

const arrowButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 24,
  height: 24,
  border: '1px solid var(--border-strong)',
  background: 'var(--surface-card)',
  cursor: 'pointer',
  color: 'var(--text-secondary)',
  padding: 0,
};

function SectionOrderList({
  title,
  helpText,
  order,
  onReorder,
  sectionDefs,
  fieldsFor,
  checkboxName,
  checkedFor,
}: {
  title: string;
  helpText: string;
  order: string[];
  onReorder: (next: string[]) => void;
  sectionDefs: ViewSectionDef[];
  fieldsFor: (sectionKey: string) => { key: string; label: string }[];
  checkboxName: (fieldKey: string) => string;
  checkedFor: (fieldKey: string) => boolean;
}) {
  return (
    <div>
      <h3 style={{ fontSize: 'var(--fs-h4)', marginBottom: 'var(--space-1)' }}>{title}</h3>
      <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>{helpText}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {order.map((sectionKey, i) => {
          const section = sectionDefs.find((s) => s.key === sectionKey);
          const fields = fieldsFor(sectionKey);
          if (!section || fields.length === 0) return null;
          return (
            <div key={sectionKey}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-2)',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: 'var(--space-2)',
                }}
              >
                <span style={{ fontSize: 'var(--fs-caption)', textTransform: 'uppercase', letterSpacing: 'var(--ls-wide)', color: 'var(--text-secondary)' }}>
                  {section.label}
                </span>
                <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                  <button
                    type="button"
                    aria-label={`move ${section.label} up`}
                    disabled={i === 0}
                    onClick={() => onReorder(moveItem(order, i, -1))}
                    style={{ ...arrowButtonStyle, opacity: i === 0 ? 0.4 : 1, cursor: i === 0 ? 'default' : 'pointer' }}
                  >
                    <ArrowUp size={14} strokeLinejoin="miter" strokeLinecap="square" />
                  </button>
                  <button
                    type="button"
                    aria-label={`move ${section.label} down`}
                    disabled={i === order.length - 1}
                    onClick={() => onReorder(moveItem(order, i, 1))}
                    style={{ ...arrowButtonStyle, opacity: i === order.length - 1 ? 0.4 : 1, cursor: i === order.length - 1 ? 'default' : 'pointer' }}
                  >
                    <ArrowDown size={14} strokeLinejoin="miter" strokeLinecap="square" />
                  </button>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {fields.map((f) => (
                    <tr key={f.key} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--fs-small)' }}>{f.label}</td>
                      <td style={{ padding: 'var(--space-2) var(--space-3)', width: 60 }}>
                        <Checkbox name={checkboxName(f.key)} defaultChecked={checkedFor(f.key)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Admin-only field-by-field visibility manager for jury and observer, plus per-role section
 *  reordering. Wired up in ApplicationMainContent.tsx, which now renders jury, observer, and
 *  admin/reviewer through the exact same section/field machinery — every field here is available
 *  to every role, so jury can be handed anywhere from a couple of fields up to the entire
 *  admin/reviewer view, one field or section at a time. Jury is listed first (not observer) since
 *  it's checked far more often day to day. */
export function FieldVisibilityManager({ visibility }: { visibility: FieldVisibilityConfig }) {
  const [juryOrder, setJuryOrder] = React.useState(visibility.jurySectionOrder);
  const [observerOrder, setObserverOrder] = React.useState(visibility.observerSectionOrder);

  return (
    <form action={updateFieldVisibilityAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <input type="hidden" name="jurySectionOrder" value={juryOrder.join(',')} />
      <input type="hidden" name="observerSectionOrder" value={observerOrder.join(',')} />

      <SectionOrderList
        title="jury view"
        helpText="which fields jury sees, and in what section order — every field on the application is available here, up to the full admin/reviewer view. Use the arrows to reorder a section before or after another."
        order={juryOrder}
        onReorder={setJuryOrder}
        sectionDefs={VIEW_SECTIONS}
        fieldsFor={(key) => VIEW_FIELDS.filter((f) => f.section === key)}
        checkboxName={(key) => `jury_${key}`}
        checkedFor={(key) => visibility.jury[key]}
      />

      <SectionOrderList
        title="observer view"
        helpText="which fields observer sees, and in what section order — use the arrows to reorder a section before or after another."
        order={observerOrder}
        onReorder={setObserverOrder}
        sectionDefs={VIEW_SECTIONS}
        fieldsFor={(key) => VIEW_FIELDS.filter((f) => f.section === key)}
        checkboxName={(key) => `observer_${key}`}
        checkedFor={(key) => visibility.observer[key]}
      />

      <div>
        <Button type="submit" variant="cta">
          save field visibility
        </Button>
      </div>
    </form>
  );
}
