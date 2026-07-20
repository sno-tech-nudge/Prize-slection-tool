import type { Prisma, User } from '@prisma/client';
import { prisma } from '@/lib/db';
import { visibleApplicationWhere } from '@/lib/auth/guard';
import { evaluateEligibility } from '@/lib/scoring/eligibility';

export interface ApplicationListFilters {
  reviewed?: string;
  category?: string;
  q?: string;
  internal?: string;
  registrationType?: string;
  operatingModel?: string;
  state?: string;
  eligible?: string;
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
  const where: Prisma.ApplicationWhereInput = { ...visibleApplicationWhere(user), isDuplicateOf: null };
  if (filters.reviewed === 'YES') where.humanReviews = { some: {} };
  if (filters.reviewed === 'NO') where.humanReviews = { none: {} };
  if (filters.category) where.solutionCategory = filters.category;
  if (filters.q) where.orgName = { contains: filters.q };
  if (filters.internal === 'YES' || filters.internal === 'NO') where.internalDecision = filters.internal;
  if (filters.internal === 'UNDECIDED') where.internalDecision = null;
  if (filters.registrationType) where.legalRegistrationType = filters.registrationType;
  if (filters.operatingModel) where.operatingModelArchetype = { contains: filters.operatingModel };
  if (filters.state) where.statesOperating = { contains: filters.state };

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

/** Registration type, operating model and state values are free text keyed off the real Zoho
 *  form, not the fixed enums in constants.ts — so filter dropdowns are built from whatever
 *  distinct values actually exist in the data, not from the enum list. */
export async function getApplicationFilterOptions() {
  const apps = await prisma.application.findMany({
    where: { isDuplicateOf: null },
    select: { legalRegistrationType: true, operatingModelArchetype: true, statesOperating: true },
  });

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
  };
}

/** All applications for the outreach tab — filterable by internal decision, with each
 *  application's outbox email history so the table can show what's already queued/sent. */
export async function listApplicationsForOutreach(internalDecision?: string) {
  const where: Prisma.ApplicationWhereInput = { isDuplicateOf: null };
  if (internalDecision === 'YES' || internalDecision === 'NO') where.internalDecision = internalDecision;
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

/** Prev/next neighbours of an application in the same order as the applications list (most
 *  recently submitted first), respecting the viewer's role-based visibility — a reviewer
 *  stepping through their assigned applications never lands on one they can't see. */
export async function getAdjacentApplications(id: string, user: User | null) {
  const where: Prisma.ApplicationWhereInput = { ...visibleApplicationWhere(user), isDuplicateOf: null };
  const ids = await prisma.application.findMany({
    where,
    orderBy: { submittedAt: 'desc' },
    select: { id: true },
  });

  const index = ids.findIndex((a) => a.id === id);
  if (index === -1) return { prevId: null, nextId: null, position: null, total: ids.length };

  return {
    prevId: index > 0 ? ids[index - 1].id : null,
    nextId: index < ids.length - 1 ? ids[index + 1].id : null,
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
      aiEvaluations: { orderBy: { createdAt: 'desc' }, include: { overriddenBy: true } },
      humanReviews: { include: { reviewer: true }, orderBy: { submittedAt: 'desc' } },
      juryScores: { include: { juror: true }, orderBy: { submittedAt: 'desc' } },
      stageTransitions: { include: { actor: true }, orderBy: { createdAt: 'asc' } },
      reviewAssignments: { include: { reviewer: true } },
      targetMatch: true,
      duplicates: true,
      outboxEmails: { orderBy: { createdAt: 'desc' } },
      comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
      notes: userId ? { where: { authorId: userId } } : false,
    },
  });
}
