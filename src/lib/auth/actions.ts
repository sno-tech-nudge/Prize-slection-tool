'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getCurrentUser, ROLE_COOKIE } from './session';
import { assertRole, CAN_MANAGE_SETTINGS } from './guard';
import type { UserRoleValue } from '@/lib/constants';

export async function switchUser(userId: string) {
  cookies().set(ROLE_COOKIE, userId, { httpOnly: true, sameSite: 'lax', path: '/' });
  revalidatePath('/', 'layout');
}

/** Admin-only: reassign another user's role. This is the closest thing this prototype has to
 *  real team/access management (see src/lib/auth/session.ts — there's no real auth yet, this
 *  just edits the User row that the dev role-switcher reads from). */
export async function setUserRoleAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const userId = String(formData.get('userId'));
  const role = String(formData.get('role')) as UserRoleValue;

  await prisma.user.update({ where: { id: userId }, data: { role } });

  revalidatePath('/settings');
  revalidatePath('/', 'layout');
}

/** Admin-only: add a new team member by email (created with a given starting role). */
export async function addUserAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const email = String(formData.get('email')).trim().toLowerCase();
  const name = String(formData.get('name')).trim();
  const role = String(formData.get('role')) as UserRoleValue;
  if (!email || !name) return;

  await prisma.user.upsert({
    where: { email },
    create: { email, name, role },
    update: { name, role },
  });

  revalidatePath('/settings');
  revalidatePath('/', 'layout');
}
