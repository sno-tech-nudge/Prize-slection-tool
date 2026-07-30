'use client';
import React from 'react';
import { Button, Dialog, Checkbox } from '@/design-system';
import { EXPORT_COLUMNS } from '@/lib/applications/exportColumns';

const DEFAULT_IDS = EXPORT_COLUMNS.filter((c) => c.defaultOn).map((c) => c.id);
const ALL_IDS = EXPORT_COLUMNS.map((c) => c.id);

/** `mine` scopes the export to applications assigned to the signed-in user (same `assignedToMe`
 *  filter the applications list itself already supports server-side) — everything else about the
 *  dialog and download flow is identical to the "all applications" export. */
export function ExportCsvButton({ searchParams, mine = false }: { searchParams: Record<string, string | undefined>; mine?: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set(DEFAULT_IDS));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function download() {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    if (mine) params.set('assignedToMe', '1');
    params.set('fields', [...selected].join(','));
    window.location.href = `/api/applications/export?${params.toString()}`;
    setOpen(false);
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        export {mine ? 'my' : 'all'} applications
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={mine ? 'choose columns to export — my applications' : 'choose columns to export'}
        footer={
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              cancel
            </Button>
            <Button variant="cta" onClick={download} disabled={selected.size === 0}>
              export {selected.size} column{selected.size === 1 ? '' : 's'}
            </Button>
          </div>
        }
      >
        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
          the default set below covers the fields most teams need — check &ldquo;select all fields&rdquo; for a full record dump
          (every field on the application, like an export from Zoho).
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <Button variant="secondary" size="sm" onClick={() => setSelected(new Set(ALL_IDS))}>
            select all fields
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setSelected(new Set(DEFAULT_IDS))}>
            reset to default
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setSelected(new Set())}>
            clear all
          </Button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', maxHeight: 420, overflowY: 'auto' }}>
          {EXPORT_COLUMNS.map((c) => (
            <Checkbox key={c.id} label={c.label} checked={selected.has(c.id)} onChange={() => toggle(c.id)} />
          ))}
        </div>
      </Dialog>
    </>
  );
}
