import { prisma } from '@/lib/db';
import { getMailer } from './mailer';
import { renderStageEmail, type StageEmailTemplate } from './templates';

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
