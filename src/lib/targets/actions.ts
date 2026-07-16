'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_MANAGE_SETTINGS } from '@/lib/auth/guard';
import { prisma } from '@/lib/db';

/** Replaces the target wishlist from an uploaded CSV: name,website,domain,founders,notes */
export async function uploadTargetsCsvAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const file = formData.get('file') as File | null;
  if (!file) throw new Error('No file uploaded.');

  const text = await file.text();
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(',');
    return Object.fromEntries(headers.map((h, i) => [h, (cells[i] ?? '').trim()]));
  });

  await prisma.target.deleteMany();
  for (const row of rows) {
    if (!row.name) continue;
    await prisma.target.create({
      data: { name: row.name, website: row.website || null, domain: row.domain || null, notes: row.notes || null },
    });
  }

  revalidatePath('/targets');
}
