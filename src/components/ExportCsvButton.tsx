'use client';
import React from 'react';
import { Button, Dialog, Checkbox } from '@/design-system';
import { EXPORT_COLUMNS } from '@/lib/applications/exportColumns';

export function ExportCsvButton({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(
    new Set(EXPORT_COLUMNS.filter((c) => c.defaultOn).map((c) => c.id)),
  );

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
    params.set('fields', [...selected].join(','));
    window.location.href = `/api/applications/export?${params.toString()}`;
    setOpen(false);
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        export CSV
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="choose columns to export"
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          {EXPORT_COLUMNS.map((c) => (
            <Checkbox key={c.id} label={c.label} checked={selected.has(c.id)} onChange={() => toggle(c.id)} />
          ))}
        </div>
      </Dialog>
    </>
  );
}
