import { prisma } from '@/lib/db';
import { scoreApplication } from '@/lib/scoring/runner';
import { runMatcherForApplication } from '@/lib/matching/matcher';
import { enrichApplication } from '@/lib/enrichment/runner';

export type JobType = 'SCORE_APPLICATION' | 'MATCH_APPLICATION' | 'ENRICH_APPLICATION';

/**
 * Lightweight async job queue: a DB table instead of Redis/BullMQ, so the prototype stays
 * zero-infra. Ingestion (apply form, webhook) and the automation panel's bulk actions enqueue
 * jobs and return immediately; a client-side ticker (`JobQueueTicker`) calls `/api/jobs/tick`
 * every few seconds to actually run them. Swap point for production: point `processNextBatch`
 * at a real queue consumer (SQS/BullMQ/pg-boss) instead of polling.
 */
export async function enqueueJob(type: JobType, applicationId: string) {
  return prisma.job.create({
    data: { type, payload: JSON.stringify({ applicationId }), status: 'PENDING' },
  });
}

export async function enqueueJobs(type: JobType, applicationIds: string[]) {
  if (applicationIds.length === 0) return 0;
  await prisma.job.createMany({
    data: applicationIds.map((applicationId) => ({ type, payload: JSON.stringify({ applicationId }), status: 'PENDING' })),
  });
  return applicationIds.length;
}

async function runJob(jobId: string, type: string, payload: string) {
  const { applicationId } = JSON.parse(payload) as { applicationId: string };
  if (type === 'SCORE_APPLICATION') {
    await scoreApplication(applicationId);
  } else if (type === 'MATCH_APPLICATION') {
    await runMatcherForApplication(applicationId);
  } else if (type === 'ENRICH_APPLICATION') {
    await enrichApplication(applicationId);
  } else {
    throw new Error(`unknown job type: ${type}`);
  }
}

/** Claims and runs up to `limit` pending jobs. Returns how many ran and how many failed. */
export async function processPendingJobs(limit = 3): Promise<{ ran: number; failed: number }> {
  const pending = await prisma.job.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });

  let ran = 0;
  let failed = 0;

  for (const job of pending) {
    // best-effort claim — fine for a single-process dev prototype; a real queue would use
    // SELECT ... FOR UPDATE SKIP LOCKED or equivalent to be safe under concurrent workers.
    const claimed = await prisma.job.updateMany({
      where: { id: job.id, status: 'PENDING' },
      data: { status: 'RUNNING', startedAt: new Date(), attempts: { increment: 1 } },
    });
    if (claimed.count === 0) continue;

    try {
      await runJob(job.id, job.type, job.payload);
      await prisma.job.update({ where: { id: job.id }, data: { status: 'DONE', finishedAt: new Date() } });
      ran++;
    } catch (err) {
      await prisma.job.update({
        where: { id: job.id },
        data: { status: 'FAILED', finishedAt: new Date(), error: err instanceof Error ? err.message : 'unknown error' },
      });
      failed++;
    }
  }

  return { ran, failed };
}

export async function getJobStats() {
  const rows = await prisma.job.groupBy({ by: ['status'], _count: { _all: true } });
  const stats = { PENDING: 0, RUNNING: 0, DONE: 0, FAILED: 0 };
  for (const r of rows) stats[r.status as keyof typeof stats] = r._count._all;
  return stats;
}
