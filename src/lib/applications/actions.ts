'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, canManageApplication, ForbiddenError, CAN_REVIEW, CAN_MANAGE_SETTINGS } from '@/lib/auth/guard';
import { transitionApplication, setReviewStage } from '@/lib/stages/machine';
import { enqueueStageEmail, approveAndSendOutboxEmail } from '@/lib/mail/outbox';
import type { StageEmailTemplate } from '@/lib/mail/templates';
import { getSettings } from '@/lib/settings';
import { prisma } from '@/lib/db';
import type { StageStatusValue, RoundDecisionValue, CurrentRoundValue } from '@/lib/constants';
import { RUBRIC_CRITERIA, computeComposite, dispositionFromComposite } from '@/lib/scoring/rubric';
import { notifyMentionedUsers } from '@/lib/notifications/actions';
import { enqueueJob } from '@/lib/jobs/queue';

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

/** Admin can transition any application; a reviewer can only transition one they're actually
 *  assigned to — same rule as scoring (canManageApplication), so an assigned reviewer isn't stuck
 *  looking at a read-only stage panel on their own applications, while still being blocked from
 *  touching anyone else's. */
export async function transitionApplicationAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_REVIEW);

  const applicationId = String(formData.get('applicationId'));
  const assignments = await prisma.reviewAssignment.findMany({ where: { applicationId }, select: { reviewerId: true } });
  if (!canManageApplication(user, assignments)) {
    throw new ForbiddenError('You can only manage applications assigned to you.');
  }

  const toStatus = String(formData.get('toStatus')) as StageStatusValue;
  const reason = String(formData.get('reason') ?? '') || undefined;

  await performTransition(applicationId, toStatus, user.id, reason);
}

/** Programmatic transition for the Kanban board's drag-and-drop — same rules and side effects
 *  as the form action above, just without a FormData wrapper. */
export async function moveApplicationStageAction(applicationId: string, toStatus: StageStatusValue) {
  const user = await getCurrentUser();
  assertRole(user, CAN_REVIEW);
  const assignments = await prisma.reviewAssignment.findMany({ where: { applicationId }, select: { reviewerId: true } });
  if (!canManageApplication(user, assignments)) {
    throw new ForbiddenError('You can only manage applications assigned to you.');
  }
  await performTransition(applicationId, toStatus, user.id, 'moved on the kanban board');
  return { ok: true };
}

/** Binary reviewed / not-reviewed toggle for the stage action panel, early-pipeline applications
 *  only (SUBMITTED/SCREENING/UNDER_REVIEW) — see setReviewStage for why this bypasses the
 *  validated single-hop machine. Same admin-or-assigned-reviewer rule as every other mutation on
 *  this stage panel. */
export async function setReviewStageAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_REVIEW);

  const applicationId = String(formData.get('applicationId'));
  const assignments = await prisma.reviewAssignment.findMany({ where: { applicationId }, select: { reviewerId: true } });
  if (!canManageApplication(user, assignments)) {
    throw new ForbiddenError('You can only manage applications assigned to you.');
  }

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

  // admin can score anything; a reviewer can only score an application they're actually
  // assigned to — otherwise every admin-role "reviewer" could submit a score on every
  // application regardless of who was assigned, which is exactly the gap this closes.
  const assignments = await prisma.reviewAssignment.findMany({ where: { applicationId }, select: { reviewerId: true } });
  if (!canManageApplication(user, assignments)) {
    throw new ForbiddenError('You can only score applications assigned to you.');
  }

  // a blank score input submits as an empty string, and Number('') is silently 0 — with no check
  // here, a review missing several criteria (e.g. reopened after a rubric change replaced most
  // criterion keys, so most fields reload blank) would save a badly deflated composite with zero
  // indication anything was wrong. Reject incomplete submissions outright instead.
  const scoredCriteriaDefs = RUBRIC_CRITERIA.filter((c) => c.maxScore > 0);
  const missing = scoredCriteriaDefs.filter((c) => String(formData.get(`criterion_${c.key}`) ?? '').trim() === '');
  if (missing.length > 0) {
    throw new Error(`Score every criterion before submitting — missing: ${missing.map((c) => c.label).join(', ')}.`);
  }

  const scoreMap: Record<string, number> = {};
  const criteria = RUBRIC_CRITERIA.map((c) => {
    const score = Number(formData.get(`criterion_${c.key}`) ?? 0);
    scoreMap[c.key] = score;
    const criterionComment = String(formData.get(`criterion_comment_${c.key}`) ?? '').trim();
    return { key: c.key, score, rationale: '', evidence: '', confidence: 1, comment: criterionComment || undefined };
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

  // reviewed status everywhere else (dashboard KPI, applications list filter/badge) is derived
  // purely from HumanReview existence — revalidate those too so a freshly submitted review shows
  // up as "reviewed" immediately, not just on the application's own detail page.
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath('/review');
  revalidatePath('/applications');
  revalidatePath('/dashboard');
}

const ROUND_DECISION_FIELD = {
  1: 'round1Decision',
  2: 'round2Decision',
  3: 'round3Decision',
} as const;

const ROUND_ORDER: CurrentRoundValue[] = ['ROUND_1', 'ROUND_2', 'ROUND_3', 'SELECTED'];
const ROUND_TARGET_ON_YES: Record<1 | 2 | 3, CurrentRoundValue> = {
  1: 'ROUND_2',
  2: 'ROUND_3',
  3: 'SELECTED',
};

/** Round-scoped go/no-go gate. Round 1 controls jury visibility (see visibleApplicationWhere /
 *  listJuryQueue) exactly as the old single internalDecision field did. Round 2 only becomes
 *  actionable once round1Decision is YES, round 3 only once round2Decision is YES — enforced here,
 *  not just in the UI, since this is a server action. Admin can set any round on anything; a
 *  reviewer can only set it on an application they're actually assigned to, same rule as scoring
 *  and the old stage transitions. Marking a round YES auto-advances currentRound to the next round,
 *  but never regresses it if the application is already further along (e.g. an admin who manually
 *  jumped it to SELECTED, then goes back and edits an earlier round's decision). */
export async function setRoundDecisionAction(round: 1 | 2 | 3, formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_REVIEW);

  const applicationId = String(formData.get('applicationId'));
  const assignments = await prisma.reviewAssignment.findMany({ where: { applicationId }, select: { reviewerId: true } });
  if (!canManageApplication(user, assignments)) {
    throw new ForbiddenError('You can only manage applications assigned to you.');
  }

  const decision = String(formData.get('decision')) as RoundDecisionValue | 'CLEAR';

  const previous = await prisma.application.findUniqueOrThrow({
    where: { id: applicationId },
    select: { orgSynopsisStatus: true, round1Decision: true, round2Decision: true, currentRound: true },
  });

  if (round === 2 && previous.round1Decision !== 'YES') {
    throw new ForbiddenError('Round 2 decision can only be set once round 1 is marked yes.');
  }
  if (round === 3 && previous.round2Decision !== 'YES') {
    throw new ForbiddenError('Round 3 decision can only be set once round 2 is marked yes.');
  }

  const value = decision === 'CLEAR' ? null : decision;
  const field = ROUND_DECISION_FIELD[round];

  let nextCurrentRound: CurrentRoundValue | undefined;
  if (value === 'YES') {
    const target = ROUND_TARGET_ON_YES[round];
    if (ROUND_ORDER.indexOf(target) > ROUND_ORDER.indexOf(previous.currentRound as CurrentRoundValue)) {
      nextCurrentRound = target;
    }
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: { [field]: value, ...(nextCurrentRound ? { currentRound: nextCurrentRound } : {}) },
  });

  // the organisation & model synopsis is jury-facing context, so it only needs to exist once an
  // application actually clears the round 1 gate — generate it once here rather than for every
  // application regardless of decision. Guarded on orgSynopsisStatus so toggling the decision
  // back and forth doesn't re-enqueue a job every time; a failed run can still be retried
  // manually from the application page.
  if (round === 1 && value === 'YES' && !previous.orgSynopsisStatus) {
    await enqueueJob('SYNOPSIZE_APPLICATION', applicationId);
  }

  // dashboard KPIs (round-wise counts) and every round-scoped list/analytics page key off these
  // fields, so they'd otherwise go stale until an unrelated revalidation happened.
  revalidatePath('/applications');
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath('/applications/round-2');
  revalidatePath('/applications/round-3');
  revalidatePath('/jury');
  revalidatePath('/dashboard');
}

/** Directly, manually moves an application's "application status" indicator — independent of the
 *  round decision gates above. Unlike the old stage machine there are no transition-legality
 *  rules: an admin can always jump to any of the 4 states. */
export async function setCurrentRoundAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_REVIEW);

  const applicationId = String(formData.get('applicationId'));
  const assignments = await prisma.reviewAssignment.findMany({ where: { applicationId }, select: { reviewerId: true } });
  if (!canManageApplication(user, assignments)) {
    throw new ForbiddenError('You can only manage applications assigned to you.');
  }

  const currentRound = String(formData.get('currentRound')) as CurrentRoundValue;

  await prisma.application.update({ where: { id: applicationId }, data: { currentRound } });

  revalidatePath('/applications');
  revalidatePath(`/applications/${applicationId}`);
  revalidatePath('/applications/round-2');
  revalidatePath('/applications/round-3');
  revalidatePath('/dashboard');
}

/** Purely informational marker, same "everyone sees the same pills, canManage only controls
 *  whether they're clickable" pattern as ConsortiumButton/isConsortium — no effect on stage,
 *  pipeline, or jury visibility. Replaces the old ECOSYSTEM_PARTNER decision value. */
export async function setEcosystemPartnerAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_REVIEW);

  const applicationId = String(formData.get('applicationId'));
  const assignments = await prisma.reviewAssignment.findMany({ where: { applicationId }, select: { reviewerId: true } });
  if (!canManageApplication(user, assignments)) {
    throw new ForbiddenError('You can only manage applications assigned to you.');
  }

  const value = String(formData.get('value')) === 'YES';

  await prisma.application.update({ where: { id: applicationId }, data: { isEcosystemPartner: value } });

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath('/applications');
  revalidatePath('/dashboard');
}

/** Purely informational marker — independent of round1Decision, no effect on stage, pipeline,
 *  or jury visibility. Same admin-or-assigned-reviewer rule as every other mutation on this page. */
export async function setConsortiumAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_REVIEW);

  const applicationId = String(formData.get('applicationId'));
  const assignments = await prisma.reviewAssignment.findMany({ where: { applicationId }, select: { reviewerId: true } });
  if (!canManageApplication(user, assignments)) {
    throw new ForbiddenError('You can only manage applications assigned to you.');
  }

  const value = String(formData.get('value')) === 'YES';

  await prisma.application.update({ where: { id: applicationId }, data: { isConsortium: value } });

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath('/applications');
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

  const application = await prisma.application.findUnique({ where: { id: applicationId }, select: { orgName: true } });
  if (application) {
    await notifyMentionedUsers({ applicationId, orgName: application.orgName, authorId: user.id, authorName: user.name, body });
  }

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
