import { extractPdfText, csvToReadableText } from '@/lib/uploads/extractText';
import type { StoredUpload } from '@/lib/uploads/settingsUploads';

/** Renders whatever an admin uploaded in /settings/view as plain text in the app's own reading
 *  style — no raw table grid, no embedded pdf viewer, matching how every other long-form field in
 *  this app (organisation synopsis, internal reviewer remarks, etc.) is presented. A csv is converted to
 *  "header: value" text per row; a pdf's text layer is extracted directly. Async server
 *  component, passed as `children` into InfoSidePanel (a client component) — server-rendered
 *  children crossing that boundary is fine, only a raw function/component reference isn't. */
export async function UploadedDocumentView({ upload }: { upload: StoredUpload | null }) {
  if (!upload) {
    return <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>nothing uploaded yet.</p>;
  }

  const buffer = Buffer.from(upload.dataBase64, 'base64');
  let text: string;
  try {
    text = upload.mimeType === 'text/csv' ? csvToReadableText(buffer.toString('utf-8')) : await extractPdfText(buffer);
  } catch {
    return (
      <p style={{ fontSize: 'var(--fs-small)', color: 'var(--delta-red)' }}>
        could not read {upload.filename} — try re-uploading it from settings.
      </p>
    );
  }

  if (!text) {
    return <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>{upload.filename} has no readable text.</p>;
  }

  return <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-primary)', lineHeight: 'var(--lh-relaxed)', whiteSpace: 'pre-wrap' }}>{text}</p>;
}
