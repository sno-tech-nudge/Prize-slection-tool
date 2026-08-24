'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_MANAGE_SETTINGS } from '@/lib/auth/guard';
import { saveUpload, deleteUpload, MAX_UPLOAD_BYTES, type UploadKind } from './settingsUploads';

function isValidKind(value: unknown): value is UploadKind {
  return value === 'RUBRIC' || value === 'JURY_GUIDELINES';
}

// enforced server-side, not just via the file input's `accept` attribute (that's a UI hint only —
// nothing stops a request built by hand from attaching anything). Checked by extension rather
// than the browser-supplied MIME type, which is unreliable (a renamed file, or a browser that
// sends an empty type for .csv, would otherwise slip through either a mismatched or blank type).
function isAllowedFilename(filename: string): boolean {
  return /\.(csv|pdf)$/i.test(filename);
}

export async function uploadResourceAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const kind = formData.get('kind');
  if (!isValidKind(kind)) throw new Error('Invalid upload kind.');

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) throw new Error('Choose a file to upload.');
  if (!isAllowedFilename(file.name)) throw new Error('Only .csv or .pdf files are accepted.');
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File is too large — keep it under ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))}MB.`);
  }

  const isCsv = /\.csv$/i.test(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  await saveUpload(kind, {
    filename: file.name,
    // the browser-supplied type is normalized here rather than trusted as-is, so the viewer can
    // reliably branch on "is this a csv or a pdf" without re-sniffing the filename later.
    mimeType: isCsv ? 'text/csv' : 'application/pdf',
    size: file.size,
    uploadedAt: new Date().toISOString(),
    uploadedByName: user.name,
    dataBase64: buffer.toString('base64'),
  });

  revalidatePath('/settings/view');
  revalidatePath('/applications');
}

export async function deleteResourceAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const kind = formData.get('kind');
  if (!isValidKind(kind)) throw new Error('Invalid upload kind.');

  await deleteUpload(kind);
  revalidatePath('/settings/view');
  revalidatePath('/applications');
}
