'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_REVIEW, CAN_MANAGE_SETTINGS } from '@/lib/auth/guard';
import { prisma } from '@/lib/db';
import { enqueueJobs, getJobStats } from '@/lib/jobs/queue';
import { syncApplicationsFromSupabase, type SupabaseSyncResult } from '@/lib/sources/supabase-source';
import { reassignAllInRotationOrder } from '@/lib/applications/assignment';
import { getSettings } from '@/lib/settings';

const BATCH_LIMIT = 200; // enqueue is cheap (no LLM call happens here) — the ticker drains it over time

export async function syncSupabaseAction(): Promise<SupabaseSyncResult> {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const result = await syncApplicationsFromSupabase();

  revalidatePath('/dashboard');
  revalidatePath('/applications');
  return result;
}

export async function scoreAllUnscoredAction() {
  const user = await getCurrentUser();
  assertRole(user, CAN_REVIEW);

  const unscored = await prisma.application.findMany({
    where: { isDuplicateOf: null, aiEvaluations: { none: {} } },
    select: { id: true },
    take: BATCH_LIMIT,
  });

  const queued = await enqueueJobs(
    'SCORE_APPLICATION',
    unscored.map((a) => a.id),
  );

  revalidatePath('/dashboard');
  revalidatePath('/applications');
  return { queued };
}

export async function enrichAllAction() {
  const user = await getCurrentUser();
  assertRole(user, CAN_REVIEW);

  const unenriched = await prisma.application.findMany({
    where: { isDuplicateOf: null, website: { not: null }, enrichedAt: null },
    select: { id: true },
    take: BATCH_LIMIT,
  });

  const queued = await enqueueJobs(
    'ENRICH_APPLICATION',
    unenriched.map((a) => a.id),
  );

  revalidatePath('/dashboard');
  revalidatePath('/applications');
  return { queued };
}

export async function rerunMatcherAction() {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const applications = await prisma.application.findMany({
    where: { isDuplicateOf: null },
    select: { id: true },
  });

  const queued = await enqueueJobs(
    'MATCH_APPLICATION',
    applications.map((a) => a.id),
  );

  revalidatePath('/dashboard');
  revalidatePath('/targets');
  return { queued };
}

export async function reassignAllInRotationOrderAction() {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const result = await reassignAllInRotationOrder();

  revalidatePath('/applications');
  revalidatePath('/dashboard');
  revalidatePath('/review');
  return result;
}

/** Moves every one of one person's review assignments to another person — for when someone's
 *  old account (a rename, a domain change, a re-provisioned login) needs to hand off everything
 *  they were assigned without touching anyone else's assignments. If the destination person is
 *  already assigned to an application the source person is also on, the source's duplicate is
 *  dropped rather than kept — the unique (applicationId, reviewerId) constraint means both can't
 *  end up pointing at the same person on the same application anyway. */
export async function reassignReviewerAction(formData: FormData): Promise<{ moved?: number; error?: string }> {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const fromEmail = String(formData.get('fromEmail') ?? '').trim().toLowerCase();
  const toEmail = String(formData.get('toEmail') ?? '').trim().toLowerCase();
  if (!fromEmail || !toEmail) return { error: 'enter both email addresses.' };
  if (fromEmail === toEmail) return { error: 'those are the same email address.' };

  const [fromUser, toUser] = await Promise.all([
    prisma.user.findUnique({ where: { email: fromEmail } }),
    prisma.user.findUnique({ where: { email: toEmail } }),
  ]);
  if (!fromUser) return { error: `no team member found with email ${fromEmail}` };
  if (!toUser) return { error: `no team member found with email ${toEmail}` };

  const toUsersAssignments = await prisma.reviewAssignment.findMany({
    where: { reviewerId: toUser.id },
    select: { applicationId: true },
  });
  if (toUsersAssignments.length > 0) {
    await prisma.reviewAssignment.deleteMany({
      where: { reviewerId: fromUser.id, applicationId: { in: toUsersAssignments.map((a) => a.applicationId) } },
    });
  }

  const result = await prisma.reviewAssignment.updateMany({
    where: { reviewerId: fromUser.id },
    data: { reviewerId: toUser.id },
  });

  revalidatePath('/applications');
  revalidatePath('/dashboard');
  revalidatePath('/review');
  return { moved: result.count };
}

export async function getAutomationStats() {
  const [totalApps, scoredApps, matchedTargets, totalTargets, queuedOutbox, sentOutbox, jobStats, sitesToEnrich, enrichedApps, settings] =
    await Promise.all([
      prisma.application.count({ where: { isDuplicateOf: null } }),
      prisma.application.count({ where: { isDuplicateOf: null, aiEvaluations: { some: {} } } }),
      prisma.target.count({ where: { status: { in: ['APPLIED', 'CONTACTED'] } } }),
      prisma.target.count(),
      prisma.outboxEmail.count({ where: { status: 'QUEUED' } }),
      prisma.outboxEmail.count({ where: { status: 'SENT' } }),
      getJobStats(),
      prisma.application.count({ where: { isDuplicateOf: null, website: { not: null } } }),
      prisma.application.count({ where: { isDuplicateOf: null, website: { not: null }, enrichmentSummary: { not: null } } }),
      getSettings(),
    ]);
  return {
    totalApps,
    scoredApps,
    matchedTargets,
    totalTargets,
    queuedOutbox,
    sentOutbox,
    jobStats,
    sitesToEnrich,
    enrichedApps,
    autoSendRejections: settings.autoSendRejections,
  };
}
