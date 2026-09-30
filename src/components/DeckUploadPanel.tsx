'use client';
import React from 'react';
import { upload } from '@vercel/blob/client';
import { Card, Button, Select, useToast } from '@/design-system';
import { slugify } from '@/lib/sources/normalize';
import { setDeckUrlAction } from '@/lib/uploads/deckActions';

interface DeckMatchCandidate {
  id: string;
  orgName: string;
  deckUrl: string | null;
}

interface DeckRow {
  file: File;
  applicationId: string;
}

function bestMatch(fileName: string, candidates: DeckMatchCandidate[]): string {
  const key = slugify(fileName.replace(/\.pdf$/i, ''));
  const exact = candidates.find((c) => slugify(c.orgName) === key);
  if (exact) return exact.id;
  const partial = candidates.find((c) => {
    const orgSlug = slugify(c.orgName);
    return orgSlug.length > 3 && (key.includes(orgSlug) || orgSlug.includes(key));
  });
  return partial?.id ?? '';
}

/** Bulk deck (pitch deck PDF) upload, matched by filename against org name — a review table lets
 *  an admin override any match (or pick one for a file that matched nothing) before anything
 *  actually uploads. Files go straight from the browser to Vercel Blob (see /api/deck-upload),
 *  never through this app's own server — a real pitch deck PDF is routinely bigger than the
 *  serverless function body limit. */
export function DeckUploadPanel({ candidates }: { candidates: DeckMatchCandidate[] }) {
  const { push } = useToast();
  const [rows, setRows] = React.useState<DeckRow[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  function onFilesSelected(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList).filter((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    setRows(files.map((file) => ({ file, applicationId: bestMatch(file.name, candidates) })));
  }

  function setRowApplication(index: number, applicationId: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, applicationId } : r)));
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  const readyCount = rows.filter((r) => r.applicationId).length;

  async function confirmUpload() {
    const toUpload = rows.filter((r) => r.applicationId);
    if (toUpload.length === 0) return;
    setUploading(true);
    setProgress({ done: 0, total: toUpload.length });

    let succeeded = 0;
    let failed = 0;
    for (const row of toUpload) {
      try {
        const blob = await upload(row.file.name, row.file, { access: 'public', handleUploadUrl: '/api/deck-upload' });
        await setDeckUrlAction(row.applicationId, blob.url);
        succeeded++;
      } catch {
        failed++;
      }
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
    }

    setUploading(false);
    setProgress(null);
    setRows([]);
    if (inputRef.current) inputRef.current.value = '';
    push(
      failed > 0 ? `${succeeded} deck${succeeded === 1 ? '' : 's'} uploaded, ${failed} failed.` : `${succeeded} deck${succeeded === 1 ? '' : 's'} uploaded.`,
      undefined,
      failed > 0 ? 'warning' : 'success',
    );
  }

  return (
    <Card>
      <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-2)' }}>application decks</h2>
      <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
        bulk-upload pitch deck PDFs — matched to an application by filename, review and correct the match below before
        confirming. nothing uploads until you confirm.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        onChange={(e) => onFilesSelected(e.target.files)}
        style={{ fontSize: 'var(--fs-small)', marginBottom: 'var(--space-4)' }}
      />

      {rows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {rows.map((row, i) => (
            <div key={`${row.file.name}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span
                style={{
                  fontSize: 'var(--fs-small)',
                  flexGrow: 1,
                  flexShrink: 1,
                  flexBasis: 240,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {row.file.name}
              </span>
              <Select
                aria-label={`match for ${row.file.name}`}
                value={row.applicationId}
                onChange={(e) => setRowApplication(i, e.target.value)}
                containerStyle={{ flexGrow: 1, flexShrink: 1, flexBasis: 260 }}
              >
                <option value="">— no match, choose an application —</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.orgName}
                    {c.deckUrl ? ' (already has a deck)' : ''}
                  </option>
                ))}
              </Select>
              <Button variant="ghost" size="sm" onClick={() => removeRow(i)} disabled={uploading}>
                remove
              </Button>
            </div>
          ))}

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
            <Button variant="cta" onClick={confirmUpload} disabled={uploading || readyCount === 0}>
              {uploading
                ? `uploading ${progress?.done ?? 0}/${progress?.total ?? 0}…`
                : `confirm and upload ${readyCount} deck${readyCount === 1 ? '' : 's'}`}
            </Button>
            {rows.length > readyCount && (
              <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>
                {rows.length - readyCount} file{rows.length - readyCount === 1 ? '' : 's'} still need a match.
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
