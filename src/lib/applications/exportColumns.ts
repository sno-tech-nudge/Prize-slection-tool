/** Shared between the export dialog (client, for checkbox labels) and the export API route
 *  (server, for the actual cell values) — keeps the column list in one place. */
export interface ExportColumnDef {
  id: string;
  label: string;
  defaultOn: boolean;
}

export const EXPORT_COLUMNS: ExportColumnDef[] = [
  { id: 'organisation', label: 'organisation', defaultOn: true },
  { id: 'registrationType', label: 'registration type', defaultOn: true },
  { id: 'pocName', label: 'poc name', defaultOn: true },
  { id: 'email', label: 'email', defaultOn: true },
  { id: 'phone', label: 'phone', defaultOn: true },
  { id: 'website', label: 'website', defaultOn: false },
  { id: 'linkedin', label: 'linkedin', defaultOn: false },
  { id: 'founders', label: 'founders', defaultOn: false },
  { id: 'reviewStatus', label: 'review status', defaultOn: true },
  { id: 'decisionStatus', label: 'decision status', defaultOn: true },
  { id: 'operatingModel', label: 'operating model', defaultOn: true },
  { id: 'states', label: 'states', defaultOn: true },
  { id: 'annualBudget', label: 'annual operating budget', defaultOn: false },
  { id: 'yearsExperience', label: 'years experience', defaultOn: false },
  { id: 'eligibility', label: 'eligibility', defaultOn: true },
  { id: 'eligibilityIssues', label: 'eligibility issues', defaultOn: true },
  { id: 'aiComposite', label: 'AI composite', defaultOn: true },
  { id: 'reviewer', label: 'reviewer', defaultOn: true },
  { id: 'submittedAt', label: 'submitted at', defaultOn: true },
  { id: 'comments', label: 'comments', defaultOn: false },
];
