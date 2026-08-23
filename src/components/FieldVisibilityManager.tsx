import { Button, Checkbox } from '@/design-system';
import { VIEW_SECTIONS, VIEW_FIELDS } from '@/lib/visibility/fieldRegistry';
import type { FieldVisibilityConfig } from '@/lib/visibility/settings';
import { updateFieldVisibilityAction } from '@/lib/visibility/actions';

/** Admin-only field-by-field visibility manager for the observer and jury roles. Purely a
 *  settings surface for now — saving here does not change what either role actually sees on any
 *  page yet, until a follow-up wires the application detail page to read this config. */
export function FieldVisibilityManager({ visibility }: { visibility: FieldVisibilityConfig }) {
  return (
    <form action={updateFieldVisibilityAction} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {VIEW_SECTIONS.map((section) => {
        const fields = VIEW_FIELDS.filter((f) => f.section === section.key);
        if (fields.length === 0) return null;
        return (
          <div key={section.key}>
            <div
              style={{
                fontSize: 'var(--fs-caption)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--ls-wide)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--space-2)',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: 'var(--space-2)',
              }}
            >
              {section.label}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  <th style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', fontWeight: 'var(--fw-light)' as unknown as number }}>
                    field
                  </th>
                  <th style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', width: 90 }}>observer</th>
                  <th style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', width: 90 }}>jury</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((f) => (
                  <tr key={f.key} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--fs-small)' }}>{f.label}</td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                      <Checkbox name={`observer_${f.key}`} defaultChecked={visibility.observer[f.key]} />
                    </td>
                    <td style={{ padding: 'var(--space-2) var(--space-3)' }}>
                      <Checkbox name={`jury_${f.key}`} defaultChecked={visibility.jury[f.key]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      <div>
        <Button type="submit" variant="cta">
          save field visibility
        </Button>
      </div>
    </form>
  );
}
