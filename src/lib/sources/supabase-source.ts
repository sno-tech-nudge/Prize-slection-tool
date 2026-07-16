import { prisma } from '@/lib/db';
import { getSupabaseClient } from './supabase-client';
import { seedTransitionPath } from '@/lib/stages/machine';
import { enqueueJob } from '@/lib/jobs/queue';
import { autoAssignReviewer } from '@/lib/applications/assignment';

/**
 * Live rapid re.gen backend — a Supabase Postgres table (`applications`) fed automatically
 * from the team's Zoho Creator form. Read-only anon-key access for now; a proper auth layer
 * is expected before launch (per the team's note), at which point this client setup will need
 * to carry a session token instead of the bare anon key.
 *
 * Field shapes here are loosely typed on purpose — this is externally-owned data from a form
 * builder, so we parse defensively (try several plausible JSONB key names, fall back to raw
 * string dumps) rather than assume a rigid contract that breaks the whole sync on one bad row.
 */
interface SupabaseApplicationRow {
  id: string;
  creator_record_id: string | null;
  challenge: string | null;
  submitted_at: string | null;
  ingested_at: string | null;
  updated_at: string | null;
  current_stage: string | null;
  enrichment: unknown;
  ai_score: number | null;
  ai_score_breakdown: unknown;
  ai_score_rationale: string | null;
  organisation_name: string | null;
  founder_first_name: string | null;
  founder_last_name: string | null;
  designation: string | null;
  email: string | null;
  contact_number: string | null;
  organisation_website: string | null;
  organisation_linkedin: string | null;
  registered_on: string | null;
  legal_registration_type: string | null;
  fcra_registration: string | null;
  certificate_12a: string | null;
  certificate_80g: string | null;
  csr1_registration: string | null;
  niti_darpan_id: string | null;
  darpan_id_number: string | null;
  annual_operating_budget: string | null;
  full_time_employees: string | null;
  operating_model: string[] | null;
  operating_model_description: string | null;
  crops: string[] | null;
  regenerative_practices: string[] | null;
  biggest_hurdle: string | null;
  internal_tools: string[] | null;
  other_tools: string | null;
  tools_developed_internally: string | null;
  years_experience: number | null;
  significant_impacts: string | null;
  operating_states: string[] | null;
  farmers_count: number | null;
  smallholder_farmers_count: number | null;
  avg_land_holding_ha: number | null;
  total_area_regen_ha: number | null;
  villages_districts: string | number | null;
  work_beyond_agriculture: string | null;
  other_development_areas: string | null;
  materials_in_local_languages: string | null;
  team_formal_training: string | null;
  team_training_description: string | null;
  mel_handling: string | null;
  prize_fund_use: string | null;
  heard_about_challenge: string[] | null;
  other_heard_about: string | null;
  info_accurate_confirmed: boolean | null;
  founders: unknown;
  funders: unknown;
  tech_use_cases: unknown;
  reference_links: unknown;
  raw_payload: unknown;
}

/** organisation_website / organisation_linkedin currently arrive wrapped as
 *  `<a href="https://...">label</a>` rather than a bare URL. */
function stripAnchorHref(raw: string | null): string | undefined {
  if (!raw) return undefined;
  const match = raw.match(/href=["']([^"']+)["']/i);
  if (match) return match[1].trim();
  const stripped = raw.replace(/<[^>]+>/g, '').trim();
  return stripped || undefined;
}

function joinArray(raw: string[] | null): string | undefined {
  if (!Array.isArray(raw)) return undefined;
  const cleaned = raw.map((v) => String(v).trim()).filter(Boolean);
  return cleaned.length ? cleaned.join(';') : undefined;
}

/** Zoho free-text yes/no/in-progress answers, normalised to our YES | NO | IN_PROGRESS keys
 *  where recognisable — otherwise the raw value is kept as-is rather than dropped. */
function normalizeYesNo(raw: string | null): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim().toLowerCase();
  if (s === 'yes' || s === 'y') return 'YES';
  if (s === 'no' || s === 'n') return 'NO';
  if (s.includes('progress')) return 'IN_PROGRESS';
  return raw.trim();
}

function boolFromYesNo(raw: string | null): boolean | undefined {
  const norm = normalizeYesNo(raw);
  if (norm === 'YES') return true;
  if (norm === 'NO') return false;
  return undefined;
}

function toDate(raw: string | null): Date | undefined {
  if (!raw) return undefined;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/** villages_districts arrives as either a bare number or free text ("6 villages across 2
 *  districts") depending on how the source form question was answered. */
function toStringLoose(raw: string | number | null | undefined): string | undefined {
  if (raw === null || raw === undefined) return undefined;
  const s = String(raw).trim();
  return s || undefined;
}

function toJsonString(raw: unknown): string | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (typeof raw === 'string') return raw.trim() || undefined;
  try {
    return JSON.stringify(raw);
  } catch {
    return undefined;
  }
}

function firstString(obj: unknown, keys: string[]): string | undefined {
  if (!obj || typeof obj !== 'object') return typeof obj === 'string' ? obj : undefined;
  const rec = obj as Record<string, unknown>;
  for (const k of keys) {
    if (typeof rec[k] === 'string' && rec[k]) return rec[k] as string;
  }
  return undefined;
}

interface ParsedFounder {
  fullName: string;
  role?: string;
  linkedin?: string;
  email?: string;
}

function parseFounders(raw: unknown): ParsedFounder[] {
  if (!Array.isArray(raw)) return [];
  const out: ParsedFounder[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const first = firstString(r, ['first_name', 'firstName']) ?? '';
    const last = firstString(r, ['last_name', 'lastName']) ?? '';
    const fullName = `${first} ${last}`.trim() || firstString(r, ['full_name', 'name']) || '';
    if (!fullName) continue;
    out.push({
      fullName,
      role: firstString(r, ['designation', 'role']),
      linkedin: firstString(r, ['linkedin', 'linkedin_url']),
      email: firstString(r, ['email']),
    });
  }
  return out;
}

interface ParsedFunder {
  name: string;
  fundingNature?: string;
  worksWithGovernment?: boolean;
}

function parseFunders(raw: unknown): ParsedFunder[] {
  if (!Array.isArray(raw)) return [];
  const out: ParsedFunder[] = [];
  for (const item of raw) {
    if (typeof item === 'string') {
      if (item.trim()) out.push({ name: item.trim() });
      continue;
    }
    const name = firstString(item, ['name', 'funder_name', 'organisation', 'funder']);
    if (!name) continue;
    const r = item as Record<string, unknown>;
    out.push({
      name,
      fundingNature: firstString(r, ['funding_nature']),
      worksWithGovernment: boolFromYesNo(typeof r.works_with_government === 'string' ? r.works_with_government : null),
    });
  }
  return out;
}

function parseTechUseCases(raw: unknown): { description: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') return item.trim() ? { description: item.trim() } : null;
      const description = firstString(item, ['description', 'use_case', 'tech_use_case']);
      return description ? { description } : null;
    })
    .filter((f): f is { description: string } => !!f);
}

function parseReportLinks(raw: unknown): { url: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') return item.trim() ? { url: item.trim() } : null;
      const url = firstString(item, ['url', 'link', 'reference_url']);
      return url ? { url } : null;
    })
    .filter((f): f is { url: string } => !!f);
}

export interface SupabaseSyncResult {
  fetched: number;
  created: number;
  updated: number;
  skipped: { id: string; reason: string }[];
}

/** Pulls every row from the live Supabase `applications` table and upserts it into the local
 *  Application table (keyed by externalId = Supabase row id). Safe to re-run — existing rows
 *  are updated in place, their founders/funders/tech-use-cases/report-links replaced wholesale
 *  (the source has no stable child ids, so delete+recreate is the only sane sync strategy). */
export async function syncApplicationsFromSupabase(): Promise<SupabaseSyncResult> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('SUPABASE_URL / SUPABASE_ANON_KEY not set — cannot sync.');
  }

  const { data, error } = await client.from('applications').select('*');
  if (error) throw new Error(`Supabase fetch failed: ${error.message}`);

  const rows = (data ?? []) as SupabaseApplicationRow[];
  const result: SupabaseSyncResult = { fetched: rows.length, created: 0, updated: 0, skipped: [] };

  for (const row of rows) {
    const orgName = row.organisation_name?.trim();
    const email = row.email?.trim();
    if (!orgName || !email) {
      result.skipped.push({ id: row.id, reason: 'missing organisation_name or email' });
      continue;
    }

    const existing = await prisma.application.findUnique({ where: { externalId: row.id } });

    // most ticks see no actual change on the source side — skip the update round-trip entirely
    // when the source's own updated_at hasn't moved since our last sync. This is what keeps
    // repeat syncs fast; without it every tick re-writes every row every time.
    const sourceUpdatedAt = toDate(row.updated_at);
    if (existing && sourceUpdatedAt && existing.sourceUpdatedAt && sourceUpdatedAt.getTime() <= existing.sourceUpdatedAt.getTime()) {
      continue;
    }

    const scalars = {
      orgName,
      pocFirstName: row.founder_first_name?.trim() || 'Unknown',
      pocLastName: row.founder_last_name?.trim() || 'Founder',
      email,
      phone: row.contact_number ?? undefined,
      designation: row.designation ?? undefined,
      website: stripAnchorHref(row.organisation_website),
      linkedinUrl: stripAnchorHref(row.organisation_linkedin),
      incorporationDate: toDate(row.registered_on),
      stageRaw: row.current_stage ?? undefined,
      submittedAt: toDate(row.submitted_at),

      legalRegistrationType: row.legal_registration_type ?? undefined,
      fcraStatus: normalizeYesNo(row.fcra_registration),
      cert12A: normalizeYesNo(row.certificate_12a),
      cert80G: normalizeYesNo(row.certificate_80g),
      csr1Registration: normalizeYesNo(row.csr1_registration),
      darpanRegistered: normalizeYesNo(row.niti_darpan_id),
      darpanIdNumber: row.darpan_id_number ?? undefined,
      annualOperatingBudget: row.annual_operating_budget ?? undefined,
      teamSize: row.full_time_employees ?? undefined,

      operatingModelArchetype: joinArray(row.operating_model),
      operatingModelDescription: row.operating_model_description ?? undefined,
      primaryCrops: joinArray(row.crops),
      regenerativePractices: joinArray(row.regenerative_practices),
      adoptionHurdle: row.biggest_hurdle ?? undefined,

      techTools: joinArray(row.internal_tools),
      otherTools: row.other_tools ?? undefined,
      techToolsInternal: boolFromYesNo(row.tools_developed_internally),

      yearsExperience: row.years_experience ?? undefined,
      verifiedImpacts: row.significant_impacts ?? undefined,
      statesOperating: joinArray(row.operating_states),
      farmersCount: row.farmers_count ?? undefined,
      smallholderFarmersCount: row.smallholder_farmers_count ?? undefined,
      avgLandHolding: row.avg_land_holding_ha ?? undefined,
      areaUnderRegenPractice: row.total_area_regen_ha ?? undefined,
      villagesDistrictsRaw: toStringLoose(row.villages_districts),
      worksBeyondAg: boolFromYesNo(row.work_beyond_agriculture),
      otherDevelopmentAreas: row.other_development_areas ?? undefined,
      materialsInLocalLanguages: boolFromYesNo(row.materials_in_local_languages),
      teamFormalTraining: boolFromYesNo(row.team_formal_training),
      teamTrainingDescription: row.team_training_description ?? undefined,
      melHandling: row.mel_handling ?? undefined,
      fundUsagePlan: row.prize_fund_use ?? undefined,
      heardAboutChallenge: joinArray(row.heard_about_challenge),
      otherHeardAbout: row.other_heard_about ?? undefined,
      infoAccurateConfirmed: row.info_accurate_confirmed ?? undefined,

      creatorRecordId: row.creator_record_id ?? undefined,
      sourceIngestedAt: toDate(row.ingested_at),
      sourceUpdatedAt: toDate(row.updated_at),
      externalEnrichment: toJsonString(row.enrichment),
      externalAiScore: row.ai_score ?? undefined,
      externalAiScoreBreakdown: toJsonString(row.ai_score_breakdown),
      externalAiScoreRationale: row.ai_score_rationale ?? undefined,
      rawSourcePayload: toJsonString(row.raw_payload),

      source: 'SUPABASE',
      externalId: row.id,
    };

    const founders = parseFounders(row.founders);
    const funders = parseFunders(row.funders);
    const techUseCases = parseTechUseCases(row.tech_use_cases);
    const reportLinks = parseReportLinks(row.reference_links);

    if (existing) {
      await prisma.application.update({
        where: { id: existing.id },
        data: {
          ...scalars,
          founders: { deleteMany: {}, create: founders },
          funders: { deleteMany: {}, create: funders },
          techUseCases: { deleteMany: {}, create: techUseCases },
          reportLinks: { deleteMany: {}, create: reportLinks },
        },
      });
      result.updated++;
    } else {
      const created = await prisma.application.create({
        data: {
          ...scalars,
          founders: { create: founders },
          funders: { create: funders },
          techUseCases: { create: techUseCases },
          reportLinks: { create: reportLinks },
        },
      });
      await seedTransitionPath({ applicationId: created.id, path: ['SUBMITTED'], daysAgoStart: 0 });
      await enqueueJob('ENRICH_APPLICATION', created.id);
      await enqueueJob('MATCH_APPLICATION', created.id);
      await enqueueJob('SCORE_APPLICATION', created.id);
      await autoAssignReviewer(created.id);
      result.created++;
    }
  }

  return result;
}
