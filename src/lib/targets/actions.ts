'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_MANAGE_SETTINGS } from '@/lib/auth/guard';
import { prisma } from '@/lib/db';
import { enqueueJobs } from '@/lib/jobs/queue';
import { parseCsv } from '@/lib/csv';

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Header text -> Target schema field, matched by normalized (lowercased, alphanumeric-only)
 *  equality so the importer survives header rewording/whitespace changes in the source sheet
 *  without needing to rely on column position. The sheet also carries an unrelated "Model
 *  Categorization" glossary in trailing columns (what each model tag means, not per-row data) —
 *  deliberately not matched here so it's never mistaken for a target's own data. */
const FIELD_MATCHERS: Record<string, string[]> = {
  name: ['organisation', 'organization', 'name'],
  website: ['website'],
  domain: ['domain'],
  notes: ['notes'],
  connectStatus: ['connectstatus'],
  model: ['model'],
  focusType: ['focusfarmingtype', 'focustype'],
  orgFundingType: ['forprofitnotforprofit', 'orgfundingtype'],
  description: ['description'],
  keyLocations: ['keylocations'],
  currentImpact: ['currentimpactsummary', 'currentimpact'],
  prizeRelevance: ['prizerelevance'],
  clarifications: ['clarifications'],
  pocName: ['pocforlaunchoutreach', 'pocname'],
  pocDesignation: ['pocdesignation'],
  pocEmail: ['pocemailcontact', 'pocemail'],
  founder: ['founder', 'founders'],
  contactNumber: ['contactnumber'],
};

function buildFieldIndex(headerRow: string[]): Record<string, number> {
  const normalized = headerRow.map(normalizeHeader);
  const index: Record<string, number> = {};
  for (const [field, candidates] of Object.entries(FIELD_MATCHERS)) {
    const idx = normalized.findIndex((h) => candidates.includes(h));
    if (idx !== -1) index[field] = idx;
  }
  return index;
}

/** Replaces the target wishlist from an uploaded CSV of the team's full landscape sheet (connect
 *  status, model, focus type, org type, description, locations, impact, prize relevance,
 *  clarifications, PoC name/designation/email, founder, contact number — see prisma/schema.prisma
 *  Target model). Falls back to the simpler name/website/domain/founders/notes shape if the
 *  richer headers aren't present. Re-queues the target matcher afterward so existing applications
 *  re-link to the replaced targets (a target's id changes on re-seed, so old links don't survive
 *  the swap on their own). */
export async function uploadTargetsCsvAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const file = formData.get('file') as File | null;
  if (!file) throw new Error('No file uploaded.');

  const text = await file.text();
  const rows = parseCsv(text).filter((r) => r.some((c) => c.trim().length > 0));
  if (rows.length < 2) throw new Error('CSV has no data rows.');

  const [headerRow, ...dataRows] = rows;
  const fieldIndex = buildFieldIndex(headerRow);
  if (fieldIndex.name === undefined) {
    throw new Error('Could not find an "organisation" / "name" column in the CSV header.');
  }

  const get = (row: string[], field: string): string | null => {
    const idx = fieldIndex[field];
    if (idx === undefined) return null;
    const value = (row[idx] ?? '').trim();
    return value.length > 0 ? value : null;
  };

  await prisma.target.deleteMany();

  let created = 0;
  for (const row of dataRows) {
    const name = get(row, 'name');
    if (!name) continue;
    const pocEmail = get(row, 'pocEmail');
    const founder = get(row, 'founder');
    const domain = get(row, 'domain') ?? (pocEmail?.includes('@') ? pocEmail.split('@')[1].toLowerCase().replace(/^www\./, '') : null);

    await prisma.target.create({
      data: {
        name,
        website: get(row, 'website'),
        domain,
        founders: founder ? JSON.stringify([founder]) : null,
        notes: get(row, 'notes'),
        connectStatus: get(row, 'connectStatus'),
        model: get(row, 'model'),
        focusType: get(row, 'focusType'),
        orgFundingType: get(row, 'orgFundingType'),
        description: get(row, 'description'),
        keyLocations: get(row, 'keyLocations'),
        currentImpact: get(row, 'currentImpact'),
        prizeRelevance: get(row, 'prizeRelevance'),
        clarifications: get(row, 'clarifications'),
        pocName: get(row, 'pocName'),
        pocDesignation: get(row, 'pocDesignation'),
        pocEmail,
        contactNumber: get(row, 'contactNumber'),
      },
    });
    created++;
  }

  const applications = await prisma.application.findMany({ where: { isDuplicateOf: null }, select: { id: true } });
  await enqueueJobs(
    'MATCH_APPLICATION',
    applications.map((a) => a.id),
  );

  revalidatePath('/targets');
  revalidatePath('/dashboard');
  return { created };
}
