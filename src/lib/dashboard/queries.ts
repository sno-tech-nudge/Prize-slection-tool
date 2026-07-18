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
  const [total, shortlisted, internalYes, statesRaw, yearsRaw] = await Promise.all([
    prisma.application.count({ where: { isDuplicateOf: null } }),
    prisma.application.count({ where: { isDuplicateOf: null, stageStatus: { in: ['SHORTLISTED', 'JURY_REVIEW', 'FINALIST', 'WINNER'] } } }),
    prisma.application.count({ where: { isDuplicateOf: null, internalDecision: 'YES' } }),
    prisma.application.findMany({ where: { isDuplicateOf: null }, select: { statesOperating: true } }),
    prisma.application.findMany({ where: { isDuplicateOf: null, yearsExperience: { not: null } }, select: { yearsExperience: true } }),
  ]);

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
    internalYes,
    statesRepresented: statesSet.size,
    avgYearsExperience,
  };
}

/** Pipeline funnel that folds review status and internal decision into one view:
 *  received → reviewed → decision split (yes / no / undecided). */
export async function getReviewDecisionFunnel() {
  const apps = await prisma.application.findMany({
    where: { isDuplicateOf: null },
    select: { internalDecision: true, humanReviews: { select: { id: true }, take: 1 } },
  });
  const total = apps.length;
  const reviewed = apps.filter((a) => a.humanReviews.length > 0).length;
  const yes = apps.filter((a) => a.internalDecision === 'YES').length;
  const no = apps.filter((a) => a.internalDecision === 'NO').length;
  const undecided = total - yes - no;
  return [
    { label: 'applications received', count: total },
    { label: 'reviewed', count: reviewed },
    { label: 'decision: yes', count: yes },
    { label: 'decision: no', count: no },
    { label: 'undecided', count: undecided },
  ];
}

/** One row per user (admins review too, so this isn't reviewer-role-only) showing how many of
 *  their assigned applications they've submitted a HumanReview for vs. still owe. */
export async function getReviewerStats() {
  const [users, assignments, reviews] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true } }),
    prisma.reviewAssignment.findMany({ where: { application: { isDuplicateOf: null } }, select: { reviewerId: true, applicationId: true } }),
    prisma.humanReview.findMany({ where: { application: { isDuplicateOf: null } }, select: { reviewerId: true, applicationId: true } }),
  ]);
  const reviewedSet = new Set(reviews.map((r) => `${r.reviewerId}:${r.applicationId}`));
  const byUser = new Map(users.map((u) => [u.id, { name: u.name, assigned: 0, reviewed: 0 }]));
  for (const a of assignments) {
    const entry = byUser.get(a.reviewerId);
    if (!entry) continue;
    entry.assigned++;
    if (reviewedSet.has(`${a.reviewerId}:${a.applicationId}`)) entry.reviewed++;
  }
  return [...byUser.values()]
    .map((e) => ({ name: e.name, reviewed: e.reviewed, yetToReview: e.assigned - e.reviewed }))
    .sort((a, b) => b.reviewed - a.reviewed);
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
