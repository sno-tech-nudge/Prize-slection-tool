import { parseCsv } from '@/lib/csv';
import type { StoredUpload, UploadKind } from '@/lib/uploads/settingsUploads';

/** Renders whatever an admin uploaded in /settings/view cleanly — a csv becomes a real table (not
 *  a raw text dump), a pdf embeds inline via the uploads API route. Server-rendered and passed as
 *  `children` into InfoSidePanel (a client component) — that's fine in RSC, only passing a raw
 *  function/component reference across that boundary is the thing that breaks. */
export function UploadedDocumentView({ upload, kind }: { upload: StoredUpload | null; kind: UploadKind }) {
  if (!upload) {
    return <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>nothing uploaded yet.</p>;
  }

  if (upload.mimeType === 'text/csv') {
    const text = Buffer.from(upload.dataBase64, 'base64').toString('utf-8');
    const rows = parseCsv(text).filter((r) => r.some((c) => c.trim().length > 0));
    if (rows.length === 0) {
      return <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>the uploaded csv has no rows.</p>;
    }
    const [header, ...body] = rows;
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left' }}>
              {header.map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: 'var(--space-2) var(--space-3)',
                    fontSize: 'var(--fs-caption)',
                    textTransform: 'uppercase',
                    letterSpacing: 'var(--ls-wide)',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h || `column ${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((r, ri) => (
              <tr key={ri} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {header.map((_, ci) => (
                  <td
                    key={ci}
                    style={{ padding: 'var(--space-2) var(--space-3)', fontSize: 'var(--fs-small)', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', verticalAlign: 'top' }}
                  >
                    {r[ci] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <iframe
      src={`/api/uploads/${kind}?disposition=inline`}
      title={upload.filename}
      width="100%"
      height={640}
      style={{ border: '1px solid var(--border-subtle)' }}
    />
  );
}
