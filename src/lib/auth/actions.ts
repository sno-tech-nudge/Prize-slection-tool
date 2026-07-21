'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getCurrentUser, SESSION_COOKIE } from './session';
import { signSession } from './session-token';
import { verifyPassword } from './password';
import { assertRole, CAN_MANAGE_SETTINGS } from './guard';
import type { UserRoleValue } from '@/lib/constants';

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export async function loginAction(formData: FormData): Promise<{ error: string } | void> {
  const username = String(formData.get('username') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  const user = username ? await prisma.user.findUnique({ where: { username } }) : null;
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return { error: 'incorrect username or password' };
  }

  cookies().set(SESSION_COOKIE, await signSession(user.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: THIRTY_DAYS,
  });

  redirect('/dashboard');
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

/** Admin-only: add a new team member by email (created with a given starting role). Note: this
 *  doesn't set a username/password — that's done via the seed-users script, since logins are
 *  provisioned by an admin out of band, not self-served. */
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
