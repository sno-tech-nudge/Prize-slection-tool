import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';

/**
 * Tally.so webhook target for the "additional information" follow-up form. Configure the form's
 * webhook (Tally → form settings → Integrations → Webhooks) to POST here, with a `rec_id` hidden
 * field on the form populated from the `?rec_id=...` query param already appended to every query
 * outreach email link (see buildFormLink in src/lib/mail/outbox.ts).
 *
 *   POST /api/tally/webhook?secret=<TALLY_WEBHOOK_SECRET>
 *   body: Tally's standard FORM_RESPONSE payload — { data: { fields: [{ key, label, value }, ...] } }
 *
 * A query-param secret (rather than a custom header) because Tally's webhook UI only asks for a
 * plain target URL, not custom headers — this is the same idea as GOOGLE_INGEST_SECRET's
 * shared-secret check on /api/ingest, just carried in the URL instead.
 */

interface TallyField {
  key: string;
  label?: string;
  type?: string;
  value: unknown;
}

function fieldValueToText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map((v) => String(v)).join(', ');
  return String(value);
}

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (!process.env.TALLY_WEBHOOK_SECRET || secret !== process.env.TALLY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'invalid or missing secret' }, { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const fields: TallyField[] = payload?.data?.fields ?? [];
  if (!Array.isArray(fields) || fields.length === 0) {
    return NextResponse.json({ error: 'no fields in payload' }, { status: 400 });
  }

  const recIdField = fields.find((f) => f.key === 'rec_id' || f.label?.trim().toLowerCase() === 'rec_id');
  const recId = recIdField ? fieldValueToText(recIdField.value).trim() : '';
  if (!recId) {
    return NextResponse.json({ error: 'no rec_id hidden field found in submission' }, { status: 400 });
  }

  const application = await prisma.application.findFirst({ where: { creatorRecordId: recId } });
  if (!application) {
    return NextResponse.json({ error: `no application found for rec_id ${recId}` }, { status: 404 });
  }

  // every other field (i.e. not the rec_id hidden field itself) becomes the readable
  // "additional information" text — labelled so it stays legible without needing to know the
  // Tally form's exact field layout up front, and stays correct if fields are added/reordered.
  const additionalInfo = fields
    .filter((f) => f !== recIdField)
    .map((f) => `${f.label ?? f.key}: ${fieldValueToText(f.value)}`)
    .filter((line) => line.trim().length > 0)
    .join('\n\n');

  await prisma.application.update({
    where: { id: application.id },
    data: { additionalInfo: additionalInfo || null, additionalInfoAt: new Date() },
  });

  revalidatePath(`/applications/${application.id}`);
  revalidatePath('/applications');

  return NextResponse.json({ ok: true, applicationId: application.id });
}
