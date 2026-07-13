import type {
  FocusLevelValue,
  NormalizedStageValue,
  OrgTypeValue,
  SolutionCategoryValue,
  TeamSizeValue,
} from '@/lib/constants';

/** A record exactly as it arrives from the upstream source, before mapping. */
export interface RawApplication {
  sourceRowId: string;
  raw: Record<string, unknown>;
}

/** Our normalized shape, ready for `prisma.application.create`. */
export interface ApplicationInput {
  externalId?: string;
  orgName: string;
  pocFirstName: string;
  pocLastName: string;
  email: string;
  phone?: string;
  designation?: string;
  website?: string;
  incorporationDate?: Date;
  location?: string;
  orgType: OrgTypeValue;
  stageRaw?: string;
  stageNormalized: NormalizedStageValue;
  problemAddressing?: string;
  valueChainFocus?: string;
  beneficiaries?: string;
  smallMarginalFarmerPct?: number;
  areaHectaresRaw?: string;
  areaHectaresParsed?: number;
  aboutSolution?: string;
  solutionCategory: SolutionCategoryValue;
  trl?: number;
  waterEfficiencyFocus?: FocusLevelValue;
  waterEfficiencyEstimate?: string;
  cropProductionFocus?: FocusLevelValue;
  focusCrops?: string;
  teamSize?: TeamSizeValue;
  founders: { fullName: string; role?: string; linkedin?: string }[];
  pitchDeckUrl?: string;
  historicallyShortlisted: boolean;
  duplicateOfOrgKey?: string;
  submittedAt?: Date;
}

export interface WriteBack {
  stageStatus?: string;
  aiComposite?: number;
}

/**
 * Pluggable ingestion source. `SeedSource` (historical workbook import) is
 * the only implementation wired up today. `ZohoCrmSource` / `GoogleFormSource`
 * are documented stubs — see src/lib/sources/zoho-crm-source.ts.
 */
export interface ApplicationSource {
  name: 'seed' | 'zoho_crm' | 'google_form';
  pull(): Promise<RawApplication[]>;
  toApplication(raw: RawApplication): ApplicationInput;
  writeBack?(appId: string, patch: WriteBack): Promise<void>;
}
