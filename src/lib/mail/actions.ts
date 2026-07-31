'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_SEND_MAIL, CAN_MANAGE_SETTINGS } from '@/lib/auth/guard';
import { approveAndSendOutboxEmail, enqueueCustomOutreachEmail, previewCustomOutreachEmail, type CustomOutreachKind } from '@/lib/mail/outbox';
import { getSettings, updateSettings } from '@/lib/settings';
import { prisma } from '@/lib/db';

export async function approveAndSendAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_SEND_MAIL);

  const outboxId = String(formData.get('outboxId'));
  const email = await approveAndSendOutboxEmail(outboxId);

  revalidatePath('/outreach');
  return { status: email.status, error: email.error };
}

/** Approves and sends every selected queued email in one action. Silently skips any id that
 *  isn't still QUEUED (e.g. sent by someone else since the page loaded) rather than erroring
 *  the whole batch. Reports how many of the attempted sends actually went out vs failed, so the
 *  UI can show an accurate result instead of just "done". */
export async function bulkApproveAndSendAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_SEND_MAIL);

  const outboxIds = formData.getAll('outboxId').map(String);
  const rows = await prisma.outboxEmail.findMany({ where: { id: { in: outboxIds } } });
  const queuedIds = rows.filter((r) => r.status === 'QUEUED').map((r) => r.id);

  let sent = 0;
  let failed = 0;
  const errors = new Set<string>();
  for (const id of queuedIds) {
    const result = await approveAndSendOutboxEmail(id);
    if (result.status === 'SENT') sent++;
    else {
      failed++;
      if (result.error) errors.add(result.error);
    }
  }

  revalidatePath('/outreach');
  return { sent, failed, errors: [...errors] };
}

/** Lets an admin hand-edit a queued email's recipient, subject and body before approving it —
 *  only permitted while still QUEUED, so a sent email's record can never be silently rewritten. */
export async function updateOutboxEmailAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_SEND_MAIL);

  const outboxId = String(formData.get('outboxId'));
  const to = String(formData.get('to') ?? '').trim();
  const subject = String(formData.get('subject') ?? '').trim();
  const body = String(formData.get('body') ?? '');

  const existing = await prisma.outboxEmail.findUniqueOrThrow({ where: { id: outboxId } });
  if (existing.status !== 'QUEUED') {
    throw new Error(`Cannot edit an email that is already ${existing.status.toLowerCase()}.`);
  }

  await prisma.outboxEmail.update({
    where: { id: outboxId },
    data: { to: to || existing.to, subject: subject || existing.subject, body: body || existing.body },
  });

  revalidatePath('/outreach');
}

function parseKind(formData: FormData): CustomOutreachKind {
  const raw = formData.get('kind');
  if (raw === 'acceptance' || raw === 'query') return raw;
  return 'rejection';
}

function outboxTemplateName(kind: CustomOutreachKind): string {
  if (kind === 'acceptance') return 'bulk_acceptance';
  if (kind === 'query') return 'bulk_query';
  return 'bulk_rejection';
}

/** Sends an acceptance, rejection, or query email (from the customisable templates) to every
 *  selected application immediately — the confirm dialog on the button is the human-approval
 *  gate, so once confirmed there is no separate queue-then-approve step to go find and click
 *  again. Skips an application that already has a matching bulk email on file (queued, sent, or
 *  failed), so re-selecting the same rows twice doesn't pile up duplicates or re-send. */
export async function bulkSendOutreachAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_SEND_MAIL);

  const applicationIds = formData.getAll('applicationId').map(String);
  const kind = parseKind(formData);
  const template = outboxTemplateName(kind);

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const errors = new Set<string>();

  for (const applicationId of applicationIds) {
    const existing = await prisma.outboxEmail.findFirst({ where: { applicationId, template } });
    if (existing) {
      skipped++;
      continue;
    }
    const email = await enqueueCustomOutreachEmail(applicationId, kind);
    const result = await approveAndSendOutboxEmail(email.id);
    if (result.status === 'SENT') sent++;
    else {
      failed++;
      if (result.error) errors.add(result.error);
    }
  }

  revalidatePath('/outreach');
  return { sent, failed, skipped, errors: [...errors] };
}

/** Renders the acceptance/rejection/query template for a single application without queuing or
 *  sending anything — lets an admin see exactly what would go out before committing to it. */
export async function previewOutreachEmailAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_SEND_MAIL);

  const applicationId = String(formData.get('applicationId'));
  const kind = parseKind(formData);
  return previewCustomOutreachEmail(applicationId, kind);
}

/** One-click send for a single application, directly from the applications table — queues the
 *  email if one doesn't exist yet for this application+template, then always actually attempts a
 *  fresh send. The confirm dialog in front of this action is the deliberate-intent gate, not the
 *  row's stored status — a repeat click (retry, or genuinely re-sending) must really re-attempt
 *  delivery, not silently re-report whatever status happened to be stored from a previous
 *  attempt. Previously this only sent when the existing row was still QUEUED, so once a row was
 *  marked SENT (even from a much earlier attempt), every later click just echoed that stale
 *  status back as if it had just succeeded, without ever touching the network again. */
export async function sendIndividualOutreachAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_SEND_MAIL);

  const applicationId = String(formData.get('applicationId'));
  const kind = parseKind(formData);
  const template = outboxTemplateName(kind);

  let email = await prisma.outboxEmail.findFirst({ where: { applicationId, template } });
  if (!email) {
    email = await enqueueCustomOutreachEmail(applicationId, kind);
  }

  const result = await approveAndSendOutboxEmail(email.id);

  revalidatePath('/outreach');
  return { status: result.status, error: result.error };
}

/** Saves the admin-editable acceptance/rejection/query email templates used by bulk outreach.
 *  The query template also carries a form link, saved alongside subject/body only for that kind. */
export async function updateEmailTemplateAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const kind = parseKind(formData);
  const subject = String(formData.get('subject') ?? '').trim();
  const body = String(formData.get('body') ?? '');
  const formLink = String(formData.get('formLink') ?? '').trim();

  const settings = await getSettings();
  if (kind === 'acceptance') {
    await updateSettings({ emailTemplateAcceptance: { subject: subject || settings.emailTemplateAcceptance.subject, body } });
  } else if (kind === 'query') {
    await updateSettings({
      emailTemplateQuery: { subject: subject || settings.emailTemplateQuery.subject, body, formLink },
    });
  } else {
    await updateSettings({ emailTemplateRejection: { subject: subject || settings.emailTemplateRejection.subject, body } });
  }

  revalidatePath('/outreach');
}
