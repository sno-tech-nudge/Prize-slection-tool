'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { normalizeStage } from '@/lib/sources/normalize';
import { enqueueJob } from '@/lib/jobs/queue';
import { seedTransitionPath } from '@/lib/stages/machine';
import type {
  OrgTypeValue,
  TeamSizeValue,
  LegalRegistrationTypeValue,
  AnnualBudgetBandValue,
  OperatingModelArchetypeValue,
  MelHandlingValue,
} from '@/lib/constants';

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function num(formData: FormData, key: string): number | undefined {
  const v = formData.get(key);
  return v && String(v).trim() ? Number(v) : undefined;
}

function yesNo(formData: FormData, key: string): boolean | undefined {
  const v = str(formData, key);
  return v ? v === 'YES' : undefined;
}

export async function submitApplicationAction(formData: FormData) {
  const orgName = str(formData, 'orgName');
  const pocFirstName = str(formData, 'pocFirstName');
  const pocLastName = str(formData, 'pocLastName');
  const email = str(formData, 'email');
  if (!orgName || !pocFirstName || !pocLastName || !email) {
    throw new Error('Organisation name, contact name and email are required.');
  }

  const founders = [];
  const f1Name = str(formData, 'f1FullName');
  if (f1Name) {
    founders.push({
      fullName: f1Name,
      role: str(formData, 'f1Designation'),
      linkedin: str(formData, 'f1Linkedin'),
    });
  }
  const f2Name = str(formData, 'f2FullName');
  if (f2Name) {
    founders.push({
      fullName: f2Name,
      role: str(formData, 'f2Designation'),
      linkedin: str(formData, 'f2Linkedin'),
    });
  }

  const funders = ['funder1', 'funder2', 'funder3']
    .map((k) => str(formData, k))
    .filter((v): v is string => !!v)
    .map((name) => ({ name }));

  const techUseCases = ['techUseCase1', 'techUseCase2', 'techUseCase3']
    .map((k) => str(formData, k))
    .filter((v): v is string => !!v)
    .map((description) => ({ description }));

  const reportLinks = ['reportLink1', 'reportLink2']
    .map((k) => str(formData, k))
    .filter((v): v is string => !!v)
    .map((url) => ({ url }));

  const primaryCrops = formData.getAll('primaryCrops').join(';');
  const regenerativePractices = formData.getAll('regenerativePractices').join(';');
  const techTools = formData.getAll('techTools').join(';');
  const statesOperating = formData.getAll('statesOperating').join(';');
  const stageRaw = str(formData, 'stageRaw');
  const incorporationDate = str(formData, 'incorporationDate');

  const application = await prisma.application.create({
    data: {
      orgName,
      pocFirstName,
      pocLastName,
      email,
      phone: str(formData, 'phone'),
      designation: str(formData, 'designation'),
      website: str(formData, 'website'),
      linkedinUrl: str(formData, 'linkedinUrl'),
      location: str(formData, 'location'),
      orgType: (str(formData, 'orgType') as OrgTypeValue) ?? 'FOR_PROFIT',
      incorporationDate: incorporationDate ? new Date(incorporationDate) : undefined,
      stageRaw,
      stageNormalized: normalizeStage(stageRaw),

      legalRegistrationType: str(formData, 'legalRegistrationType') as LegalRegistrationTypeValue | undefined,
      fcraStatus: str(formData, 'fcraStatus'),
      cert12A: str(formData, 'cert12A'),
      cert80G: str(formData, 'cert80G'),
      csr1Registration: str(formData, 'csr1Registration'),
      darpanRegistered: str(formData, 'darpanRegistered'),
      annualOperatingBudget: str(formData, 'annualOperatingBudget') as AnnualBudgetBandValue | undefined,
      teamSize: str(formData, 'teamSize') as TeamSizeValue | undefined,
      funders: { create: funders },

      operatingModelArchetype: str(formData, 'operatingModelArchetype') as OperatingModelArchetypeValue | undefined,
      operatingModelDescription: str(formData, 'operatingModelDescription'),
      primaryCrops: primaryCrops || undefined,
      regenerativePractices: regenerativePractices || undefined,
      adoptionHurdle: str(formData, 'adoptionHurdle'),

      techTools: techTools || undefined,
      techToolsInternal: yesNo(formData, 'techToolsInternal'),
      techUseCases: { create: techUseCases },

      yearsExperience: num(formData, 'yearsExperience'),
      verifiedImpacts: str(formData, 'verifiedImpacts'),
      statesOperating: statesOperating || undefined,
      farmersCount: num(formData, 'farmersCount'),
      smallholderFarmersCount: num(formData, 'smallholderFarmersCount'),
      avgLandHolding: num(formData, 'avgLandHolding'),
      areaUnderRegenPractice: num(formData, 'areaUnderRegenPractice'),
      villagesCount: num(formData, 'villagesCount'),
      districtsCount: num(formData, 'districtsCount'),
      worksBeyondAg: yesNo(formData, 'worksBeyondAg'),
      materialsInLocalLanguages: yesNo(formData, 'materialsInLocalLanguages'),
      teamFormalTraining: yesNo(formData, 'teamFormalTraining'),
      melHandling: str(formData, 'melHandling') as MelHandlingValue | undefined,
      fundUsagePlan: str(formData, 'fundUsagePlan'),
      reportLinks: { create: reportLinks },

      pitchDeckUrl: str(formData, 'pitchDeckUrl'),
      source: 'MANUAL',
      founders: { create: founders },
    },
  });

  await seedTransitionPath({ applicationId: application.id, path: ['SUBMITTED'], daysAgoStart: 0 });

  // enrichment + matching + scoring run asynchronously via the job queue so the applicant
  // isn't kept waiting — the JobQueueTicker drains these within a few seconds. Enrichment is
  // queued first so its summary is usually available by the time scoring runs.
  await enqueueJob('ENRICH_APPLICATION', application.id);
  await enqueueJob('MATCH_APPLICATION', application.id);
  await enqueueJob('SCORE_APPLICATION', application.id);

  redirect(`/apply/thank-you?ref=${application.id}`);
}
