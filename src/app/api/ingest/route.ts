import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GoogleFormSource } from '@/lib/sources/google-form-source';
import { enqueueJob } from '@/lib/jobs/queue';
import { seedTransitionPath } from '@/lib/stages/machine';

/**
 * SWAP POINT — once the team shares the live Google Form id, point a Google
 * Apps Script `onFormSubmit` trigger here:
 *   POST /api/ingest
 *   header: x-ingest-secret: <GOOGLE_INGEST_SECRET>
 *   body: { ...raw form field values, keyed by question text }
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-ingest-secret');
  if (!process.env.GOOGLE_INGEST_SECRET || secret !== process.env.GOOGLE_INGEST_SECRET) {
    return NextResponse.json({ error: 'invalid or missing x-ingest-secret' }, { status: 401 });
  }

  const raw = await req.json().catch(() => null);
  if (!raw) return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });

  const source = new GoogleFormSource();
  const input = source.toApplication({ sourceRowId: 'webhook', raw });
  if (!input.orgName || !input.email) {
    return NextResponse.json({ error: 'missing organisation name or email in payload' }, { status: 400 });
  }

  const application = await prisma.application.create({
    data: {
      orgName: input.orgName,
      pocFirstName: input.pocFirstName,
      pocLastName: input.pocLastName,
      email: input.email,
      orgType: input.orgType,
      stageNormalized: input.stageNormalized,
      solutionCategory: input.solutionCategory,
      teamSize: input.teamSize,
      source: 'GOOGLE_FORM',
    },
  });

  await seedTransitionPath({ applicationId: application.id, path: ['SUBMITTED'], daysAgoStart: 0 });
  await enqueueJob('ENRICH_APPLICATION', application.id);
  await enqueueJob('MATCH_APPLICATION', application.id);
  await enqueueJob('SCORE_APPLICATION', application.id);

  return NextResponse.json({ ok: true, applicationId: application.id });
}
