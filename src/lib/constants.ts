// SQLite has no native enum support in Prisma — every enum-like column is a
// String in prisma/schema.prisma. These are the canonical value lists,
// validated at the app layer (seed, server actions, forms).

export const USER_ROLES = ['ADMIN', 'REVIEWER', 'JURY', 'OBSERVER'] as const;
export type UserRoleValue = (typeof USER_ROLES)[number];
export const ROLE_LABEL: Record<UserRoleValue, string> = {
  ADMIN: 'admin',
  REVIEWER: 'reviewer',
  JURY: 'jury',
  OBSERVER: 'observer',
};

export const ORG_VALIDATION_VERDICTS = ['CONFIRMED', 'PARTIAL', 'UNVERIFIED', 'CONTRADICTED'] as const;
export type OrgValidationVerdictValue = (typeof ORG_VALIDATION_VERDICTS)[number];
export const ORG_VALIDATION_VERDICT_LABEL: Record<OrgValidationVerdictValue, string> = {
  CONFIRMED: 'confirmed independently',
  PARTIAL: 'partially confirmed',
  UNVERIFIED: 'unverified',
  CONTRADICTED: 'contradicted',
};

export const ORG_TYPES = ['FOR_PROFIT', 'NON_PROFIT', 'FPO_FPC', 'OTHER'] as const;
export type OrgTypeValue = (typeof ORG_TYPES)[number];
export const ORG_TYPE_LABEL: Record<OrgTypeValue, string> = {
  FOR_PROFIT: 'for profit',
  NON_PROFIT: 'non-profit',
  FPO_FPC: 'FPO/FPC',
  OTHER: 'other',
};

export const NORMALIZED_STAGES = ['IDEA', 'PROTOTYPE', 'MARKET_READY', 'GROWTH', 'SCALE', 'OTHER'] as const;
export type NormalizedStageValue = (typeof NORMALIZED_STAGES)[number];

export const FOCUS_LEVELS = ['YES', 'PARTIALLY', 'NO'] as const;
export type FocusLevelValue = (typeof FOCUS_LEVELS)[number];

export const TEAM_SIZES = ['S_0_10', 'S_10_50', 'S_50_150', 'S_150_PLUS'] as const;
export type TeamSizeValue = (typeof TEAM_SIZES)[number];
export const TEAM_SIZE_LABEL: Record<TeamSizeValue, string> = {
  S_0_10: '0-10',
  S_10_50: '10-50',
  S_50_150: '50-150',
  S_150_PLUS: '150+',
};

export const SOLUTION_CATEGORIES = [
  'PRECISION_FARMING',
  'ADVISORY',
  'IRRIGATION',
  'PACKAGE_OF_PRACTICES',
  'SCIENCE_BASED',
  'TRADITIONAL_PRACTICES',
  'OTHERS',
] as const;
export type SolutionCategoryValue = (typeof SOLUTION_CATEGORIES)[number];
export const SOLUTION_CATEGORY_LABEL: Record<SolutionCategoryValue, string> = {
  PRECISION_FARMING: 'precision farming',
  ADVISORY: 'advisory',
  IRRIGATION: 'irrigation / micro-irrigation',
  PACKAGE_OF_PRACTICES: 'package of practices (including tech)',
  SCIENCE_BASED: 'science based solution',
  TRADITIONAL_PRACTICES: 'traditional practices',
  OTHERS: 'others',
};

export const APPLICATION_SOURCES = ['SEED', 'ZOHO_CRM', 'GOOGLE_FORM', 'MANUAL', 'SUPABASE'] as const;
export type ApplicationSourceValue = (typeof APPLICATION_SOURCES)[number];

export const STAGE_STATUSES = [
  'SUBMITTED',
  'SCREENING',
  'UNDER_REVIEW',
  'SHORTLISTED',
  'JURY_REVIEW',
  'FINALIST',
  'WINNER',
  'REJECTED',
  'WITHDRAWN',
] as const;
export type StageStatusValue = (typeof STAGE_STATUSES)[number];
export const STAGE_STATUS_LABEL: Record<StageStatusValue, string> = {
  SUBMITTED: 'submitted',
  SCREENING: 'screening',
  UNDER_REVIEW: 'under review',
  SHORTLISTED: 'shortlisted',
  JURY_REVIEW: 'jury review',
  FINALIST: 'finalist',
  WINNER: 'winner',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
};

export const DISPOSITIONS = ['STRONG_ADVANCE', 'ADVANCE', 'BORDERLINE', 'REJECT'] as const;
export type DispositionValue = (typeof DISPOSITIONS)[number];

export const REVIEW_RECOMMENDATIONS = ['ADVANCE', 'HOLD', 'REJECT'] as const;
export type ReviewRecommendationValue = (typeof REVIEW_RECOMMENDATIONS)[number];

export const JURY_VERDICTS = ['YES', 'MAYBE', 'NO'] as const;
export type JuryVerdictValue = (typeof JURY_VERDICTS)[number];

export const TARGET_STATUSES = ['NOT_APPLIED', 'APPLIED', 'CONTACTED'] as const;
export type TargetStatusValue = (typeof TARGET_STATUSES)[number];

export const OUTBOX_STATUSES = ['QUEUED', 'APPROVED', 'SENT', 'FAILED', 'SKIPPED'] as const;
export type OutboxStatusValue = (typeof OUTBOX_STATUSES)[number];

// admin call on whether an application should be treated as an internal pick — only
// applications marked YES here are passed through to jury review. ECOSYSTEM_PARTNER is a third,
// separate outcome for applications that don't make the challenge cut but are worth tracking as
// potential ecosystem partners (e.g. an academic/research institution or funder-adjacent org) —
// it's mutually exclusive with YES/NO, not a tag layered on top of one.
export const INTERNAL_DECISIONS = ['YES', 'NO', 'ECOSYSTEM_PARTNER'] as const;
export type InternalDecisionValue = (typeof INTERNAL_DECISIONS)[number];
export const INTERNAL_DECISION_LABEL: Record<InternalDecisionValue, string> = {
  YES: 'decision: yes',
  NO: 'decision: no',
  ECOSYSTEM_PARTNER: 'potential ecosystem partner',
};

export const VALUE_CHAIN_OPTIONS = [
  'Input',
  'Production/Farming',
  'Harvesting',
  'Post production (food processing, retail etc)',
  'GHG emissions & water measurement',
  'Research and Development',
];

export const BENEFICIARY_OPTIONS = ['Small and marginal farmers', 'Medium farmers', 'Large farmers'];

// --- rapid re.gen challenge (current cycle) -------------------------------------------------

export const YES_NO_INPROGRESS = ['YES', 'NO', 'IN_PROGRESS'] as const;
export type YesNoInProgressValue = (typeof YES_NO_INPROGRESS)[number];
export const YES_NO_INPROGRESS_LABEL: Record<YesNoInProgressValue, string> = {
  YES: 'yes',
  NO: 'no',
  IN_PROGRESS: 'in progress',
};

export const YES_NO = ['YES', 'NO'] as const;
export type YesNoValue = (typeof YES_NO)[number];

export const LEGAL_REGISTRATION_TYPES = [
  'SECTION_8_COMPANY',
  'TRUST',
  'SOCIETY',
  'PRIVATE_LIMITED',
  'LLP',
  'PARTNERSHIP',
  'SOLE_PROPRIETORSHIP',
  'OTHER',
] as const;
export type LegalRegistrationTypeValue = (typeof LEGAL_REGISTRATION_TYPES)[number];
export const LEGAL_REGISTRATION_TYPE_LABEL: Record<LegalRegistrationTypeValue, string> = {
  SECTION_8_COMPANY: 'section 8 company',
  TRUST: 'trust',
  SOCIETY: 'society',
  PRIVATE_LIMITED: 'private limited company',
  LLP: 'limited liability partnership',
  PARTNERSHIP: 'partnership',
  SOLE_PROPRIETORSHIP: 'sole proprietorship',
  OTHER: 'other',
};

export const ANNUAL_BUDGET_BANDS = ['UNDER_25L', 'L25_TO_1CR', 'CR1_TO_5', 'CR5_TO_25', 'ABOVE_25CR'] as const;
export type AnnualBudgetBandValue = (typeof ANNUAL_BUDGET_BANDS)[number];
export const ANNUAL_BUDGET_BAND_LABEL: Record<AnnualBudgetBandValue, string> = {
  UNDER_25L: 'under ₹25 lakh',
  L25_TO_1CR: '₹25 lakh - ₹1 crore',
  CR1_TO_5: '₹1 - 5 crore',
  CR5_TO_25: '₹5 - 25 crore',
  ABOVE_25CR: 'above ₹25 crore',
};

export const OPERATING_MODEL_ARCHETYPES = [
  'DIRECT_EXTENSION',
  'FPO_ENABLEMENT',
  'INPUT_SUPPLY_CHAIN',
  'MARKET_LINKAGE',
  'KNOWLEDGE_PARTNER',
  'TECH_DATA_PLATFORM',
  'HYBRID',
  'OTHER',
] as const;
export type OperatingModelArchetypeValue = (typeof OPERATING_MODEL_ARCHETYPES)[number];
export const OPERATING_MODEL_ARCHETYPE_LABEL: Record<OperatingModelArchetypeValue, string> = {
  DIRECT_EXTENSION: 'direct extension & training to farmers',
  FPO_ENABLEMENT: 'FPO / collective enablement',
  INPUT_SUPPLY_CHAIN: 'input / bio-input supply chain',
  MARKET_LINKAGE: 'market linkage & aggregation',
  KNOWLEDGE_PARTNER: 'knowledge / research partner to other implementers',
  TECH_DATA_PLATFORM: 'tech / data platform for the ecosystem',
  HYBRID: 'hybrid (primary + secondary archetype)',
  OTHER: 'other',
};

export const CROP_TYPES = ['CEREALS', 'OILSEEDS', 'PULSES', 'FRUITS_VEGETABLES', 'CASH_CROPS', 'OTHER'] as const;
export type CropTypeValue = (typeof CROP_TYPES)[number];
export const CROP_TYPE_LABEL: Record<CropTypeValue, string> = {
  CEREALS: 'cereals',
  OILSEEDS: 'oilseeds',
  PULSES: 'pulses',
  FRUITS_VEGETABLES: 'fruits & vegetables',
  CASH_CROPS: 'cash crops',
  OTHER: 'other',
};

export const REGEN_PRACTICES = [
  'SOIL_HEALTH',
  'EMISSIONS_CARBON',
  'WATERSHED_HEALTH',
  'BIODIVERSITY',
  'FARMER_LIVELIHOODS',
  'FARM_WORKER_SECURITY',
  'COVER_CROPPING',
  'REDUCED_TILL',
  'COMPOSTING_BIOINPUTS',
  'CROP_ROTATION',
] as const;
export type RegenPracticeValue = (typeof REGEN_PRACTICES)[number];
export const REGEN_PRACTICE_LABEL: Record<RegenPracticeValue, string> = {
  SOIL_HEALTH: 'building soil health and fertility',
  EMISSIONS_CARBON: 'reducing emissions and sequestering carbon',
  WATERSHED_HEALTH: 'improving watershed health',
  BIODIVERSITY: 'enhancing biodiversity',
  FARMER_LIVELIHOODS: 'improving farmer livelihoods (economic prosperity)',
  FARM_WORKER_SECURITY: 'farm and farm-worker security',
  COVER_CROPPING: 'cover cropping',
  REDUCED_TILL: 'reduced / no-till',
  COMPOSTING_BIOINPUTS: 'composting & bio-inputs',
  CROP_ROTATION: 'crop rotation & intercropping',
};

export const TECH_TOOLS = [
  'SPREADSHEETS',
  'CUSTOM_MIS',
  'CRM',
  'MOBILE_DATA_COLLECTION',
  'GIS_REMOTE_SENSING',
  'BI_TOOLS',
  'DOC_KNOWLEDGE_MGMT',
  'NONE',
  'OTHER',
] as const;
export type TechToolValue = (typeof TECH_TOOLS)[number];
export const TECH_TOOL_LABEL: Record<TechToolValue, string> = {
  SPREADSHEETS: 'spreadsheets (Excel / Google Sheets)',
  CUSTOM_MIS: 'custom MIS / dashboards',
  CRM: 'CRM (Salesforce, HubSpot, etc.)',
  MOBILE_DATA_COLLECTION: 'mobile data collection (CommCare / KoBo / ODK)',
  GIS_REMOTE_SENSING: 'GIS / remote sensing',
  BI_TOOLS: 'BI tools (Power BI / Tableau)',
  DOC_KNOWLEDGE_MGMT: 'document / knowledge management',
  NONE: 'none',
  OTHER: 'other',
};

export const MEL_HANDLING_OPTIONS = ['INTERNAL', 'EXTERNAL', 'BOTH'] as const;
export type MelHandlingValue = (typeof MEL_HANDLING_OPTIONS)[number];
export const MEL_HANDLING_LABEL: Record<MelHandlingValue, string> = {
  INTERNAL: 'internal (in-house team)',
  EXTERNAL: 'external (independent agency or consultant)',
  BOTH: 'both',
};

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry',
];

// legal-suffix noise stripped when fuzzy-matching org names against the target wishlist
export const ORG_SUFFIX_STOPWORDS = [
  'pvt ltd',
  'pvt. ltd.',
  'private limited',
  'limited',
  'ltd',
  'llp',
  'inc',
  'foundation',
  'technologies',
  'technology',
  'solutions',
  'agritech',
  'farms',
  'india',
];
