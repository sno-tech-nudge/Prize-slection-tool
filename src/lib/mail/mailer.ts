export interface OutgoingEmail {
  to: string;
  subject: string;
  body: string; // rendered HTML
}

export interface SendResult {
  status: 'SENT' | 'FAILED';
  sentAt?: Date;
  error?: string;
}

export interface Mailer {
  provider: string;
  send(email: OutgoingEmail): Promise<SendResult>;
}

/** Prototype mailer — never touches the network. The Outbox row itself is the audit trail. */
export class StubMailer implements Mailer {
  provider = 'stub';

  async send(_email: OutgoingEmail): Promise<SendResult> {
    return { status: 'SENT', sentAt: new Date() };
  }
}

/**
 * SWAP POINT — real send path, gated behind EMAIL_PROVIDER=resend. Even when
 * enabled, TEST_EMAIL_OVERRIDE forces every message to one internal inbox so
 * a prototype can never reach a real founder's mailbox by accident.
 */
export class ResendMailer implements Mailer {
  provider = 'resend';

  async send(email: OutgoingEmail): Promise<SendResult> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return { status: 'FAILED', error: 'RESEND_API_KEY not set' };

    const to = process.env.TEST_EMAIL_OVERRIDE || email.to;
    if (!process.env.TEST_EMAIL_OVERRIDE) {
      // eslint-disable-next-line no-console
      console.warn('[ResendMailer] TEST_EMAIL_OVERRIDE is not set — refusing to risk sending to a real founder address.');
      return { status: 'FAILED', error: 'TEST_EMAIL_OVERRIDE required for non-stub sends in this prototype' };
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'the^delta prize <prize@thedelta.dev>',
          to,
          subject: email.subject,
          html: email.body,
        }),
      });
      if (!res.ok) return { status: 'FAILED', error: `Resend API responded ${res.status}` };
      return { status: 'SENT', sentAt: new Date() };
    } catch (err) {
      return { status: 'FAILED', error: err instanceof Error ? err.message : 'unknown error' };
    }
  }
}

/**
 * SWAP POINT — sends via the operator's own Gmail account over SMTP (using an "App Password",
 * not the account password — Google requires this once 2-Step Verification is on). Useful for
 * ad-hoc manual testing without signing up for a transactional email provider. Still respects
 * TEST_EMAIL_OVERRIDE if set, as an extra safety layer, but doesn't require it the way
 * ResendMailer does — the admin already reviews and can edit every email in the outbox before
 * clicking send, which is the human-in-the-loop gate for this path.
 */
// the only account outbound mail is ever allowed to send through — never a teammate's personal
// inbox. Enforced here, at the one choke point every send (individual or bulk) passes through,
// rather than trusting whichever GMAIL_USER happens to be configured in the environment.
const REQUIRED_SENDER = 'applications@thedelta.org.in';

export class GmailSmtpMailer implements Mailer {
  provider = 'gmail';

  async send(email: OutgoingEmail): Promise<SendResult> {
    const user = process.env.GMAIL_USER;
    const appPassword = process.env.GMAIL_APP_PASSWORD;
    if (!user || !appPassword) {
      return { status: 'FAILED', error: 'GMAIL_USER / GMAIL_APP_PASSWORD not set' };
    }
    if (user.toLowerCase() !== REQUIRED_SENDER) {
      return { status: 'FAILED', error: 'mail cannot be sent through a personal ID' };
    }

    const to = process.env.TEST_EMAIL_OVERRIDE || email.to;

    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.default.createTransport({
        service: 'gmail',
        auth: { user, pass: appPassword },
      });
      // an HTML-only message with no plain-text alternative is itself a common spam signal —
      // most legitimate mail (and every major ESP) sends both parts, so this narrows the gap
      // versus more heavily-scrutinized HTML-only sends from a script.
      const info = await transporter.sendMail({
        from: `the^delta prize <${user}>`,
        to,
        subject: email.subject,
        html: email.body,
        text: htmlToPlainText(email.body),
      });
      // sendMail() resolving doesn't guarantee the recipient actually accepted the message — for
      // a single-recipient send it normally throws on an outright rejection, but checking
      // `accepted` explicitly catches any edge case where it resolves without the recipient in
      // that list, instead of reporting SENT on a send that didn't really succeed.
      if (!info.accepted?.some((a) => String(a).toLowerCase().includes(to.toLowerCase()))) {
        return {
          status: 'FAILED',
          error: `recipient not confirmed accepted by SMTP server (response: ${info.response ?? 'no response'})`,
        };
      }
      return { status: 'SENT', sentAt: new Date() };
    } catch (err) {
      return { status: 'FAILED', error: err instanceof Error ? err.message : 'unknown error' };
    }
  }
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|table)>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function getMailer(): Mailer {
  if (process.env.EMAIL_PROVIDER === 'resend') return new ResendMailer();
  if (process.env.EMAIL_PROVIDER === 'gmail') return new GmailSmtpMailer();
  return new StubMailer();
}
