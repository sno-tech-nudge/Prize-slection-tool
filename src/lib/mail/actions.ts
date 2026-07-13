'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_SEND_MAIL } from '@/lib/auth/guard';
import { approveAndSendOutboxEmail } from '@/lib/mail/outbox';
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
