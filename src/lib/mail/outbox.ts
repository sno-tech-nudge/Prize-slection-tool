import { prisma } from '@/lib/db';
import { getMailer } from './mailer';
import { renderStageEmail, renderCustomTemplate, type StageEmailTemplate } from './templates';
import { getSettings } from '@/lib/settings';

const CHALLENGE_NAME = process.env.CHALLENGE_NAME || 'the^delta prize · rapid re.gen challenge';

/** Queues any stage-transition email — rejection or confirmation (shortlisted/finalist/winner). */
export async function enqueueStageEmail(applicationId: string, template: StageEmailTemplate, personalNote?: string) {
  const app = await prisma.application.findUniqueOrThrow({ where: { id: applicationId } });
  const { subject, body } = renderStageEmail(template, {
    pocFirstName: app.pocFirstName,
    orgName: app.orgName,
    challengeName: CHALLENGE_NAME,
    personalNote,
  });

  return prisma.outboxEmail.create({
    data: {
      applicationId,
      to: app.email,
      subject,
      body,
      template,
      status: 'QUEUED',
      provider: getMailer().provider,
    },
  });
}

/** @deprecated use enqueueStageEmail — kept so existing call sites keep working */
export const enqueueRejectionEmail = enqueueStageEmail;

/** Queues an outreach email from the admin-customised acceptance/rejection templates (see
 *  Settings). Always lands as QUEUED — bulk outreach never auto-approves or sends, it only adds
 *  to the same review queue every other outbox email goes through. */
export async function enqueueCustomOutreachEmail(applicationId: string, kind: 'acceptance' | 'rejection') {
  const app = await prisma.application.findUniqueOrThrow({ where: { id: applicationId } });
  const settings = await getSettings();
  const template = kind === 'acceptance' ? settings.emailTemplateAcceptance : settings.emailTemplateRejection;
  const { subject, body } = renderCustomTemplate(template, {
    pocFirstName: app.pocFirstName,
    orgName: app.orgName,
    challengeName: CHALLENGE_NAME,
  });

  return prisma.outboxEmail.create({
    data: {
      applicationId,
      to: app.email,
      subject,
      body,
      template: kind === 'acceptance' ? 'bulk_acceptance' : 'bulk_rejection',
      status: 'QUEUED',
      provider: getMailer().provider,
    },
  });
}

export async function approveAndSendOutboxEmail(outboxId: string) {
  const mailer = getMailer();
  await prisma.outboxEmail.update({ where: { id: outboxId }, data: { status: 'APPROVED', approvedAt: new Date() } });
  const email = await prisma.outboxEmail.findUniqueOrThrow({ where: { id: outboxId } });
  const result = await mailer.send({ to: email.to, subject: email.subject, body: email.body });
  return prisma.outboxEmail.update({
    where: { id: outboxId },
    data: { status: result.status, sentAt: result.sentAt },
  });
}
