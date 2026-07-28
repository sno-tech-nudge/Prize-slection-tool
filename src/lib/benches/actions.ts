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

/** Unassigns every application first, then deletes the bench — Prisma cleans up the implicit
 *  juror↔bench join table rows automatically when the Bench row goes away, so jurors just lose
 *  that one bench membership (any other benches they're on are untouched) instead of hitting a
 *  foreign-key surprise. Applications get explicitly unassigned so an admin notices and
 *  re-places them rather than them silently vanishing from the shortlist. */
export async function deleteBenchAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const benchId = String(formData.get('benchId'));
  await prisma.$transaction([
    prisma.application.updateMany({ where: { benchId }, data: { benchId: null } }),
    prisma.bench.delete({ where: { id: benchId } }),
  ]);
  refreshBenchViews();
}

/** Sets a juror's full bench membership in one call — replaces whatever benches they were on
 *  with exactly this list, so a juror can sit on multiple benches at once instead of just one. */
export async function setJurorBenchesAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const userId = String(formData.get('userId'));
  const benchIds = formData.getAll('benchId').map(String);
  await prisma.user.update({
    where: { id: userId },
    data: { benches: { set: benchIds.map((id) => ({ id })) } },
  });
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
    create: { name, email, role: 'JURY', username: email, passwordHash, benches: benchId ? { connect: { id: benchId } } : undefined },
    // deliberately doesn't touch `benches` on update — this form is also used to reset an
    // existing juror's name/password, and shouldn't silently wipe bench memberships they've
    // since been added to via the multi-select in the jury members list.
    update: { name, role: 'JURY', username: email, passwordHash },
  });
  refreshBenchViews();
}
