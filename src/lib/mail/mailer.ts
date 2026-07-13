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
export class GmailSmtpMailer implements Mailer {
  provider = 'gmail';

  async send(email: OutgoingEmail): Promise<SendResult> {
    const user = process.env.GMAIL_USER;
    const appPassword = process.env.GMAIL_APP_PASSWORD;
    if (!user || !appPassword) {
      return { status: 'FAILED', error: 'GMAIL_USER / GMAIL_APP_PASSWORD not set' };
    }

    const to = process.env.TEST_EMAIL_OVERRIDE || email.to;

    try {
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.default.createTransport({
        service: 'gmail',
        auth: { user, pass: appPassword },
      });
      await transporter.sendMail({
        from: `the^delta prize <${user}>`,
        to,
        subject: email.subject,
        html: email.body,
      });
      return { status: 'SENT', sentAt: new Date() };
    } catch (err) {
      return { status: 'FAILED', error: err instanceof Error ? err.message : 'unknown error' };
    }
  }
}

export function getMailer(): Mailer {
  if (process.env.EMAIL_PROVIDER === 'resend') return new ResendMailer();
  if (process.env.EMAIL_PROVIDER === 'gmail') return new GmailSmtpMailer();
  return new StubMailer();
}
