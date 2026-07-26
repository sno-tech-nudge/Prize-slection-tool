'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_MANAGE_SETTINGS } from '@/lib/auth/guard';
import { hashPassword } from '@/lib/auth/password';

function refreshBenchViews() {
  revalidatePath('/settings/benches');
  revalidatePath('/applications');
  revalidatePath('/', 'layout');
}

export async function createBenchAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;

  await prisma.bench.create({ data: { name } });
  refreshBenchViews();
}

/** Unassigns every juror and application first — deleting a bench shouldn't silently orphan
 *  people mid-review, it should hand them back to "unassigned" so an admin notices and re-places
 *  them, rather than a foreign-key surprise. */
export async function deleteBenchAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const benchId = String(formData.get('benchId'));
  await prisma.$transaction([
    prisma.user.updateMany({ where: { benchId }, data: { benchId: null } }),
    prisma.application.updateMany({ where: { benchId }, data: { benchId: null } }),
    prisma.bench.delete({ where: { id: benchId } }),
  ]);
  refreshBenchViews();
}

export async function assignJurorBenchAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const userId = String(formData.get('userId'));
  const benchId = String(formData.get('benchId') || '') || null;
  await prisma.user.update({ where: { id: userId }, data: { benchId } });
  refreshBenchViews();
}

export async function assignApplicationBenchAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const applicationId = String(formData.get('applicationId'));
  const benchId = String(formData.get('benchId') || '') || null;
  await prisma.application.update({ where: { id: applicationId }, data: { benchId } });
  refreshBenchViews();
}

/** Creates a brand-new jury member with a real login in one step — unlike addUserAction (which
 *  only creates the User row and leaves username/passwordHash for an out-of-band script), jurors
 *  are frequently external people an admin needs to onboard on the spot from this page. */
export async function addJuryMemberAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const benchId = String(formData.get('benchId') || '') || null;
  if (!name || !email || !password) return;

  const passwordHash = hashPassword(password);
  await prisma.user.upsert({
    where: { email },
    create: { name, email, role: 'JURY', username: email, passwordHash, benchId },
    update: { name, role: 'JURY', username: email, passwordHash, benchId },
  });
  refreshBenchViews();
}
