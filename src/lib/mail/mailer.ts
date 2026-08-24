export interface OutgoingEmail {
  to: string;
  subject: string;
  body: string; // rendered HTML
  cc?: string;
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

/** Prototype mailer — never touches the network. The Outbox row itself is the audit trail.
 *  Only safe to silently "succeed" outside real production (local dev, preview builds) — on the
 *  actual deployed production site this is almost always a misconfiguration (EMAIL_PROVIDER unset
 *  or misspelled), and reporting SENT for a message that never left the process is exactly the
 *  "looks fine, nothing arrives" failure mode this exists to prevent. */
export class StubMailer implements Mailer {
  provider = 'stub';

  async send(_email: OutgoingEmail): Promise<SendResult> {
    if (process.env.VERCEL_ENV === 'production') {
      // eslint-disable-next-line no-console
      console.error('[StubMailer] refusing to fake a send on production — EMAIL_PROVIDER is not set to "gmail" or "resend".');
      return {
        status: 'FAILED',
        error: 'no real email provider is configured (EMAIL_PROVIDER env var) — nothing was sent',
      };
    }
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

    // suppressed under the same override — a test send should never CC a real inbox either.
    const cc = process.env.TEST_EMAIL_OVERRIDE ? undefined : email.cc;

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'the^delta prize <prize@thedelta.dev>',
          to,
          ...(cc ? { cc } : {}),
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
    // suppressed under the same override — a test send should never CC a real inbox either.
    const cc = process.env.TEST_EMAIL_OVERRIDE ? undefined : email.cc;

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
        ...(cc ? { cc } : {}),
        subject: email.subject,
        html: email.body,
        text: htmlToPlainText(email.body),
      });
      // sendMail() resolving doesn't guarantee the recipient actually accepted the message — for
      // a single-recipient send it normally throws on an outright rejection, but checking
      // `accepted` explicitly catches any edge case where it resolves without the recipient in
      // that list, instead of reporting SENT on a send that didn't really succeed.
      const wasAccepted = info.accepted?.some((a) => String(a).toLowerCase().includes(to.toLowerCase()));
      // logged unconditionally (success and failure) so `vercel logs` actually shows what
      // happened on every send attempt instead of only surfacing errors that throw — this is the
      // one place to check first if something shows "sent" in the UI but never arrives.
      // eslint-disable-next-line no-console
      console.log(
        `[GmailSmtpMailer] to=${to} accepted=${wasAccepted} messageId=${info.messageId ?? 'n/a'} response=${info.response ?? 'n/a'}`,
      );
      if (!wasAccepted) {
        return {
          status: 'FAILED',
          error: `recipient not confirmed accepted by SMTP server (response: ${info.response ?? 'no response'})`,
        };
      }
      return { status: 'SENT', sentAt: new Date() };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      // eslint-disable-next-line no-console
      console.error(`[GmailSmtpMailer] send to=${to} threw: ${message}`);
      return { status: 'FAILED', error: message };
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
  // trimmed/lowercased so a stray space or "Gmail" typed into the Vercel dashboard doesn't
  // silently fall through to the stub mailer — that exact mismatch is indistinguishable from a
  // real send in the UI (both report a status), so it's worth guarding against here directly.
  const provider = (process.env.EMAIL_PROVIDER ?? '').trim().toLowerCase();
  if (provider === 'resend') return new ResendMailer();
  if (provider === 'gmail') return new GmailSmtpMailer();
  return new StubMailer();
}
