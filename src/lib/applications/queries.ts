import type { Prisma, User } from '@prisma/client';
import { prisma } from '@/lib/db';
import { visibleApplicationWhere } from '@/lib/auth/guard';
import { evaluateEligibility } from '@/lib/scoring/eligibility';
import { REVIEWED_WHERE, NOT_REVIEWED_WHERE } from '@/lib/applications/reviewStatus';

export interface ApplicationListFilters {
  reviewed?: string;
  category?: string;
  q?: string;
  internal?: string;
  registrationType?: string;
  operatingModel?: string;
  state?: string;
  eligible?: string;
  assignedToMe?: string;
  reviewer?: string;
  /** 'score_desc' | 'score_asc' — applied client-side by the caller after fetching (score is a
   *  computed average across HumanReview rows, not a plain column Prisma can order by), not part
   *  of buildApplicationWhere. Left out of the WHERE clause entirely; kept here just so callers
   *  passing the whole searchParams object through don't need a separate narrower type. */
  sort?: string;
  // route searchParams objects carry other page-specific keys too (e.g. "stage") that this
  // filter set doesn't act on — an index signature lets callers pass the whole searchParams
  // object through without a separate narrower type at each call site.
  [key: string]: string | undefined;
}

/** Shared between listApplications and getAdjacentApplications so "next"/"previous" on an
 *  application detail page walks the exact same filtered, ordered set the user was browsing —
 *  including "assigned to me", which any role can opt into (not just the REVIEWER-locked view). */
function buildApplicationWhere(filters: ApplicationListFilters, user: User | null): Prisma.ApplicationWhereInput {
  const where: Prisma.ApplicationWhereInput = { ...visibleApplicationWhere(user), isDuplicateOf: null };
  if (filters.q) where.orgName = { contains: filters.q, mode: 'insensitive' };
  if (filters.internal === 'YES' || filters.internal === 'NO' || filters.internal === 'ECOSYSTEM_PARTNER') where.internalDecision = filters.internal;
  if (filters.internal === 'UNDECIDED') where.internalDecision = null;
  if (filters.assignedToMe === '1' && user) where.reviewAssignments = { some: { reviewerId: user.id } };

  // multi-select filters — each URL param is a comma-separated list of values; a row matches if
  // it matches ANY selected value within that filter (OR), combined with an AND across the
  // different filter types (each becomes its own entry in this AND-of-ORs list).
  const andGroups: Prisma.ApplicationWhereInput[] = [];

  // "reviewed" is a real submitted review AND not currently sent back to "under review" — see
  // reviewStatus.ts, same definition used by the dashboard KPI/funnel and the CSV export.
  if (filters.reviewed === 'YES') Object.assign(where, REVIEWED_WHERE);
  if (filters.reviewed === 'NO') andGroups.push(NOT_REVIEWED_WHERE);

  const categories = splitCsv(filters.category);
  if (categories.length) where.solutionCategory = { in: categories };

  const registrationTypes = splitCsv(filters.registrationType);
  if (registrationTypes.length) where.legalRegistrationType = { in: registrationTypes };

  const operatingModels = splitCsv(filters.operatingModel);
  if (operatingModels.length) andGroups.push({ OR: operatingModels.map((m) => ({ operatingModelArchetype: { contains: m } })) });

  const states = splitCsv(filters.state);
  if (states.length) andGroups.push({ OR: states.map((s) => ({ statesOperating: { contains: s } })) });

  // kept as its own AND entry rather than assigned directly onto `where.reviewAssignments` so it
  // composes correctly alongside "assigned to me" if both ever end up set at once, instead of one
  // silently overwriting the other.
  if (filters.reviewer) andGroups.push({ reviewAssignments: { some: { reviewerId: filters.reviewer } } });

  if (andGroups.length) where.AND = andGroups;

  return where;
}

const BASE_INCLUDE = {
  humanReviews: true,
  targetMatch: true,
  reviewAssignments: { include: { reviewer: true } },
  founders: true,
} satisfies Prisma.ApplicationInclude;

// `comments` (+author) and `aiEvaluations` are only rendered by the CSV export columns, never
// by the applications table itself — fetching them on every table page load was dead weight
// (two extra relation round trips against a remote pooler, on the app's hottest read path).
const EXPORT_INCLUDE = {
  ...BASE_INCLUDE,
  aiEvaluations: { orderBy: { createdAt: 'desc' as const }, take: 1 },
  comments: { include: { author: true }, orderBy: { createdAt: 'asc' as const } },
  funders: true,
  techUseCases: true,
  reportLinks: true,
  bench: true,
} satisfies Prisma.ApplicationInclude;

export type ApplicationExportRow = Prisma.ApplicationGetPayload<{ include: typeof EXPORT_INCLUDE }>;

export function applicationListInclude(withExportFields: true): typeof EXPORT_INCLUDE;
export function applicationListInclude(withExportFields?: false): typeof BASE_INCLUDE;
export function applicationListInclude(withExportFields?: boolean) {
  return withExportFields ? EXPORT_INCLUDE : BASE_INCLUDE;
}

export async function listApplications(
  filters: ApplicationListFilters,
  user: User | null,
  withExportFields: true,
): Promise<Prisma.ApplicationGetPayload<{ include: typeof EXPORT_INCLUDE }>[]>;
export async function listApplications(
  filters: ApplicationListFilters,
  user: User | null,
  withExportFields?: false,
): Promise<Prisma.ApplicationGetPayload<{ include: typeof BASE_INCLUDE }>[]>;
export async function listApplications(filters: ApplicationListFilters, user: User | null, withExportFields?: boolean) {
  const where = buildApplicationWhere(filters, user);

  // relationLoadStrategy: 'join' collapses the include's relations into one query via SQL LATERAL
  // joins instead of Prisma's default one-round-trip-per-relation strategy — on this remote
  // Supabase pooler each round trip carries ~150-600ms of fixed latency regardless of row count,
  // so this cuts a ~1.6s query (5+ round trips) down to a single one.
  const apps = await prisma.application.findMany({
    where,
    orderBy: { submittedAt: 'desc' },
    include: withExportFields ? EXPORT_INCLUDE : BASE_INCLUDE,
    relationLoadStrategy: 'join',
  });

  // eligibility is derived (legal type + certifications), not a stored column, so it's filtered
  // in-memory rather than pushed into the Prisma where clause — keeps evaluateEligibility as the
  // single source of truth instead of duplicating its rules as a second query filter.
  if (filters.eligible === 'YES') return apps.filter((a) => evaluateEligibility(a).eligible);
  if (filters.eligible === 'NO') return apps.filter((a) => !evaluateEligibility(a).eligible);
  return apps;
}

function splitCsv(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Registration type, operating model and state values are free text keyed off the real Zoho
 *  form, not the fixed enums in constants.ts — so filter dropdowns are built from whatever
 *  distinct values actually exist in the data, not from the enum list. `reviewers` is everyone
 *  who could plausibly be assigned to review something (ADMIN or REVIEWER role), for the
 *  admin-only "filter by reviewer" control — cheap to always fetch, the caller decides whether to
 *  actually render it. */
export async function getApplicationFilterOptions() {
  const [apps, reviewers] = await Promise.all([
    prisma.application.findMany({
      where: { isDuplicateOf: null },
      select: { legalRegistrationType: true, operatingModelArchetype: true, statesOperating: true },
    }),
    prisma.user.findMany({ where: { role: { in: ['ADMIN', 'REVIEWER'] } }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);

  const registrationTypes = new Set<string>();
  const operatingModels = new Set<string>();
  const states = new Set<string>();

  for (const app of apps) {
    if (app.legalRegistrationType) registrationTypes.add(app.legalRegistrationType);
    (app.operatingModelArchetype ?? '').split(';').filter(Boolean).forEach((v) => operatingModels.add(v));
    (app.statesOperating ?? '').split(';').filter(Boolean).forEach((v) => states.add(v));
  }

  return {
    registrationTypes: [...registrationTypes].sort(),
    operatingModels: [...operatingModels].sort(),
    states: [...states].sort(),
    reviewers,
  };
}

/** All applications for the outreach tab — filterable by internal decision, with each
 *  application's outbox email history so the table can show what's already queued/sent. */
export async function listApplicationsForOutreach(internalDecision?: string) {
  const where: Prisma.ApplicationWhereInput = { isDuplicateOf: null };
  if (internalDecision === 'YES' || internalDecision === 'NO' || internalDecision === 'ECOSYSTEM_PARTNER') where.internalDecision = internalDecision;
  if (internalDecision === 'UNDECIDED') where.internalDecision = null;

  return prisma.application.findMany({
    where,
    orderBy: { submittedAt: 'desc' },
    include: { outboxEmails: { orderBy: { createdAt: 'desc' as const } } },
  });
}

export async function listReviewQueue(user: User | null) {
  if (!user) return [];
  const where: Prisma.ApplicationWhereInput =
    user.role === 'ADMIN'
      ? { isDuplicateOf: null, reviewAssignments: { some: {} } }
      : { isDuplicateOf: null, reviewAssignments: { some: { reviewerId: user.id } } };

  const apps = await prisma.application.findMany({
    where,
    orderBy: { submittedAt: 'desc' },
    include: {
      humanReviews: { include: { reviewer: true } },
      reviewAssignments: { include: { reviewer: true } },
      aiEvaluations: { orderBy: { createdAt: 'desc' as const }, take: 1 },
    },
  });

  // surface "not yet reviewed by me" first
  return apps.sort((a, b) => {
    const aReviewed = a.humanReviews.some((r) => r.reviewerId === user.id);
    const bReviewed = b.humanReviews.some((r) => r.reviewerId === user.id);
    return Number(aReviewed) - Number(bReviewed);
  });
}

export async function listJuryQueue() {
  return prisma.application.findMany({
    where: { isDuplicateOf: null, internalDecision: 'YES' },
    orderBy: [{ stageStatus: 'asc' }, { orgName: 'asc' }],
    include: {
      aiEvaluations: { orderBy: { createdAt: 'desc' as const }, take: 1 },
      juryScores: true,
    },
  });
}

/** Trimmed list for the jury applications table — scoped to the viewer's own bench via
 *  visibleApplicationWhere, with just enough included (the juror's own score) to render the few
 *  columns jury are meant to see (organisation, state, operating model, registration type, their
 *  own score — no bench name, no AI/int score). Accepts the same small filter set (name/state/
 *  operating model) as the internal jury oversight list. */
export async function listJuryApplications(
  user: User | null,
  filters: { q?: string; state?: string; operatingModel?: string; scored?: string } = {},
) {
  const where: Prisma.ApplicationWhereInput = { ...visibleApplicationWhere(user), isDuplicateOf: null };
  if (filters.q) where.orgName = { contains: filters.q, mode: 'insensitive' };
  if (filters.state) where.statesOperating = { contains: filters.state };
  if (filters.operatingModel) where.operatingModelArchetype = { contains: filters.operatingModel };
  if (filters.scored === 'YES' && user) where.juryScores = { some: { jurorId: user.id } };
  if (filters.scored === 'NO' && user) where.juryScores = { none: { jurorId: user.id } };

  const apps = await prisma.application.findMany({
    where,
    orderBy: { orgName: 'asc' },
    include: {
      juryScores: user ? { where: { jurorId: user.id } } : false,
    },
  });

  // bench-wide verdict tally for the majority-vote status column — every juror's verdict on this
  // application's bench, not just this juror's own (unlike the scoped juryScores above, which
  // stays "my own score only" for the actual score display). Counts only, no identities, so the
  // aggregate signal doesn't reveal who specifically voted which way.
  const appIds = apps.map((a) => a.id);
  const allVerdicts = appIds.length
    ? await prisma.juryScore.findMany({ where: { applicationId: { in: appIds } }, select: { applicationId: true, verdict: true } })
    : [];
  const verdictsByApp = new Map<string, string[]>();
  for (const v of allVerdicts) {
    const list = verdictsByApp.get(v.applicationId) ?? [];
    list.push(v.verdict);
    verdictsByApp.set(v.applicationId, list);
  }

  return apps.map((a) => ({ ...a, benchVerdicts: verdictsByApp.get(a.id) ?? [] }));
}

/** Prev/next neighbours of an application in the same order as the applications list (most
 *  recently submitted first), respecting the viewer's role-based visibility — a reviewer
 *  stepping through their assigned applications never lands on one they can't see. */
/** filters is optional so callers that don't have a filter context (e.g. the jury queue) keep
 *  the old "everything visible to this user" behaviour; the applications table always passes its
 *  current filters through so "next"/"previous" stays inside whatever view the user came from. */
export async function getAdjacentApplications(id: string, user: User | null, filters: ApplicationListFilters = {}) {
  const where = buildApplicationWhere(filters, user);
  let apps = await prisma.application.findMany({
    where,
    orderBy: { submittedAt: 'desc' },
    select: {
      id: true,
      legalRegistrationType: true,
      cert12A: true,
      cert80G: true,
      csr1Registration: true,
      darpanRegistered: true,
      orgName: true,
      pocFirstName: true,
      pocLastName: true,
      designation: true,
      phone: true,
      email: true,
      website: true,
      linkedinUrl: true,
      founders: { select: { fullName: true, email: true, linkedin: true } },
    },
  });

  if (filters.eligible === 'YES') apps = apps.filter((a) => evaluateEligibility(a).eligible);
  if (filters.eligible === 'NO') apps = apps.filter((a) => !evaluateEligibility(a).eligible);

  const ids = apps.map((a) => a.id);
  const index = ids.indexOf(id);
  if (index === -1) return { prevId: null, nextId: null, position: null, total: ids.length };

  return {
    prevId: index > 0 ? ids[index - 1] : null,
    nextId: index < ids.length - 1 ? ids[index + 1] : null,
    position: index + 1,
    total: ids.length,
  };
}

export async function getApplicationDetail(id: string, userId?: string) {
  return prisma.application.findUnique({
    where: { id },
    include: {
      founders: true,
      funders: true,
      techUseCases: true,
      reportLinks: true,
      aiEvaluations: { orderBy: { createdAt: 'desc' } },
      humanReviews: { include: { reviewer: true }, orderBy: { submittedAt: 'desc' } },
      juryScores: { include: { juror: { include: { benches: true } } }, orderBy: { submittedAt: 'desc' } },
      stageTransitions: { include: { actor: true }, orderBy: { createdAt: 'asc' } },
      reviewAssignments: { include: { reviewer: true } },
      targetMatch: true,
      bench: true,
      duplicates: true,
      outboxEmails: { orderBy: { createdAt: 'desc' } },
      comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
      notes: userId ? { where: { authorId: userId } } : false,
    },
  });
}
