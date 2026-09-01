export interface ViewSectionDef {
  key: string;
  label: string;
}

export interface ViewFieldDef {
  key: string;
  label: string;
  section: string;
  /** what's actually visible to each role today, before any admin override — reverse-engineered
   *  from the current role gates in ApplicationMainContent.tsx, so the manager below starts
   *  pre-checked exactly where the real page already shows the field. Every field is toggleable
   *  for every role — jury and observer can be given any field, up to the full admin/reviewer
   *  view, one section/field at a time. */
  defaultObserver: boolean;
  defaultJury: boolean;
}

/** The application detail page's sections — shared by admin, reviewer, observer, and jury alike.
 *  Observer and jury each get their own visibility map and their own section order over this
 *  exact same list, so either can be handed anywhere from a couple of fields up to the full
 *  admin/reviewer view. Admin/reviewer always see every section, unordered by this. */
export const VIEW_SECTIONS: ViewSectionDef[] = [
  { key: 'organisation', label: 'organisation' },
  { key: 'synopsis', label: 'application synopsis' },
  { key: 'foundersFunders', label: 'founders & funders' },
  { key: 'problemSolution', label: 'problem and solution' },
  { key: 'agwaterLegacy', label: 'impact and eligibility signals (agwater cycle)' },
  { key: 'registrationsGovernance', label: 'registrations and governance' },
  { key: 'model', label: 'model' },
  { key: 'techTools', label: 'tech and tools' },
  { key: 'experienceImpact', label: 'metrics' },
  { key: 'enrichment', label: 'public-data enrichment' },
  { key: 'pitchDeck', label: 'pitch deck' },
  { key: 'aiScoring', label: 'scoring, ai evaluation & scraper data' },
  { key: 'internalReview', label: 'internal remarks' },
];

/** Every field on the application detail page, grouped the same way the shared admin/reviewer
 *  tree groups them into cards. Field-level, not just section-level, since an admin may want to
 *  keep most of a section visible while dropping one sensitive field out of it. */
export const VIEW_FIELDS: ViewFieldDef[] = [
  // organisation
  { key: 'orgType', label: 'organisation type', section: 'organisation', defaultObserver: true, defaultJury: false },
  { key: 'recId', label: 'rec_id', section: 'organisation', defaultObserver: false, defaultJury: false },
  { key: 'website', label: 'website', section: 'organisation', defaultObserver: true, defaultJury: true },
  { key: 'linkedinUrl', label: 'linkedin', section: 'organisation', defaultObserver: true, defaultJury: false },
  { key: 'incorporationDate', label: 'incorporated', section: 'organisation', defaultObserver: true, defaultJury: true },
  { key: 'email', label: 'email', section: 'organisation', defaultObserver: true, defaultJury: false },
  { key: 'phone', label: 'phone', section: 'organisation', defaultObserver: true, defaultJury: false },
  { key: 'teamSize', label: 'team size', section: 'organisation', defaultObserver: true, defaultJury: true },

  // founders & funders
  { key: 'founders', label: 'founders', section: 'foundersFunders', defaultObserver: true, defaultJury: true },
  { key: 'funders', label: 'funders', section: 'foundersFunders', defaultObserver: true, defaultJury: false },

  // problem and solution
  { key: 'problemAddressing', label: 'problem addressing', section: 'problemSolution', defaultObserver: true, defaultJury: false },
  { key: 'aboutSolution', label: 'about the solution', section: 'problemSolution', defaultObserver: true, defaultJury: false },
  { key: 'valueChainFocus', label: 'value chain focus', section: 'problemSolution', defaultObserver: true, defaultJury: false },

  // agwater legacy
  { key: 'beneficiaries', label: 'beneficiaries', section: 'agwaterLegacy', defaultObserver: true, defaultJury: false },
  { key: 'smallMarginalFarmerPct', label: 'small/marginal farmer share', section: 'agwaterLegacy', defaultObserver: true, defaultJury: false },
  { key: 'areaHectaresRaw', label: 'area under coverage', section: 'agwaterLegacy', defaultObserver: true, defaultJury: false },
  { key: 'trl', label: 'TRL', section: 'agwaterLegacy', defaultObserver: true, defaultJury: false },
  { key: 'waterEfficiencyFocus', label: 'water-use efficiency focus', section: 'agwaterLegacy', defaultObserver: true, defaultJury: false },
  { key: 'waterEfficiencyEstimate', label: 'water efficiency estimate', section: 'agwaterLegacy', defaultObserver: true, defaultJury: false },
  { key: 'cropProductionFocus', label: 'crop production focus', section: 'agwaterLegacy', defaultObserver: true, defaultJury: false },
  { key: 'focusCrops', label: 'focus crops', section: 'agwaterLegacy', defaultObserver: true, defaultJury: false },

  // registrations and governance
  { key: 'legalRegistrationType', label: 'legal registration type', section: 'registrationsGovernance', defaultObserver: true, defaultJury: true },
  { key: 'annualOperatingBudget', label: 'annual operating budget', section: 'registrationsGovernance', defaultObserver: true, defaultJury: true },
  { key: 'fcraStatus', label: 'FCRA registration', section: 'registrationsGovernance', defaultObserver: true, defaultJury: false },
  { key: 'cert12A', label: '12A certificate', section: 'registrationsGovernance', defaultObserver: true, defaultJury: false },
  { key: 'cert80G', label: '80G certificate', section: 'registrationsGovernance', defaultObserver: true, defaultJury: false },
  { key: 'csr1Registration', label: 'CSR-1 registration', section: 'registrationsGovernance', defaultObserver: true, defaultJury: false },
  { key: 'darpanRegistered', label: 'NITI Aayog DARPAN ID', section: 'registrationsGovernance', defaultObserver: true, defaultJury: false },
  { key: 'darpanIdNumber', label: 'DARPAN registration number', section: 'registrationsGovernance', defaultObserver: true, defaultJury: false },

  // model
  { key: 'operatingModelArchetype', label: 'operating model archetype', section: 'model', defaultObserver: true, defaultJury: false },
  { key: 'operatingModelDescription', label: 'how it works in practice', section: 'model', defaultObserver: true, defaultJury: false },
  { key: 'primaryCrops', label: 'primary crops', section: 'model', defaultObserver: true, defaultJury: false },
  { key: 'regenerativePractices', label: 'regenerative practices', section: 'model', defaultObserver: true, defaultJury: false },
  { key: 'adoptionHurdle', label: 'biggest adoption hurdle', section: 'model', defaultObserver: true, defaultJury: false },

  // tech and tools
  { key: 'techTools', label: 'tools used for data / transparency / delivery', section: 'techTools', defaultObserver: true, defaultJury: false },
  { key: 'techToolsInternal', label: 'tools developed internally', section: 'techTools', defaultObserver: true, defaultJury: false },
  { key: 'otherTools', label: 'other tools', section: 'techTools', defaultObserver: true, defaultJury: false },
  { key: 'techUseCases', label: 'top tech use cases', section: 'techTools', defaultObserver: true, defaultJury: false },

  // experience and impact
  { key: 'yearsExperience', label: 'years of experience in regenerative agriculture', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'farmersCount', label: 'farmers reached', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'smallholderFarmersCount', label: 'of which smallholder (≤2ha)', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'avgLandHolding', label: 'average land holding (ha)', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'areaUnderRegenPractice', label: 'area under regenerative practice (ha)', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'villagesDistricts', label: 'villages / districts', section: 'experienceImpact', defaultObserver: true, defaultJury: false },
  { key: 'melHandling', label: 'MEL handled', section: 'experienceImpact', defaultObserver: true, defaultJury: false },
  { key: 'materialsInLocalLanguages', label: 'materials in local languages', section: 'experienceImpact', defaultObserver: true, defaultJury: false },
  { key: 'teamFormalTraining', label: 'team formally trained', section: 'experienceImpact', defaultObserver: true, defaultJury: false },
  { key: 'worksBeyondAg', label: 'works beyond agriculture', section: 'experienceImpact', defaultObserver: true, defaultJury: false },
  { key: 'infoAccurateConfirmed', label: 'info confirmed accurate by applicant', section: 'experienceImpact', defaultObserver: true, defaultJury: false },
  { key: 'teamTrainingDescription', label: 'team training details', section: 'experienceImpact', defaultObserver: true, defaultJury: false },
  { key: 'otherDevelopmentAreas', label: 'other development work beyond agriculture', section: 'experienceImpact', defaultObserver: true, defaultJury: false },
  { key: 'statesOperating', label: 'states / UTs of operation', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'verifiedImpacts', label: 'verified impacts / self reported impact', section: 'experienceImpact', defaultObserver: true, defaultJury: true },
  { key: 'fundUsagePlan', label: 'planned use of prize funds', section: 'experienceImpact', defaultObserver: true, defaultJury: false },
  { key: 'heardAboutChallenge', label: 'how they heard about the challenge', section: 'experienceImpact', defaultObserver: true, defaultJury: false },
  { key: 'reportLinks', label: 'published reports / case studies', section: 'experienceImpact', defaultObserver: true, defaultJury: false },

  // enrichment — hidden from both today
  { key: 'enrichmentSummary', label: 'public-data enrichment summary', section: 'enrichment', defaultObserver: false, defaultJury: false },

  // pitch deck — observer sees it, jury doesn't by default
  { key: 'pitchDeckUrl', label: 'pitch deck', section: 'pitchDeck', defaultObserver: true, defaultJury: false },

  // scoring / ai / scraper — hidden from both today, available to turn on for either
  { key: 'aiEvaluation', label: 'AI evaluation summary & section scores', section: 'aiScoring', defaultObserver: false, defaultJury: false },
  { key: 'scraperChecks', label: 'scraper data (organisation validation checks)', section: 'aiScoring', defaultObserver: false, defaultJury: false },
  { key: 'humanReviewScores', label: 'internal reviewer scores (full breakdown)', section: 'aiScoring', defaultObserver: false, defaultJury: false },

  // application synopsis
  { key: 'orgSynopsis', label: 'organisation & model synopsis', section: 'synopsis', defaultObserver: true, defaultJury: true },

  // internal reviewer remarks — comment text only, no scores
  { key: 'internalReviewerRemarks', label: 'internal remarks (comment only)', section: 'internalReview', defaultObserver: true, defaultJury: true },
];
