import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { listApplications, type ApplicationExportRow } from '@/lib/applications/queries';
import { EXPORT_COLUMNS } from '@/lib/applications/exportColumns';
import { evaluateEligibility } from '@/lib/scoring/eligibility';
import { LEGAL_REGISTRATION_TYPE_LABEL, type LegalRegistrationTypeValue } from '@/lib/constants';

type ExportRow = ApplicationExportRow;

// explicit getters for columns that need formatting, joining a relation, or combining fields —
// anything not listed here falls back to a plain scalar read of the same-named Application
// field (see `genericCell` below), which covers the bulk of the "every form field" full dump.
const CELL_GETTERS: Record<string, (app: ExportRow) => unknown> = {
  organisation: (app) => app.orgName,
  registrationType: (app) =>
    app.legalRegistrationType
      ? (LEGAL_REGISTRATION_TYPE_LABEL[app.legalRegistrationType as LegalRegistrationTypeValue] ?? app.legalRegistrationType)
      : '',
  pocName: (app) => `${app.pocFirstName} ${app.pocLastName}`,
  linkedin: (app) => app.linkedinUrl ?? '',
  founders: (app) => app.founders.map((f) => f.fullName).join('; '),
  founderEmails: (app) => app.founders.map((f) => f.email).filter(Boolean).join('; '),
  founderLinkedins: (app) => app.founders.map((f) => f.linkedin).filter(Boolean).join('; '),
  funders: (app) => app.funders.map((f) => f.name).join('; '),
  techUseCases: (app) => app.techUseCases.map((t) => t.description).join('; '),
  reportLinks: (app) => app.reportLinks.map((r) => r.url).join('; '),
  bench: (app) => app.bench?.name ?? '',
  targetMatch: (app) => app.targetMatch?.name ?? '',
  reviewStatus: (app) => (app.humanReviews.length > 0 ? 'reviewed' : 'not reviewed'),
  decisionStatus: (app) => (app.internalDecision === 'YES' ? 'yes' : app.internalDecision === 'NO' ? 'no' : 'undecided'),
  operatingModel: (app) => app.operatingModelArchetype ?? app.solutionCategory ?? '',
  states: (app) => app.statesOperating ?? '',
  annualBudget: (app) => app.annualOperatingBudget ?? '',
  eligibility: (app) => (evaluateEligibility(app).eligible ? 'eligible' : 'ineligible'),
  eligibilityIssues: (app) => evaluateEligibility(app).failedReasons.join('; '),
  humanComposite: (app) =>
    app.humanReviews.length > 0
      ? Math.round(app.humanReviews.reduce((sum, r) => sum + r.composite, 0) / app.humanReviews.length)
      : '',
  aiComposite: (app) => (app.aiEvaluations[0] ? app.aiEvaluations[0].composite : ''),
  reviewer: (app) => app.reviewAssignments.map((r) => r.reviewer.name).join('; '),
  submittedAt: (app) => app.submittedAt.toISOString(),
  comments: (app) => app.comments.map((c) => `${c.author.name}: ${c.body}`).join(' | '),
};

// plain-scalar fallback for every "every form field" full-dump column — reads the Application
// field of the same name and formats dates/booleans/null sensibly, so adding a new scalar to
// exportColumns.ts doesn't also require a hand-written getter here.
function genericCell(app: ExportRow, field: string): unknown {
  const value = (app as unknown as Record<string, unknown>)[field];
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toLocaleDateString('en-GB');
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  return value;
}

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  const params = request.nextUrl.searchParams;
  const applications = await listApplications(
    {
      reviewed: params.get('reviewed') ?? undefined,
      category: params.get('category') ?? undefined,
      q: params.get('q') ?? undefined,
      internal: params.get('internal') ?? undefined,
    },
    user,
    true,
  );

  const knownIds = new Set(EXPORT_COLUMNS.map((c) => c.id));
  const requestedFields = params.get('fields');
  const fieldIds = requestedFields
    ? requestedFields.split(',').filter((id) => knownIds.has(id))
    : EXPORT_COLUMNS.filter((c) => c.defaultOn).map((c) => c.id);
  const columns = fieldIds.length > 0 ? fieldIds : EXPORT_COLUMNS.filter((c) => c.defaultOn).map((c) => c.id);
  const headers = columns.map((id) => EXPORT_COLUMNS.find((c) => c.id === id)?.label ?? id);

  const rows = applications.map((app) => columns.map((id) => (CELL_GETTERS[id] ? CELL_GETTERS[id](app) : genericCell(app, id))));

  const csv = [headers.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="applications-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
