'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_MANAGE_SETTINGS } from '@/lib/auth/guard';
import { saveUpload, deleteUpload, MAX_UPLOAD_BYTES, type UploadKind } from './settingsUploads';

function isValidKind(value: unknown): value is UploadKind {
  return value === 'RUBRIC' || value === 'JURY_GUIDELINES';
}

export async function uploadResourceAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const kind = formData.get('kind');
  if (!isValidKind(kind)) throw new Error('Invalid upload kind.');

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) throw new Error('Choose a file to upload.');
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File is too large — keep it under ${Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))}MB.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await saveUpload(kind, {
    filename: file.name,
    mimeType: file.type || 'application/octet-stream',
    size: file.size,
    uploadedAt: new Date().toISOString(),
    uploadedByName: user.name,
    dataBase64: buffer.toString('base64'),
  });

  revalidatePath('/settings/view');
}

export async function deleteResourceAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const kind = formData.get('kind');
  if (!isValidKind(kind)) throw new Error('Invalid upload kind.');

  await deleteUpload(kind);
  revalidatePath('/settings/view');
}
