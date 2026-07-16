'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_REVIEW, CAN_MANAGE_SETTINGS } from '@/lib/auth/guard';
import { prisma } from '@/lib/db';
import { enqueueJobs, getJobStats } from '@/lib/jobs/queue';
import { syncApplicationsFromSupabase, type SupabaseSyncResult } from '@/lib/sources/supabase-source';
import { reassignAllInRotationOrder } from '@/lib/applications/assignment';

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

export async function getAutomationStats() {
  const [totalApps, scoredApps, matchedTargets, totalTargets, queuedOutbox, sentOutbox, jobStats, sitesToEnrich, enrichedApps] = await Promise.all([
    prisma.application.count({ where: { isDuplicateOf: null } }),
    prisma.application.count({ where: { isDuplicateOf: null, aiEvaluations: { some: {} } } }),
    prisma.target.count({ where: { status: { in: ['APPLIED', 'CONTACTED'] } } }),
    prisma.target.count(),
    prisma.outboxEmail.count({ where: { status: 'QUEUED' } }),
    prisma.outboxEmail.count({ where: { status: 'SENT' } }),
    getJobStats(),
    prisma.application.count({ where: { isDuplicateOf: null, website: { not: null } } }),
    prisma.application.count({ where: { isDuplicateOf: null, website: { not: null }, enrichmentSummary: { not: null } } }),
  ]);
  return { totalApps, scoredApps, matchedTargets, totalTargets, queuedOutbox, sentOutbox, jobStats, sitesToEnrich, enrichedApps };
}
