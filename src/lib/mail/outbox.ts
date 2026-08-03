import { prisma } from '@/lib/db';
import { getMailer } from './mailer';
import { renderStageEmail, renderCustomTemplate, type StageEmailTemplate } from './templates';
import { getSettings } from '@/lib/settings';

const CHALLENGE_NAME = process.env.CHALLENGE_NAME || 'the^delta prize · rapid re.gen challenge';

// falls back to this if the admin hasn't set a form link in Settings yet (or the settings row
// predates this default) — keeps the query outreach template working correctly out of the box.
const DEFAULT_TALLY_FORM_LINK = 'https://tally.so/r/q4XYpk';

/** Appends this specific application's rec_id (the Zoho creator_record_id, shown on the
 *  application page) as a query param on the additional-information form link, so a Tally
 *  hidden field can capture it and the webhook that ingests the response can match it straight
 *  back to this application — no manual matching required on either side. */
function buildFormLink(baseUrl: string, recId: string | null): string {
  const base = baseUrl || DEFAULT_TALLY_FORM_LINK;
  if (!recId) return base;
  try {
    const url = new URL(base);
    url.searchParams.set('rec_id', recId);
    return url.toString();
  } catch {
    return base;
  }
}

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

export type CustomOutreachKind = 'acceptance' | 'rejection' | 'query';

function customTemplateFor(kind: CustomOutreachKind, settings: Awaited<ReturnType<typeof getSettings>>) {
  if (kind === 'acceptance') return settings.emailTemplateAcceptance;
  if (kind === 'rejection') return settings.emailTemplateRejection;
  return settings.emailTemplateQuery;
}

function outboxTemplateFor(kind: CustomOutreachKind): string {
  if (kind === 'acceptance') return 'bulk_acceptance';
  if (kind === 'rejection') return 'bulk_rejection';
  return 'bulk_query';
}

/** Renders what enqueueCustomOutreachEmail would produce, without persisting anything — lets an
 *  admin see the exact subject/body for one application before deciding to queue or send it. */
export async function previewCustomOutreachEmail(applicationId: string, kind: CustomOutreachKind) {
  const app = await prisma.application.findUniqueOrThrow({ where: { id: applicationId } });
  const settings = await getSettings();
  const template = customTemplateFor(kind, settings);
  return renderCustomTemplate(template, {
    pocFirstName: app.pocFirstName,
    orgName: app.orgName,
    challengeName: CHALLENGE_NAME,
    formLink: kind === 'query' ? buildFormLink(settings.emailTemplateQuery.formLink, app.creatorRecordId) : undefined,
  });
}

/** Queues an outreach email from the admin-customised acceptance/rejection/query templates (see
 *  Settings). Always lands as QUEUED — bulk outreach never auto-approves or sends, it only adds
 *  to the same review queue every other outbox email goes through. */
export async function enqueueCustomOutreachEmail(applicationId: string, kind: CustomOutreachKind) {
  const app = await prisma.application.findUniqueOrThrow({ where: { id: applicationId } });
  const { subject, body } = await previewCustomOutreachEmail(applicationId, kind);

  return prisma.outboxEmail.create({
    data: {
      applicationId,
      to: app.email,
      subject,
      body,
      template: outboxTemplateFor(kind),
      status: 'QUEUED',
      provider: getMailer().provider,
    },
  });
}

/** Returns the updated outbox row plus the mailer's error message (if any) — the error itself
 *  isn't a stored column, just surfaced transiently so the UI can show why a send failed (e.g.
 *  the personal-inbox guardrail in GmailSmtpMailer) instead of a bare "failed". */
export async function approveAndSendOutboxEmail(outboxId: string) {
  const mailer = getMailer();
  await prisma.outboxEmail.update({ where: { id: outboxId }, data: { status: 'APPROVED', approvedAt: new Date() } });
  const email = await prisma.outboxEmail.findUniqueOrThrow({ where: { id: outboxId } });
  const result = await mailer.send({ to: email.to, subject: email.subject, body: email.body });
  const updated = await prisma.outboxEmail.update({
    where: { id: outboxId },
    // record the provider actually used for THIS send attempt, not just whatever was configured
    // back when the row was queued — the outbox table shows this so "stub" on a row that's
    // supposed to be a real send is immediately visible instead of hidden in server logs.
    data: { status: result.status, sentAt: result.sentAt, provider: mailer.provider },
  });
  return { ...updated, error: result.error };
}
