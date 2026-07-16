'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_SEND_MAIL, CAN_MANAGE_SETTINGS } from '@/lib/auth/guard';
import { approveAndSendOutboxEmail, enqueueCustomOutreachEmail } from '@/lib/mail/outbox';
import { getSettings, updateSettings } from '@/lib/settings';
import { prisma } from '@/lib/db';

export async function approveAndSendAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_SEND_MAIL);

  const outboxId = String(formData.get('outboxId'));
  await approveAndSendOutboxEmail(outboxId);

  revalidatePath('/outreach');
}

/** Approves and sends every selected queued email in one action. Silently skips any id that
 *  isn't still QUEUED (e.g. sent by someone else since the page loaded) rather than erroring
 *  the whole batch. */
export async function bulkApproveAndSendAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_SEND_MAIL);

  const outboxIds = formData.getAll('outboxId').map(String);
  const rows = await prisma.outboxEmail.findMany({ where: { id: { in: outboxIds } } });
  const queuedIds = rows.filter((r) => r.status === 'QUEUED').map((r) => r.id);

  for (const id of queuedIds) {
    await approveAndSendOutboxEmail(id);
  }

  revalidatePath('/outreach');
  return { sent: queuedIds.length };
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

/** Queues an acceptance or rejection email (from the customisable templates) for every selected
 *  application — always as QUEUED, never sent. Skips an application that already has a
 *  bulk_acceptance/bulk_rejection email queued or sent, so re-selecting the same rows twice
 *  doesn't pile up duplicates. Actually sending still requires the separate approve step below,
 *  same as every other outbox email. */
export async function bulkQueueOutreachAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_SEND_MAIL);

  const applicationIds = formData.getAll('applicationId').map(String);
  const kind = formData.get('kind') === 'acceptance' ? 'acceptance' : 'rejection';
  const template = kind === 'acceptance' ? 'bulk_acceptance' : 'bulk_rejection';

  let queued = 0;
  for (const applicationId of applicationIds) {
    const existing = await prisma.outboxEmail.findFirst({ where: { applicationId, template } });
    if (existing) continue;
    await enqueueCustomOutreachEmail(applicationId, kind);
    queued++;
  }

  revalidatePath('/outreach');
  return { queued };
}

/** Saves the admin-editable acceptance/rejection email templates used by bulk outreach. */
export async function updateEmailTemplateAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const kind = formData.get('kind') === 'acceptance' ? 'acceptance' : 'rejection';
  const subject = String(formData.get('subject') ?? '').trim();
  const body = String(formData.get('body') ?? '');

  const settings = await getSettings();
  await updateSettings({
    ...(kind === 'acceptance'
      ? { emailTemplateAcceptance: { subject: subject || settings.emailTemplateAcceptance.subject, body } }
      : { emailTemplateRejection: { subject: subject || settings.emailTemplateRejection.subject, body } }),
  });

  revalidatePath('/outreach');
}
