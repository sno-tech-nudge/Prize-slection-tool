import { prisma } from '@/lib/db';
import { computeConsensus } from '@/lib/applications/consensus';
import { parseRedFlags } from '@/lib/scoring/parse';

const ELIGIBILITY_FIELDS = ['fcraStatus', 'cert12A', 'cert80G', 'csr1Registration'] as const;

/** Surfaces applications that need attention before they slip through the pipeline unnoticed:
 *  either the AI evaluation raised red flags, or the applicant hasn't answered all 4 core
 *  eligibility/registration questions yet. */
export async function getFlaggedApplications() {
  const apps = await prisma.application.findMany({
    where: { isDuplicateOf: null },
    select: {
      id: true,
      orgName: true,
      fcraStatus: true,
      cert12A: true,
      cert80G: true,
      csr1Registration: true,
      aiEvaluations: { orderBy: { createdAt: 'desc' }, take: 1, select: { redFlags: true } },
    },
  });

  return apps
    .map((app) => {
      const redFlags = app.aiEvaluations[0] ? parseRedFlags(app.aiEvaluations[0].redFlags) : [];
      const eligibilityAnswered = ELIGIBILITY_FIELDS.filter((f) => app[f] != null).length;
      const ineligible = eligibilityAnswered < ELIGIBILITY_FIELDS.length;
      return { id: app.id, orgName: app.orgName, redFlags, eligibilityAnswered, ineligible };
    })
    .filter((a) => a.redFlags.length > 0 || a.ineligible);
}

export async function getDashboardKpis() {
  const [total, shortlisted, winners, queuedOutbox, internalYes] = await Promise.all([
    prisma.application.count({ where: { isDuplicateOf: null } }),
    prisma.application.count({ where: { isDuplicateOf: null, stageStatus: { in: ['SHORTLISTED', 'JURY_REVIEW', 'FINALIST', 'WINNER'] } } }),
    prisma.application.count({ where: { isDuplicateOf: null, stageStatus: 'WINNER' } }),
    prisma.outboxEmail.count({ where: { status: 'QUEUED' } }),
    prisma.application.count({ where: { isDuplicateOf: null, internalDecision: 'YES' } }),
  ]);
  return {
    total,
    shortlisted,
    winners,
    queuedOutbox,
    internalYes,
  };
}

export async function getRecentActivity(limit = 8) {
  return prisma.stageTransition.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { application: { select: { id: true, orgName: true } }, actor: true },
  });
}

export async function getDivergentApplications() {
  const apps = await prisma.application.findMany({
    where: { isDuplicateOf: null, stageStatus: { in: ['UNDER_REVIEW', 'SHORTLISTED', 'JURY_REVIEW'] } },
    include: { humanReviews: true, aiEvaluations: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  return apps
    .map((app) => ({
      app,
      consensus: computeConsensus({
        aiComposite: app.aiEvaluations[0]?.composite,
        humanComposites: app.humanReviews.map((r) => r.composite),
      }),
    }))
    .filter((x) => x.consensus.divergent);
}
