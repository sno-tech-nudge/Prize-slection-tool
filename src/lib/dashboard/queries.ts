import { prisma } from '@/lib/db';
import { computeConsensus } from '@/lib/applications/consensus';
import { parseRedFlags } from '@/lib/scoring/parse';
import { evaluateEligibility } from '@/lib/scoring/eligibility';

/** Surfaces applications that need attention before they slip through the pipeline unnoticed:
 *  either the AI evaluation raised red flags, or the Level 1 eligibility screen (see
 *  src/lib/scoring/eligibility.ts) actually fails them. */
export async function getFlaggedApplications() {
  const apps = await prisma.application.findMany({
    where: { isDuplicateOf: null },
    select: {
      id: true,
      orgName: true,
      pocFirstName: true,
      pocLastName: true,
      designation: true,
      phone: true,
      email: true,
      website: true,
      linkedinUrl: true,
      legalRegistrationType: true,
      fcraStatus: true,
      cert12A: true,
      cert80G: true,
      csr1Registration: true,
      darpanRegistered: true,
      founders: { select: { fullName: true, email: true, linkedin: true } },
      aiEvaluations: { orderBy: { createdAt: 'desc' }, take: 1, select: { redFlags: true } },
    },
  });

  return apps
    .map((app) => {
      const redFlags = app.aiEvaluations[0] ? parseRedFlags(app.aiEvaluations[0].redFlags) : [];
      const eligibility = evaluateEligibility(app);
      return { id: app.id, orgName: app.orgName, redFlags, eligibilityReasons: eligibility.failedReasons, ineligible: !eligibility.eligible };
    })
    .filter((a) => a.redFlags.length > 0 || a.ineligible);
}

export async function getDashboardKpis() {
  const [total, shortlisted, winners, queuedOutbox, internalYes, composites, statesRaw, yearsRaw] = await Promise.all([
    prisma.application.count({ where: { isDuplicateOf: null } }),
    prisma.application.count({ where: { isDuplicateOf: null, stageStatus: { in: ['SHORTLISTED', 'JURY_REVIEW', 'FINALIST', 'WINNER'] } } }),
    prisma.application.count({ where: { isDuplicateOf: null, stageStatus: 'WINNER' } }),
    prisma.outboxEmail.count({ where: { status: 'QUEUED' } }),
    prisma.application.count({ where: { isDuplicateOf: null, internalDecision: 'YES' } }),
    prisma.aiEvaluation.findMany({
      where: { application: { isDuplicateOf: null } },
      orderBy: { createdAt: 'desc' },
      distinct: ['applicationId'],
      select: { composite: true, overrideComposite: true },
    }),
    prisma.application.findMany({ where: { isDuplicateOf: null }, select: { statesOperating: true } }),
    prisma.application.findMany({ where: { isDuplicateOf: null, yearsExperience: { not: null } }, select: { yearsExperience: true } }),
  ]);

  const avgComposite =
    composites.length > 0
      ? Math.round(composites.reduce((sum, e) => sum + (e.overrideComposite ?? e.composite), 0) / composites.length)
      : null;

  const statesSet = new Set<string>();
  for (const a of statesRaw) {
    (a.statesOperating ?? '').split(';').forEach((s) => {
      const v = s.trim();
      if (v) statesSet.add(v);
    });
  }

  const avgYearsExperience =
    yearsRaw.length > 0 ? Math.round((yearsRaw.reduce((sum, a) => sum + (a.yearsExperience ?? 0), 0) / yearsRaw.length) * 10) / 10 : null;

  return {
    total,
    shortlisted,
    winners,
    queuedOutbox,
    internalYes,
    avgComposite,
    statesRepresented: statesSet.size,
    avgYearsExperience,
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
