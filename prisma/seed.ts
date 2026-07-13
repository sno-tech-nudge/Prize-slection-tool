import { PrismaClient } from '@prisma/client';
import { SeedSource } from '../src/lib/sources/seed-source';
import { orgKey } from '../src/lib/sources/normalize';
import { seedTransitionPath } from '../src/lib/stages/machine';
import { runMatcherForApplication } from '../src/lib/matching/matcher';
import { scoreApplication } from '../src/lib/scoring/runner';
import { updateSettings } from '../src/lib/settings';
import { DEFAULT_RUBRIC_WEIGHTS } from '../src/lib/scoring/rubric';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const prisma = new PrismaClient();

/** Minimal CSV parser — sufficient for the flat, comma-free-field target wishlist. */
function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter((l) => l.trim().length > 0);
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',');
    return Object.fromEntries(headers.map((h, i) => [h, (cells[i] ?? '').trim()]));
  });
}

async function resetTables() {
  await prisma.outboxEmail.deleteMany();
  await prisma.juryScore.deleteMany();
  await prisma.humanReview.deleteMany();
  await prisma.reviewAssignment.deleteMany();
  await prisma.stageTransition.deleteMany();
  await prisma.aiEvaluation.deleteMany();
  await prisma.founder.deleteMany();
  await prisma.application.deleteMany();
  await prisma.target.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();
}

async function seedUsers() {
  const users = [
    { name: 'Nisha Chawla', email: 'nisha.chawla@thenudge.org', role: 'ADMIN' },
    { name: 'Sravya Jandhyala', email: 'sravya.jandhyala@thenudge.org', role: 'ADMIN' },
    { name: 'Ananya Rao', email: 'ananya.rao@thenudge.org', role: 'REVIEWER' },
    { name: 'Vikram Sethi', email: 'vikram.sethi@thenudge.org', role: 'REVIEWER' },
    { name: 'Priya Nair', email: 'priya.nair@thenudge.org', role: 'REVIEWER' },
    { name: 'Karan Mehta', email: 'karan.mehta@thenudge.org', role: 'REVIEWER' },
    { name: 'Ramesh Iyer', email: 'ramesh.iyer@thenudge.org', role: 'JURY' },
    { name: 'Devika Menon', email: 'devika.menon@thenudge.org', role: 'JURY' },
    { name: 'Arjun Kapoor', email: 'arjun.kapoor@thenudge.org', role: 'JURY' },
    { name: 'Farah Khan', email: 'farah.khan@thenudge.org', role: 'OBSERVER' },
  ];
  const created = [];
  for (const u of users) {
    created.push(await prisma.user.create({ data: u }));
  }
  return {
    admins: created.filter((u) => u.role === 'ADMIN'),
    reviewers: created.filter((u) => u.role === 'REVIEWER'),
    jurors: created.filter((u) => u.role === 'JURY'),
    observers: created.filter((u) => u.role === 'OBSERVER'),
  };
}

async function seedApplications() {
  const source = new SeedSource();
  const rawRows = await source.pull();
  const inputs = rawRows.map((r) => ({ raw: r, input: source.toApplication(r) }));

  const primary = inputs.filter((i) => !i.input.duplicateOfOrgKey);
  const duplicates = inputs.filter((i) => i.input.duplicateOfOrgKey);

  const idByKey = new Map<string, string>();

  for (const { input } of primary) {
    const app = await prisma.application.create({
      data: {
        orgName: input.orgName,
        pocFirstName: input.pocFirstName,
        pocLastName: input.pocLastName,
        email: input.email,
        phone: input.phone,
        designation: input.designation,
        website: input.website,
        incorporationDate: input.incorporationDate,
        location: input.location,
        orgType: input.orgType,
        stageRaw: input.stageRaw,
        stageNormalized: input.stageNormalized,
        problemAddressing: input.problemAddressing,
        valueChainFocus: input.valueChainFocus,
        beneficiaries: input.beneficiaries,
        smallMarginalFarmerPct: input.smallMarginalFarmerPct,
        areaHectaresRaw: input.areaHectaresRaw,
        areaHectaresParsed: input.areaHectaresParsed,
        aboutSolution: input.aboutSolution,
        solutionCategory: input.solutionCategory,
        trl: input.trl,
        waterEfficiencyFocus: input.waterEfficiencyFocus,
        waterEfficiencyEstimate: input.waterEfficiencyEstimate,
        cropProductionFocus: input.cropProductionFocus,
        focusCrops: input.focusCrops,
        teamSize: input.teamSize,
        pitchDeckUrl: input.pitchDeckUrl,
        historicallyShortlisted: input.historicallyShortlisted,
        source: 'SEED',
        founders: { create: input.founders.map((f) => ({ fullName: f.fullName, role: f.role, linkedin: f.linkedin })) },
      },
    });
    idByKey.set(orgKey(input.orgName), app.id);
  }

  for (const { input } of duplicates) {
    const canonicalId = input.duplicateOfOrgKey ? idByKey.get(input.duplicateOfOrgKey) : undefined;
    await prisma.application.create({
      data: {
        orgName: input.orgName,
        pocFirstName: input.pocFirstName,
        pocLastName: input.pocLastName,
        email: input.email,
        phone: input.phone,
        designation: input.designation,
        orgType: input.orgType,
        stageNormalized: input.stageNormalized,
        aboutSolution: input.aboutSolution,
        solutionCategory: input.solutionCategory,
        trl: input.trl,
        teamSize: input.teamSize,
        pitchDeckUrl: input.pitchDeckUrl,
        historicallyShortlisted: false,
        source: 'SEED',
        isDuplicateOf: canonicalId,
        founders: { create: input.founders.map((f) => ({ fullName: f.fullName, role: f.role, linkedin: f.linkedin })) },
      },
    });
  }

  return prisma.application.findMany({ orderBy: { orgName: 'asc' } });
}

async function seedTargets() {
  const csvPath = join(process.cwd(), 'data', 'target_startups.sample.csv');
  const text = readFileSync(csvPath, 'utf8');
  const rows = parseCsv(text);
  for (const row of rows) {
    if (!row.name) continue;
    await prisma.target.create({
      data: {
        name: row.name,
        website: row.website || null,
        domain: row.domain || null,
        notes: row.notes || null,
      },
    });
  }
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function main() {
  console.log('Resetting tables...');
  await resetTables();

  console.log('Seeding settings...');
  await updateSettings({
    rubricWeights: DEFAULT_RUBRIC_WEIGHTS,
    shortlistSize: 20,
    autoSendRejections: false,
    activeSource: 'seed',
  });

  console.log('Seeding users...');
  const { admins, reviewers, jurors } = await seedUsers();

  console.log('Importing applications from the AgWater workbook...');
  const applications = await seedApplications();
  console.log(`  imported ${applications.length} application rows`);

  const nonDuplicates = applications.filter((a) => !a.isDuplicateOf);
  const shortlisted = shuffle(nonDuplicates.filter((a) => a.historicallyShortlisted));
  const others = shuffle(nonDuplicates.filter((a) => !a.historicallyShortlisted));
  const duplicateRows = applications.filter((a) => a.isDuplicateOf);

  const winners = shortlisted.slice(0, 2);
  const finalists = shortlisted.slice(2, 6);
  const juryReview = shortlisted.slice(6, 12);
  const stillShortlisted = shortlisted.slice(12);

  const rejectedCount = Math.min(40, Math.floor(others.length * 0.75));
  const rejected = others.slice(0, rejectedCount);
  const remaining = others.slice(rejectedCount);
  const underReview = remaining.slice(0, Math.ceil(remaining.length / 2));
  const submitted = remaining.slice(Math.ceil(remaining.length / 2));

  console.log('Backfilling stage history...');
  const admin = admins[0];

  for (const app of winners) {
    await seedTransitionPath({
      applicationId: app.id,
      path: ['SUBMITTED', 'SCREENING', 'UNDER_REVIEW', 'SHORTLISTED', 'JURY_REVIEW', 'FINALIST', 'WINNER'],
      actorId: admin.id,
      daysAgoStart: 120,
    });
  }
  for (const app of finalists) {
    await seedTransitionPath({
      applicationId: app.id,
      path: ['SUBMITTED', 'SCREENING', 'UNDER_REVIEW', 'SHORTLISTED', 'JURY_REVIEW', 'FINALIST'],
      actorId: admin.id,
      daysAgoStart: 110,
    });
  }
  for (const app of juryReview) {
    await seedTransitionPath({
      applicationId: app.id,
      path: ['SUBMITTED', 'SCREENING', 'UNDER_REVIEW', 'SHORTLISTED', 'JURY_REVIEW'],
      actorId: admin.id,
      daysAgoStart: 95,
    });
  }
  for (const app of stillShortlisted) {
    await seedTransitionPath({
      applicationId: app.id,
      path: ['SUBMITTED', 'SCREENING', 'UNDER_REVIEW', 'SHORTLISTED'],
      actorId: admin.id,
      daysAgoStart: 80,
    });
  }
  for (const app of underReview) {
    await seedTransitionPath({
      applicationId: app.id,
      path: ['SUBMITTED', 'SCREENING', 'UNDER_REVIEW'],
      actorId: admin.id,
      daysAgoStart: 30,
    });
  }
  for (const app of submitted) {
    await seedTransitionPath({
      applicationId: app.id,
      path: ['SUBMITTED'],
      actorId: admin.id,
      daysAgoStart: 10,
    });
  }
  for (const app of rejected) {
    await seedTransitionPath({
      applicationId: app.id,
      path: ['SUBMITTED', 'SCREENING', 'REJECTED'],
      actorId: admin.id,
      daysAgoStart: 60,
    });
  }
  for (const app of duplicateRows) {
    await seedTransitionPath({
      applicationId: app.id,
      path: ['SUBMITTED', 'REJECTED'],
      actorId: admin.id,
      daysAgoStart: 60,
    });
  }

  console.log('Backdating submittedAt to match each application\'s earliest transition...');
  const earliestTransitions = await prisma.stageTransition.groupBy({
    by: ['applicationId'],
    _min: { createdAt: true },
  });
  for (const row of earliestTransitions) {
    if (!row._min.createdAt) continue;
    await prisma.application.update({ where: { id: row.applicationId }, data: { submittedAt: row._min.createdAt } });
  }

  console.log('Assigning reviewers + backfilling human reviews...');
  const reviewCohorts = [...underReview, ...stillShortlisted, ...juryReview, ...finalists, ...winners];
  for (let i = 0; i < reviewCohorts.length; i++) {
    const app = reviewCohorts[i];
    const r1 = reviewers[i % reviewers.length];
    const r2 = reviewers[(i + 1) % reviewers.length];
    await prisma.reviewAssignment.createMany({
      data: [
        { applicationId: app.id, reviewerId: r1.id },
        { applicationId: app.id, reviewerId: r2.id },
      ],
    });

    // applications that made it past UNDER_REVIEW have full consensus; a portion of the
    // live under-review queue only has one reviewer in so far, to demo a pending state.
    const pastReview = app.stageStatus !== 'UNDER_REVIEW' || i % 3 !== 0;
    const criteria = JSON.stringify([
      { key: 'soil_health', score: 3.5, rationale: 'seed data', evidence: '', confidence: 0.6 },
    ]);
    const submittedAt = (await prisma.application.findUniqueOrThrow({ where: { id: app.id }, select: { submittedAt: true } })).submittedAt;
    const reviewedAt1 = new Date(submittedAt.getTime() + (2 + (i % 5)) * 86400000);
    const reviewedAt2 = new Date(submittedAt.getTime() + (4 + (i % 6)) * 86400000);
    await prisma.humanReview.create({
      data: {
        applicationId: app.id,
        reviewerId: r1.id,
        criteria,
        composite: 55 + ((i * 7) % 40),
        recommendation: app.stageStatus === 'UNDER_REVIEW' ? 'HOLD' : 'ADVANCE',
        comment: 'strong fit against the water-efficiency and adoption thresholds.',
        submittedAt: reviewedAt1,
      },
    });
    if (pastReview) {
      await prisma.humanReview.create({
        data: {
          applicationId: app.id,
          reviewerId: r2.id,
          criteria,
          composite: 50 + ((i * 11) % 45),
          recommendation: app.stageStatus === 'UNDER_REVIEW' ? 'ADVANCE' : 'ADVANCE',
          comment: 'agree on adoption strengths; would like more evidence on income impact.',
          submittedAt: reviewedAt2,
        },
      });
    }
  }

  console.log('Backfilling jury scores...');
  for (const app of [...juryReview, ...finalists, ...winners]) {
    for (const juror of jurors) {
      await prisma.juryScore.create({
        data: {
          applicationId: app.id,
          jurorId: juror.id,
          criteria: JSON.stringify([{ key: 'scale_replicability', score: 4, rationale: 'seed data', evidence: '', confidence: 0.6 }]),
          composite: 60 + ((juror.name.length * 3) % 35),
          verdict: winners.includes(app) ? 'YES' : finalists.includes(app) ? 'YES' : 'MAYBE',
          comment: 'credible cluster model; would like to see the farmer-facing economics laid out more plainly.',
        },
      });
    }
  }

  console.log('Queuing rejection emails for the outbox...');
  const { enqueueRejectionEmail, approveAndSendOutboxEmail } = await import('../src/lib/mail/outbox');
  for (const app of [...rejected, ...duplicateRows]) {
    const template: 'general_rejection' | 'strong_not_this_cycle' = app.isDuplicateOf
      ? 'general_rejection'
      : Math.random() > 0.7
        ? 'strong_not_this_cycle'
        : 'general_rejection';
    const note = app.isDuplicateOf ? 'we noticed this looked like a duplicate of another submission from your organisation.' : undefined;
    const email = await enqueueRejectionEmail(app.id, template, note);
    await approveAndSendOutboxEmail(email.id);
  }

  console.log('Seeding target wishlist + running the matcher...');
  await seedTargets();
  for (const app of applications) {
    await runMatcherForApplication(app.id);
  }

  console.log('Running AI scoring on a subset (uses ANTHROPIC_API_KEY if set, heuristic fallback otherwise)...');
  const scoringSubset = [...winners, ...finalists, ...juryReview, ...stillShortlisted.slice(0, 6), ...rejected.slice(0, 4)].slice(0, 20);
  for (const app of scoringSubset) {
    try {
      const { usedModel } = await scoreApplication(app.id);
      console.log(`  scored ${app.orgName} with ${usedModel}`);
    } catch (err) {
      console.warn(`  failed to score ${app.orgName}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
