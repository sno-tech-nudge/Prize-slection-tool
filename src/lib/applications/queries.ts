import type { Prisma, User } from '@prisma/client';
import { prisma } from '@/lib/db';
import { visibleApplicationWhere } from '@/lib/auth/guard';

export interface ApplicationListFilters {
  reviewed?: string;
  category?: string;
  q?: string;
  internal?: string;
}

export function applicationListInclude() {
  return {
    aiEvaluations: { orderBy: { createdAt: 'desc' as const }, take: 1 },
    humanReviews: true,
    targetMatch: true,
    reviewAssignments: { include: { reviewer: true } },
  } satisfies Prisma.ApplicationInclude;
}

export async function listApplications(filters: ApplicationListFilters, user: User | null) {
  const where: Prisma.ApplicationWhereInput = { ...visibleApplicationWhere(user), isDuplicateOf: null };
  if (filters.reviewed === 'YES') where.humanReviews = { some: {} };
  if (filters.reviewed === 'NO') where.humanReviews = { none: {} };
  if (filters.category) where.solutionCategory = filters.category;
  if (filters.q) where.orgName = { contains: filters.q };
  if (filters.internal === 'YES' || filters.internal === 'NO') where.internalDecision = filters.internal;
  if (filters.internal === 'UNDECIDED') where.internalDecision = null;

  return prisma.application.findMany({
    where,
    orderBy: { submittedAt: 'desc' },
    include: applicationListInclude(),
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
