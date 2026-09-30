'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_MANAGE_SETTINGS } from '@/lib/auth/guard';

/** Every non-duplicate application's id + org name — the matching surface the deck upload panel
 *  compares uploaded filenames against. Admin-only, same gate as the panel itself. */
export async function listApplicationsForDeckMatchingAction() {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  return prisma.application.findMany({
    where: { isDuplicateOf: null },
    orderBy: { orgName: 'asc' },
    select: { id: true, orgName: true, deckUrl: true },
  });
}

/** Saves the already-uploaded Blob URL onto the matched application — called once per file right
 *  after the browser's direct-to-Blob upload (see DeckUploadPanel) resolves, so this never
 *  handles the file itself, only the resulting URL. */
export async function setDeckUrlAction(applicationId: string, url: string) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  await prisma.application.update({ where: { id: applicationId }, data: { deckUrl: url } });

  revalidatePath('/applications');
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath('/applications/round-2');
  revalidatePath('/applications/round-3');
}
