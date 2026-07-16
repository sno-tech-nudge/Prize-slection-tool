/**
 * Level 1 eligibility screening — the tech team's rule sheet: "all those who apply have to be
 * screened for this". These are hard reject rules (not scoring signals), evaluated straight off
 * stored application data. Distinct from the "eligibility answered" completeness count used
 * elsewhere (ELIGIBILITY_FIELDS in ApplicationRow.tsx etc.) — that just checks whether the 4
 * registration questions were answered at all; this checks whether the *answers* actually pass.
 */

// legal registration types that fail eligibility outright, per the rule sheet — matched
// case-insensitively against the free-text value Supabase sends (not a normalised enum key).
const DISQUALIFYING_LEGAL_TYPES = [
  'farmer producer company',
  'private limited company',
  'llp',
  'farmer producer organisation',
  'farmer producer organization',
];

interface EligibilityInput {
  legalRegistrationType: string | null;
  cert12A: string | null;
  cert80G: string | null;
  csr1Registration: string | null;
  darpanRegistered: string | null;
  orgName: string;
  pocFirstName: string;
  pocLastName: string;
  designation: string | null;
  phone: string | null;
  email: string;
  website: string | null;
  linkedinUrl: string | null;
  founders: { fullName: string; email: string | null; linkedin: string | null }[];
}

export interface EligibilityResult {
  eligible: boolean;
  failedReasons: string[];
  /** identity fields that are missing — can't be auto-verified as "real", only presence-checked;
   *  a human still has to judge whether the org/founder are genuine and the form wasn't a joke. */
  identityGaps: string[];
}

function isNo(raw: string | null): boolean {
  return (raw ?? '').trim().toUpperCase() === 'NO';
}

export function evaluateEligibility(app: EligibilityInput): EligibilityResult {
  const failedReasons: string[] = [];

  const legalType = (app.legalRegistrationType ?? '').trim().toLowerCase();
  if (legalType && DISQUALIFYING_LEGAL_TYPES.includes(legalType)) {
    failedReasons.push(`legal registration type "${app.legalRegistrationType}" is not eligible`);
  }

  if (isNo(app.cert12A)) failedReasons.push('no 12A certificate');
  if (isNo(app.cert80G)) failedReasons.push('no 80G certificate');
  if (isNo(app.csr1Registration)) failedReasons.push('no CSR-1 registration');
  if (isNo(app.darpanRegistered)) failedReasons.push('no NITI Aayog / DARPAN ID');

  const identityGaps: string[] = [];
  if (!app.orgName.trim()) identityGaps.push('organisation name');
  if (!app.pocFirstName.trim() || !app.pocLastName.trim()) identityGaps.push('applicant name');
  if (!app.designation) identityGaps.push('applicant designation');
  if (!app.phone) identityGaps.push('contact number');
  if (!app.email.trim()) identityGaps.push('applicant email');
  if (!app.website) identityGaps.push('organisation website');
  if (!app.linkedinUrl) identityGaps.push('organisation LinkedIn');
  if (app.founders.length === 0) identityGaps.push('founder details');
  else {
    const founder = app.founders[0];
    if (!founder.email) identityGaps.push('founder email');
    if (!founder.linkedin) identityGaps.push('founder LinkedIn');
  }

  if (identityGaps.length > 0) {
    failedReasons.push(`missing identity fields: ${identityGaps.join(', ')}`);
  }

  return { eligible: failedReasons.length === 0, failedReasons, identityGaps };
}
