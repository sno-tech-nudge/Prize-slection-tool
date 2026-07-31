import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { listOutbox } from '@/lib/mail/queries';

/** Polled directly by OutboxTable, bypassing Next.js's page-level revalidation/router.refresh()
 *  path — that mechanism wasn't reliably showing a freshly sent email in the table in practice,
 *  so the table now fetches its own data over plain JSON instead of depending on the RSC refresh
 *  actually re-rendering the server component tree. Same viewers as the /outreach page itself
 *  (ADMIN can send, REVIEWER can view read-only) — not gated to CAN_SEND_MAIL, since a reviewer
 *  reaching this table at all is expected to see it stay live too. */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'REVIEWER')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 403 });
  }

  const status = request.nextUrl.searchParams.get('status') ?? undefined;
  const emails = await listOutbox(status);

  return NextResponse.json({
    emails: emails.map((e) => ({
      id: e.id,
      orgName: e.application.orgName,
      to: e.to,
      subject: e.subject,
      body: e.body,
      template: e.template,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
      sentAt: e.sentAt ? e.sentAt.toISOString() : null,
      provider: e.provider,
    })),
  });
}
