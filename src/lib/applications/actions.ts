'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_TRANSITION_STAGE, CAN_REVIEW, CAN_MANAGE_SETTINGS } from '@/lib/auth/guard';
import { transitionApplication, setReviewStage } from '@/lib/stages/machine';
import { enqueueStageEmail, approveAndSendOutboxEmail } from '@/lib/mail/outbox';
import type { StageEmailTemplate } from '@/lib/mail/templates';
import { getSettings } from '@/lib/settings';
import { prisma } from '@/lib/db';
import type { StageStatusValue, InternalDecisionValue } from '@/lib/constants';
import { RUBRIC_CRITERIA, computeComposite, dispositionFromComposite } from '@/lib/scoring/rubric';

/** Stages that trigger an automated email — rejection or a congratulatory confirmation. Stages
 *  not listed here (SCREENING, UNDER_REVIEW, JURY_REVIEW, WITHDRAWN) are internal-only moves. */
const STAGE_EMAIL_TEMPLATE: Partial<Record<StageStatusValue, StageEmailTemplate>> = {
  REJECTED: 'general_rejection',
  SHORTLISTED: 'shortlisted',
  FINALIST: 'finalist',
  WINNER: 'winner',
};

async function performTransition(applicationId: string, toStatus: StageStatusValue, actorId: string, reason?: string) {
  await transitionApplication({ applicationId, toStatus, actorId, reason });

  const template = STAGE_EMAIL_TEMPLATE[toStatus];
  if (template) {
    const settings = await getSettings();
    const email = await enqueueStageEmail(applicationId, template, reason);
    // rejections respect the manual-approval-by-default setting; congratulatory emails carry no
    // reputational risk and always auto-send so a shortlist/finalist/winner doesn't sit queued.
    if (template === 'general_rejection' ? settings.autoSendRejections : true) {
      await approveAndSendOutboxEmail(email.id);
    }
  }

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath('/applications');
  revalidatePath('/dashboard');
  revalidatePath('/outreach');
}

export async function transitionApplicationAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_TRANSITION_STAGE);

  const applicationId = String(formData.get('applicationId'));
  const toStatus = String(formData.get('toStatus')) as StageStatusValue;
  const reason = String(formData.get('reason') ?? '') || undefined;

  await performTransition(applicationId, toStatus, user.id, reason);
}

/** Programmatic transition for the Kanban board's drag-and-drop — same rules and side effects
 *  as the form action above, just without a FormData wrapper. */
export async function moveApplicationStageAction(applicationId: string, toStatus: StageStatusValue) {
  const user = await getCurrentUser();
  assertRole(user, CAN_TRANSITION_STAGE);
  await performTransition(applicationId, toStatus, user.id, 'moved on the kanban board');
  return { ok: true };
}

/** Binary reviewed / not-reviewed toggle for the stage action panel, early-pipeline applications
 *  only (SUBMITTED/SCREENING/UNDER_REVIEW) — see setReviewStage for why this bypasses the
 *  validated single-hop machine. */
export async function setReviewStageAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_TRANSITION_STAGE);

  const applicationId = String(formData.get('applicationId'));
  const reviewed = String(formData.get('reviewed')) === 'true';

  await setReviewStage({ applicationId, reviewed, actorId: user.id });

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath('/applications');
  revalidatePath('/dashboard');
}

export async function submitHumanReviewAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_REVIEW);

  const applicationId = String(formData.get('applicationId'));
  const comment = String(formData.get('comment') ?? '');

  const scoreMap: Record<string, number> = {};
  const criteria = RUBRIC_CRITERIA.map((c) => {
    const score = Number(formData.get(`criterion_${c.key}`) ?? 0);
    scoreMap[c.key] = score;
    return { key: c.key, score, rationale: '', evidence: '', confidence: 1 };
  });
  const composite = computeComposite(scoreMap);
  // recommendation is no longer picked manually — it's derived straight from the reviewer's own
  // composite score, since that's now the actual signal (no separate MCQ to keep in sync with it).
  const disposition = dispositionFromComposite(composite);
  const recommendation = disposition === 'REJECT' ? 'REJECT' : disposition === 'BORDERLINE' ? 'HOLD' : 'ADVANCE';

  await prisma.humanReview.upsert({
    where: { applicationId_reviewerId: { applicationId, reviewerId: user.id } },
    create: {
      applicationId,
      reviewerId: user.id,
      criteria: JSON.stringify(criteria),
      composite,
      recommendation,
      comment,
    },
    update: { criteria: JSON.stringify(criteria), composite, recommendation, comment, submittedAt: new Date() },
  });

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath('/review');
}

/** Admin go/no-go gate — independent of stageStatus. Only applications marked YES here
 *  are visible to jury (see visibleApplicationWhere / listJuryQueue). */
export async function setInternalDecisionAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_TRANSITION_STAGE);

  const applicationId = String(formData.get('applicationId'));
  const decision = String(formData.get('decision')) as InternalDecisionValue | 'CLEAR';

  await prisma.application.update({
    where: { id: applicationId },
    data: { internalDecision: decision === 'CLEAR' ? null : decision },
  });

  revalidatePath('/applications');
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath('/jury');
}

/** Free-form internal discussion thread on an application — any signed-in user can post,
 *  separate from the formal HumanReview / JuryScore verdicts. */
export async function postCommentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Must be signed in to comment.');

  const applicationId = String(formData.get('applicationId'));
  const body = String(formData.get('body') ?? '').trim();
  if (!body) return;

  await prisma.comment.create({
    data: { applicationId, authorId: user.id, body },
  });

  revalidatePath('/applications');
  revalidatePath(`/applications/${applicationId}`);
}

/** Admin-only: set the full reviewer list for an application (replaces whatever was assigned
 *  before). Manual assignment — the automatic round-robin assigner was removed at the team's
 *  request, so this is now the only way applications get reviewers. */
export async function setApplicationReviewersAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const applicationId = String(formData.get('applicationId'));
  const reviewerIds = formData.getAll('reviewerIds').map(String);

  await prisma.$transaction([
    prisma.reviewAssignment.deleteMany({ where: { applicationId } }),
    prisma.reviewAssignment.createMany({
      data: reviewerIds.map((reviewerId) => ({ applicationId, reviewerId })),
    }),
  ]);

  revalidatePath('/applications');
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath('/review');
}

/** A reviewer's own private scratchpad on an application — one per (application, author), never
 *  shown to anyone else. Separate from postCommentAction (shared discussion thread). */
export async function saveNoteAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error('Must be signed in to save notes.');

  const applicationId = String(formData.get('applicationId'));
  const body = String(formData.get('body') ?? '');

  await prisma.note.upsert({
    where: { applicationId_authorId: { applicationId, authorId: user.id } },
    create: { applicationId, authorId: user.id, body },
    update: { body },
  });

  revalidatePath('/applications');
  revalidatePath(`/applications/${applicationId}`);
}
