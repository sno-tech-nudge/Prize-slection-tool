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

/** Re-queues the organisation & model synopsis for every YES-decided application, regardless of
 *  whether one already exists — unlike scoreAllUnscoredAction (which only targets applications
 *  with none yet), this is meant to force a rewrite of already-generated text after a prompt
 *  change, so "already has one" is not a reason to skip it. Drained the same way every other job
 *  is — the client-side ticker polling /api/jobs/tick — so this needs nothing beyond the admin
 *  clicking the button once on the live site. */
export async function regenerateAllSynopsesAction() {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const applications = await prisma.application.findMany({
    where: { isDuplicateOf: null, internalDecision: 'YES' },
    select: { id: true },
  });

  const queued = await enqueueJobs(
    'SYNOPSIZE_APPLICATION',
    applications.map((a) => a.id),
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

/** Moves every one of one person's review assignments AND their already-submitted HumanReview
 *  rows to another person — for when someone's old account (a rename, a domain change, a
 *  re-provisioned login) needs to hand off everything they were assigned/scored without touching
 *  anyone else's. Moving the actual reviews (not just assignments) is the point: leaving a stale
 *  HumanReview behind under the old account is exactly what silently dragged an application's
 *  displayed score down — the applications list averages every HumanReview row for an
 *  application, so an old, stale, or incomplete row sitting next to a real new one from the same
 *  person under a different account pulls the average toward the stale value instead of showing
 *  the real one. If the destination person already has their own row (assignment or review) for
 *  an application, the source's is dropped rather than kept — the unique (applicationId,
 *  reviewerId) constraint means both can't point at the same person on the same application
 *  anyway, and a review the destination already submitted under their own account is treated as
 *  the current, authoritative one. */
export async function reassignReviewerAction(formData: FormData): Promise<{ movedAssignments?: number; movedReviews?: number; error?: string }> {
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
  const assignmentResult = await prisma.reviewAssignment.updateMany({
    where: { reviewerId: fromUser.id },
    data: { reviewerId: toUser.id },
  });

  const toUsersReviews = await prisma.humanReview.findMany({
    where: { reviewerId: toUser.id },
    select: { applicationId: true },
  });
  if (toUsersReviews.length > 0) {
    await prisma.humanReview.deleteMany({
      where: { reviewerId: fromUser.id, applicationId: { in: toUsersReviews.map((r) => r.applicationId) } },
    });
  }
  const reviewResult = await prisma.humanReview.updateMany({
    where: { reviewerId: fromUser.id },
    data: { reviewerId: toUser.id },
  });

  revalidatePath('/applications');
  revalidatePath('/dashboard');
  revalidatePath('/review');
  return { movedAssignments: assignmentResult.count, movedReviews: reviewResult.count };
}

/** Same idea as reassignReviewerAction, for jury: moves one juror's bench membership and
 *  already-submitted JuryScore rows to another account. Bench membership (not just scores) has
 *  to move too, or the destination account's jury view (gated on being placed on a bench) simply
 *  wouldn't show the applications they're meant to be scoring. */
export async function reassignJurorAction(formData: FormData): Promise<{ movedBenches?: number; movedScores?: number; error?: string }> {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const fromEmail = String(formData.get('fromEmail') ?? '').trim().toLowerCase();
  const toEmail = String(formData.get('toEmail') ?? '').trim().toLowerCase();
  if (!fromEmail || !toEmail) return { error: 'enter both email addresses.' };
  if (fromEmail === toEmail) return { error: 'those are the same email address.' };

  const [fromUser, toUser] = await Promise.all([
    prisma.user.findUnique({ where: { email: fromEmail }, include: { benches: { select: { id: true } } } }),
    prisma.user.findUnique({ where: { email: toEmail } }),
  ]);
  if (!fromUser) return { error: `no team member found with email ${fromEmail}` };
  if (!toUser) return { error: `no team member found with email ${toEmail}` };

  if (fromUser.benches.length > 0) {
    await prisma.user.update({
      where: { id: toUser.id },
      data: { benches: { connect: fromUser.benches.map((b) => ({ id: b.id })) } },
    });
  }

  const toUsersScores = await prisma.juryScore.findMany({
    where: { jurorId: toUser.id },
    select: { applicationId: true },
  });
  if (toUsersScores.length > 0) {
    await prisma.juryScore.deleteMany({
      where: { jurorId: fromUser.id, applicationId: { in: toUsersScores.map((s) => s.applicationId) } },
    });
  }
  const scoreResult = await prisma.juryScore.updateMany({
    where: { jurorId: fromUser.id },
    data: { jurorId: toUser.id },
  });

  revalidatePath('/jury');
  revalidatePath('/applications');
  return { movedBenches: fromUser.benches.length, movedScores: scoreResult.count };
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
