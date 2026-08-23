export interface ViewSectionDef {
  key: string;
  label: string;
}

export interface ViewFieldDef {
  key: string;
  label: string;
  section: string;
  /** what's actually visible to each role today, before any admin override — reverse-engineered
   *  from the current role gates in ApplicationMainContent.tsx / the application detail page, so
   *  the manager below starts pre-checked exactly where the real page already shows the field. */
  defaultObserver: boolean;
  defaultJury: boolean;
}

export const VIEW_SECTIONS: ViewSectionDef[] = [
  { key: 'organisation', label: 'organisation' },
  { key: 'foundersFunders', label: 'founders & funders' },
  { key: 'problemSolution', label: 'problem and solution' },
  { key: 'agwaterLegacy', label: 'impact and eligibility signals (agwater cycle)' },
  { key: 'registrationsGovernance', label: 'registrations and governance' },
  { key: 'model', label: 'model' },
  { key: 'techTools', label: 'tech and tools' },
  { key: 'experienceImpact', label: 'experience and impact' },
  { key: 'enrichment', label: 'public-data enrichment' },
  { key: 'pitchDeck', label: 'pitch deck' },
  { key: 'aiScoring', label: 'scoring, ai evaluation & scraper data' },
  { key: 'internalReview', label: 'internal reviewer remarks' },
];

/** Every field currently rendered on the application detail page, grouped the same way the page
 *  itself groups them into cards. Field-level, not just section-level, since an admin may want to
 *  keep most of a section visible while dropping one sensitive field out of it. */
export const VIEW_FIELDS: ViewFieldDef[] = [
  // organisation
  { key: 'orgType', label: 'organisation type', section: 'organisation', defaultObserver: true, defaultJury: true },
  { key: 'recId', label: 'rec_id', section: 'organisation', defaultObserver: false, defaultJury: false },
  { key: 'website', label: 'website', section: 'organisation', defaultObserver: true, defaultJury: true },
  { key: 'linkedinUrl', label: 'linkedin', section: 'organisation', defaultObserver: true, defaultJury: true },
  { key: 'incorporationDate', label: 'incorporated', section: 'organisation', defaultObserver: true, defaultJury: true },
  { key: 'email', label: 'email', section: 'organisation', defaultObserver: true, defaultJury: true },
  { key: 'phone', label: 'phone', section: 'organisation', defaultObserver: true, defaultJury: true },
  { key: 'teamSize', label: 'team size', section: 'organisation', defaultObserver: true, defaultJury: true },

  // founders & funders
  { key: 'founders', label: 'founders', section: 'foundersFunders', defaultObserver: true, defaultJury: true },
  { key: 'funders', label: 'funders', section: 'foundersFunders', defaultObserver: true, defaultJury: true },

  // problem and solution
  { key: 'problemAddressing', label: 'problem addressing', section: 'problemSolution', defaultObserver: true, defaultJury: true },
  { key: 'aboutSolution', label: 'about the solution', section: 'problemSolution', defaultObserver: true, defaultJury: true },
  { key: 'valueChainFocus', label: 'value chain focus', section: 'problemSolution', defaultObserver: true, defaultJury: true },

  // agwater legacy
  { key: 'beneficiaries', label: 'beneficiaries', section: 'agwaterLegacy', defaultObserver: true, defaultJury: true },
  { key: 'smallMarginalFarmerPct', label: 'small/marginal farmer share', section: 'agwaterLegacy', defaultObserver: true, defaultJury: true },
  { key: 'areaHectaresRaw', label: 'area under coverage', section: 'agwaterLegacy', defaultObserver: true, defaultJury: true },
  { key: 'trl', label: 'TRL', section: 'agwaterLegacy', defaultObserver: true, defaultJury: true },
  { key: 'waterEfficiencyFocus', label: 'water-use efficiency focus', section: 'agwaterLegacy', defaultObserver: true, defaultJury: true },
  { key: 'waterEfficiencyEstimate', label: 'water efficiency estimate', section: 'agwaterLegacy', defaultObserver: true, defaultJury: true },
  { key: 'cropProductionFocus', label: 'crop production focus', section: 'agwaterLegacy', defaultObserver: true, defaultJury: true },
  { key: 'focusCrops', label: 'focus crops', section: 'agwaterLegacy', defaultObserver: true, defaultJury: true },

  // registrations and governance
  { key: 'legalRegistrationType', label: 'legal registration type', section: 'registrationsGovernance', defaultObserver: true, defaultJury: true },
  { key: 'annualOperatingBudget', label: 'annual operating budget', section: 'registrationsGovernance', defaultObserver: true, defaultJury: true },
  { key: 'fcraStatus', label: 'FCRA registration', section: 'registrationsGovernance', defaultObserver: true, defaultJury: true },
  { key: 'cert12A', label: '12A certificate', section: 'registrationsGovernance', defaultObserver: true, defaultJury: true },
  { key: 'cert80G', label: '80G certificate', section: 'registrationsGovernance', defaultObserver: true, defaultJury: true },
  { key: 'csr1Registration', label: 'CSR-1 registration', section: 'registrationsGovernance', defaultObserver: true, defaultJury: true },
  { key: 'darpanRegistered', label: 'NITI Aayog DARPAN ID', section: 'registrationsGovernance', defaultObserver: true, defaultJury: true },
  { key: 'darpanIdNumber', label: 'DARPAN registration number', section: 'registrationsGovernance', defaultObserver: true, defaultJury: true },

  // model
  { key: 'operatingModelArchetype', label: 'operating model archetype', section: 'model', defaultObserver: true, defaultJury: true },
  { key: 'operatingModelDescription', label: 'how it works in practice', section: 'model', defaultObserver: true, defaultJury: true },
  { key: 'primaryCrops', label: 'primary crops', section: 'model', defaultObserver: true, defaultJury: true },
  { key: 'regenerativePractices', label: 'regenerative practices', section: 'model', defaultObserver: true, defaultJury: true },
  { key: 'adoptionHurdle', label: 'biggest adoption hurdle', section: 'model', defaultObserver: true, defaultJury: true },

  // tech and tools
  { key: 'techTools', label: 'tools used for data / transparency / delivery', section: 'techTools', defaultObserver: true, defaultJury: true },
  { key: 'techToolsInternal', label: 'tools developed internally', section: 'techTools', defaultObserver: true, defaultJury: true },
  { key: 'otherTools', label: 'other tools', section: 'techTools', defaultObserver: true, defaultJury: true },
  { key: 'techUseCases', label: 'top tech use cases', section: 'techTools', defaultObserver: true, defaultJury: true },

  // experience and impact
  { key: 'yearsExperience', label: 'years of experience in regenerative agriculture', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'farmersCount', label: 'farmers reached', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'smallholderFarmersCount', label: 'of which smallholder (≤2ha)', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'avgLandHolding', label: 'average land holding (ha)', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'areaUnderRegenPractice', label: 'area under regenerative practice (ha)', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'villagesDistricts', label: 'villages / districts', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'melHandling', label: 'MEL handled', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'materialsInLocalLanguages', label: 'materials in local languages', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'teamFormalTraining', label: 'team formally trained', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'worksBeyondAg', label: 'works beyond agriculture', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'infoAccurateConfirmed', label: 'info confirmed accurate by applicant', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'teamTrainingDescription', label: 'team training details', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'otherDevelopmentAreas', label: 'other development work beyond agriculture', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'statesOperating', label: 'states / UTs of operation', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'verifiedImpacts', label: 'verified impacts', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'fundUsagePlan', label: 'planned use of prize funds', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'heardAboutChallenge', label: 'how they heard about the challenge', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'reportLinks', label: 'published reports / case studies', section: 'experienceImpact', defaultObserver: true, defaultJury: true },

  // enrichment — already observer-hidden today
  { key: 'enrichmentSummary', label: 'public-data enrichment summary', section: 'enrichment', defaultObserver: false, defaultJury: true },

  // pitch deck
  { key: 'pitchDeckUrl', label: 'pitch deck', section: 'pitchDeck', defaultObserver: true, defaultJury: true },

  // scoring / ai / scraper — already fully hidden from both today
  { key: 'aiEvaluation', label: 'AI evaluation summary & section scores', section: 'aiScoring', defaultObserver: false, defaultJury: false },
  { key: 'scraperChecks', label: 'scraper data (organisation validation checks)', section: 'aiScoring', defaultObserver: false, defaultJury: false },
  { key: 'humanReviewScores', label: 'internal reviewer scores (full breakdown)', section: 'aiScoring', defaultObserver: false, defaultJury: false },

  // internal reviewer remarks — already shown to both today (comment text only, no scores)
  { key: 'internalReviewerRemarks', label: 'internal reviewer remarks (comment only)', section: 'internalReview', defaultObserver: true, defaultJury: true },
];
