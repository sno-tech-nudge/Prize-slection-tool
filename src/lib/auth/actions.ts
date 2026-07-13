'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { ROLE_COOKIE } from './session';

export async function switchUser(userId: string) {
  cookies().set(ROLE_COOKIE, userId, { httpOnly: true, sameSite: 'lax', path: '/' });
  revalidatePath('/', 'layout');
}
