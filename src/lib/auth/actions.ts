'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { getCurrentUser, SESSION_COOKIE } from './session';
import { signSession } from './session-token';
import { verifyPassword, hashPassword } from './password';
import { assertRole, CAN_MANAGE_SETTINGS } from './guard';
import type { UserRoleValue } from '@/lib/constants';

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function loginAction(formData: FormData): Promise<{ error: string } | void> {
  const username = String(formData.get('username') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  const user = username ? await prisma.user.findUnique({ where: { username } }) : null;
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return { error: 'incorrect email or password' };
  }

  cookies().set(SESSION_COOKIE, await signSession(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: THIRTY_DAYS,
  });

  // jury's whole workflow lives on /applications — there's no reason to route them through the
  // admin/reviewer dashboard first.
  redirect(user.role === 'JURY' ? '/applications' : '/dashboard');
}

export async function logoutAction() {
  cookies().delete(SESSION_COOKIE);
  redirect('/login');
}

/** Admin-only: reassign another user's role. */
export async function setUserRoleAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const userId = String(formData.get('userId'));
  const role = String(formData.get('role')) as UserRoleValue;

  await prisma.user.update({ where: { id: userId }, data: { role } });

  revalidatePath('/settings');
  revalidatePath('/', 'layout');
}

/** Admin-only: add a new team member by email (created with a given starting role). A password
 *  is optional here — leave it blank to create just the profile (matches the old behaviour, e.g.
 *  for someone who already has a login provisioned another way); fill it in to set up a real,
 *  working login (username + hashed password) in this same step, same pattern as
 *  addJuryMemberAction already uses for jury members. Also works to reset an existing person's
 *  password by re-submitting this form for their email with a new one. */
export async function addUserAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const email = String(formData.get('email')).trim().toLowerCase();
  const name = String(formData.get('name')).trim();
  const role = String(formData.get('role')) as UserRoleValue;
  const password = String(formData.get('password') ?? '').trim();
  if (!email || !name) return;

  const loginFields = password ? { username: email, passwordHash: hashPassword(password) } : {};

  await prisma.user.upsert({
    where: { email },
    create: { email, name, role, ...loginFields },
    update: { name, role, ...loginFields },
  });

  revalidatePath('/settings');
  revalidatePath('/', 'layout');
}

/** Admin-only: edit an existing team member's name/email, and optionally reset their password in
 *  the same step (leave it blank to leave their login untouched). If they already have a real
 *  login (username = their email, set via addJuryMemberAction, this form's own password field,
 *  or the seed-logins script), the username is kept in sync with the new email so their login
 *  doesn't silently break. */
export async function updateUserAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const userId = String(formData.get('userId'));
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '').trim();
  if (!name || !email) return;

  const existing = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const loginFields = password
    ? { username: email, passwordHash: hashPassword(password) }
    : { username: existing.passwordHash ? email : existing.username };

  await prisma.user.update({
    where: { id: userId },
    data: { name, email, ...loginFields },
  });

  revalidatePath('/settings');
  revalidatePath('/settings/benches');
  revalidatePath('/', 'layout');
}

/** Admin-only: remove a team member entirely. Refuses to remove your own account, and refuses
 *  (with a clear reason) if the person has any review, jury score, comment, or note on record —
 *  deleting them would either silently erase that history or fail on the database's own foreign
 *  key constraint, so this surfaces the block as a normal result instead of a crash. Reassign or
 *  clear their work first, or just change their role if the goal is to take them off active
 *  duty rather than erase them. */
export async function deleteUserAction(formData: FormData): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const userId = String(formData.get('userId'));
  if (user && userId === user.id) return { error: "you can't remove your own account." };

  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
      return { error: 'this person has existing reviews, jury scores, notes, or comments on record — reassign or clear those first, or change their role instead of removing them.' };
    }
    throw err;
  }

  revalidatePath('/settings');
  revalidatePath('/settings/benches');
  revalidatePath('/', 'layout');
  return {};
}
