import { prisma } from '@/lib/db';

// kept comfortably under next.config.js's serverActions.bodySizeLimit (4.5mb) and typical
// serverless request-body ceilings — large enough for a rubric CSV/PDF or a guidelines PDF that
// isn't image-heavy.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export type UploadKind = 'RUBRIC' | 'JURY_GUIDELINES';

export interface StoredUpload {
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  uploadedByName: string;
  dataBase64: string;
}

const KEY_PREFIX = 'upload:';

function keyFor(kind: UploadKind): string {
  return `${KEY_PREFIX}${kind}`;
}

/** Reuses the generic Setting table (value is a plain TEXT column, no size cap that matters at
 *  file-upload scale) rather than a dedicated table with a Bytes column — this keeps the whole
 *  feature schema-change-free, since a `prisma db push` against the live DB isn't something this
 *  environment can run itself. */
export async function getUpload(kind: UploadKind): Promise<StoredUpload | null> {
  const row = await prisma.setting.findUnique({ where: { key: keyFor(kind) } });
  if (!row) return null;
  try {
    return JSON.parse(row.value) as StoredUpload;
  } catch {
    return null;
  }
}

export async function saveUpload(kind: UploadKind, upload: StoredUpload): Promise<void> {
  await prisma.setting.upsert({
    where: { key: keyFor(kind) },
    create: { key: keyFor(kind), value: JSON.stringify(upload) },
    update: { value: JSON.stringify(upload) },
  });
}

export async function deleteUpload(kind: UploadKind): Promise<void> {
  await prisma.setting.deleteMany({ where: { key: keyFor(kind) } });
}
