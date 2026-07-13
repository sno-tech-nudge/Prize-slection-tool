import type { StageStatusValue } from '@/lib/constants';
import { prisma } from '@/lib/db';
import { canTransition, IllegalTransitionError } from './rules';

export { STAGE_ORDER, LEGAL_TRANSITIONS, canTransition, IllegalTransitionError } from './rules';

/** Validated single-hop transition, used by the review/jury/admin server actions. */
export async function transitionApplication(params: {
  applicationId: string;
  toStatus: StageStatusValue;
  actorId?: string | null;
  reason?: string;
}) {
  const app = await prisma.application.findUniqueOrThrow({ where: { id: params.applicationId } });
  const from = app.stageStatus as StageStatusValue;
  if (!canTransition(from, params.toStatus)) {
    throw new IllegalTransitionError(from, params.toStatus);
  }
  await prisma.$transaction([
    prisma.application.update({ where: { id: params.applicationId }, data: { stageStatus: params.toStatus } }),
    prisma.stageTransition.create({
      data: {
        applicationId: params.applicationId,
        fromStatus: from,
        toStatus: params.toStatus,
        actorId: params.actorId ?? null,
        reason: params.reason,
      },
    }),
  ]);
  return { from, to: params.toStatus };
}

/**
 * Free-form, non-validated toggle used by the "stage action" panel's binary reviewed/not-reviewed
 * control (early-pipeline applications only — SUBMITTED/SCREENING/UNDER_REVIEW). Unlike
 * transitionApplication above, this does not check canTransition — it's an explicit admin
 * override, same trust level as the decision-status buttons and AI-score override elsewhere.
 * Applications that have already progressed to SHORTLISTED or beyond keep using the validated
 * single-hop dropdown so real pipeline progression (jury/finalist/winner) isn't affected.
 */
export async function setReviewStage(params: { applicationId: string; reviewed: boolean; actorId?: string | null }) {
  const app = await prisma.application.findUniqueOrThrow({ where: { id: params.applicationId } });
  const from = app.stageStatus as StageStatusValue;
  const to: StageStatusValue = params.reviewed ? 'UNDER_REVIEW' : 'SUBMITTED';
  if (from === to) return { from, to };

  await prisma.$transaction([
    prisma.application.update({ where: { id: params.applicationId }, data: { stageStatus: to } }),
    prisma.stageTransition.create({
      data: {
        applicationId: params.applicationId,
        fromStatus: from,
        toStatus: to,
        actorId: params.actorId ?? null,
        reason: params.reviewed ? 'marked as reviewed' : 'marked as not reviewed',
      },
    }),
  ]);
  return { from, to };
}

/**
 * Seed-only helper: backfills a full transition history from SUBMITTED to
 * `path`'s final status, with spaced-out timestamps, without going through
 * the single-hop validation above (seed data models *outcomes*, not a live
 * sequence of user actions).
 */
export async function seedTransitionPath(params: {
  applicationId: string;
  path: StageStatusValue[]; // e.g. ['SUBMITTED', 'SCREENING', 'UNDER_REVIEW', 'SHORTLISTED']
  actorId?: string | null;
  daysAgoStart?: number;
}) {
  const { applicationId, path, actorId, daysAgoStart = 90 } = params;
  const totalHops = path.length - 1;
  for (let i = 0; i < totalHops; i++) {
    const daysAgo = Math.round(daysAgoStart * (1 - i / Math.max(totalHops, 1)));
    const createdAt = new Date(Date.now() - daysAgo * 86400000);
    await prisma.stageTransition.create({
      data: {
        applicationId,
        fromStatus: path[i],
        toStatus: path[i + 1],
        actorId: actorId ?? null,
        reason: i === totalHops - 1 ? 'seed: historical outcome' : undefined,
        createdAt,
      },
    });
  }
  await prisma.application.update({ where: { id: applicationId }, data: { stageStatus: path[path.length - 1] } });
}
