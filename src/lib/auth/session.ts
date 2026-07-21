import { cache } from 'react';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifySession } from './session-token';
import type { User } from '@prisma/client';

export const SESSION_COOKIE = 'delta_session';

/**
 * Real login — reads the signed session cookie set by loginAction, verifies its HMAC (so a
 * cookie can't just be hand-edited to impersonate another user), then loads that user. No
 * session, invalid signature, or deleted user all resolve to null; middleware.ts is what
 * actually redirects anonymous requests to /login — this just answers "who, if anyone".
 *
 * Wrapped in React's cache() — nearly every layout AND page calls this once, which used to mean
 * 2+ round trips to the (remote) database per navigation. cache() dedupes repeat calls within a
 * single render pass down to one.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const userId = await verifySession(token);
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
});

export async function listUsers(): Promise<User[]> {
  return prisma.user.findMany({ orderBy: [{ role: 'asc' }, { name: 'asc' }] });
}
