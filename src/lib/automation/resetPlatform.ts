'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_MANAGE_SETTINGS } from '@/lib/auth/guard';
import { verifyPassword } from '@/lib/auth/password';

export interface ResetPreviewCounts {
  applications: number;
  benches: number;
  targets: number;
  jobs: number;
  nonAdminUsers: number;
}

/** Read-only counts shown in the confirmation dialog before anyone types a password, so an admin
 *  sees the real scale of what's about to be permanently deleted rather than just a generic
 *  warning. */
export async function getResetPreviewCountsAction(): Promise<ResetPreviewCounts> {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const [applications, benches, targets, jobs, nonAdminUsers] = await Promise.all([
    prisma.application.count(),
    prisma.bench.count(),
    prisma.target.count(),
    prisma.job.count(),
    prisma.user.count({ where: { role: { not: 'ADMIN' } } }),
  ]);

  return { applications, benches, targets, jobs, nonAdminUsers };
}

/** The full platform reset — deletes every application (cascading away founders, funders, tech
 *  use cases, report links, review assignments, comments, notifications, notes, AI evaluations,
 *  human reviews, jury scores, stage transitions, and outbox emails), every bench, every wishlist
 *  target, every queued/finished job, and every non-ADMIN user account — so the platform can be
 *  reused clean for the next challenge. ADMIN accounts and their logins are the only user data
 *  that survives. `Setting` rows (rubric weights, field visibility, active data source, etc.) are
 *  deliberately left untouched — that's platform configuration, not this challenge's data, and
 *  nothing the request asked to clear.
 *
 *  Double-guarded exactly as specified: the caller must already be ADMIN (enforced by every
 *  caller of this action needing a valid session), and must additionally supply their OWN current
 *  account password, re-verified against their own passwordHash — never a shared/fixed password —
 *  so this can never fire from a single misclick or a guessed generic password. */
export async function resetPlatformDataAction(password: string): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  if (!password) {
    return { ok: false, error: 'enter your password to confirm.' };
  }
  if (!user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return { ok: false, error: 'incorrect password.' };
  }

  // application delete must run first — every other model here either cascades from it (so
  // there's nothing left over to clean up) or, for User, would otherwise still be referenced by
  // rows (ReviewAssignment.reviewerId, HumanReview.reviewerId, JuryScore.jurorId, Comment/
  // Note.authorId, StageTransition.actorId) that only go away via that same application-side
  // cascade — deleting users first would hit those references while they still exist.
  await prisma.$transaction([
    prisma.application.deleteMany({}),
    prisma.bench.deleteMany({}),
    prisma.target.deleteMany({}),
    prisma.job.deleteMany({}),
    prisma.user.deleteMany({ where: { role: { not: 'ADMIN' } } }),
  ]);

  revalidatePath('/', 'layout');
  return { ok: true };
}
