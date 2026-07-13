'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/design-system';
import { uploadTargetsCsvAction } from '@/lib/targets/actions';

export function TargetUploadForm() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <form
      action={async (formData) => {
        setPending(true);
        try {
          await uploadTargetsCsvAction(formData);
          router.refresh();
          if (inputRef.current) inputRef.current.value = '';
          setFileName(null);
        } finally {
          setPending(false);
        }
      }}
      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}
    >
      {/* the native file input's own "choose file" button is browser-native chrome that can't be
          restyled with font-family in any browser — so it's visually hidden and triggered by a
          label styled as a design-system button instead, keeping every visible control on-brand. */}
      <input
        ref={inputRef}
        type="file"
        name="file"
        accept=".csv"
        required
        id="targets-csv-input"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }}
      />
      <label htmlFor="targets-csv-input" style={{ cursor: 'pointer' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            fontFamily: 'var(--font-sans)',
            fontWeight: 'var(--fw-bold)' as unknown as number,
            fontSize: 13,
            padding: 'var(--space-2) var(--space-4)',
            border: '2px solid var(--border-strong)',
            color: 'var(--text-primary)',
            textTransform: 'lowercase',
          }}
        >
          choose csv file
        </span>
      </label>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
        {fileName ?? 'no file chosen'}
      </span>
      <Button type="submit" variant="secondary" size="sm" disabled={pending}>
        {pending ? 'uploading…' : 'replace wishlist from csv'}
      </Button>
    </form>
  );
}
