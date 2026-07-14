import { cache } from 'react';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import type { User } from '@prisma/client';

export const ROLE_COOKIE = 'delta_user_id';

/**
 * Dev-only role switcher. Reads the active user id from an httpOnly cookie.
 * SWAP: replace this whole module with real session lookup (Supabase Auth /
 * Clerk) — every call site already goes through getCurrentUser() + guards,
 * so the swap is mechanical.
 *
 * Wrapped in React's cache() — nearly every layout AND page calls this once,
 * which used to mean 2+ round trips to the (remote) database per navigation.
 * cache() dedupes repeat calls within a single render pass down to one.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const cookieStore = cookies();
  const userId = cookieStore.get(ROLE_COOKIE)?.value;

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) return user;
  }

  // fall back to the first seeded admin so the demo is never blank
  return prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' } });
});

export async function listUsers(): Promise<User[]> {
  return prisma.user.findMany({ orderBy: [{ role: 'asc' }, { name: 'asc' }] });
}
