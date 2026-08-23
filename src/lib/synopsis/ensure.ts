import { prisma } from '@/lib/db';
import { enqueueJob } from '@/lib/jobs/queue';

async function hasQueuedSynopsisJob(applicationId: string): Promise<boolean> {
  const jobs = await prisma.job.findMany({
    where: { type: 'SYNOPSIZE_APPLICATION', status: { in: ['PENDING', 'RUNNING'] } },
    select: { payload: true },
  });
  return jobs.some((j) => {
    try {
      return (JSON.parse(j.payload) as { applicationId?: string }).applicationId === applicationId;
    } catch {
      return false;
    }
  });
}

/** Backfills the org & model synopsis for a YES-decided application that's never had a
 *  generation attempt — covers applications marked YES before this feature existed, and closes
 *  the race where nobody's JobQueueTicker happened to be running at the moment of the original
 *  decision. Called opportunistically from the pages jury/observer/admin actually view, so nobody
 *  has to press a button for the normal case — the viewer's own ticker (mounted for every signed-
 *  in role in AppShell) drains the job and refreshes the page within a few seconds on its own.
 *
 *  Deliberately never re-enqueues once any status exists (RUNNING/DONE/FAILED) — a stuck FAILED
 *  run needs an admin's manual "regenerate" (a real error worth a human look), not a silent retry
 *  loop firing on every page view. */
export async function ensureOrgSynopsisQueued(app: { id: string; internalDecision: string | null; orgSynopsisStatus: string | null }) {
  if (app.internalDecision !== 'YES' || app.orgSynopsisStatus) return;
  if (await hasQueuedSynopsisJob(app.id)) return;
  await enqueueJob('SYNOPSIZE_APPLICATION', app.id);
}
