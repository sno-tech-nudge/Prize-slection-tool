import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { listApplications, type ApplicationExportRow } from '@/lib/applications/queries';
import { EXPORT_COLUMNS } from '@/lib/applications/exportColumns';
import { effectiveScore } from '@/lib/scoring/effective';
import { evaluateEligibility } from '@/lib/scoring/eligibility';
import { LEGAL_REGISTRATION_TYPE_LABEL, type LegalRegistrationTypeValue } from '@/lib/constants';

type ExportRow = ApplicationExportRow;

const CELL_GETTERS: Record<string, (app: ExportRow) => unknown> = {
  organisation: (app) => app.orgName,
  registrationType: (app) =>
    app.legalRegistrationType
      ? (LEGAL_REGISTRATION_TYPE_LABEL[app.legalRegistrationType as LegalRegistrationTypeValue] ?? app.legalRegistrationType)
      : '',
  pocName: (app) => `${app.pocFirstName} ${app.pocLastName}`,
  email: (app) => app.email,
  phone: (app) => app.phone ?? '',
  website: (app) => app.website ?? '',
  linkedin: (app) => app.linkedinUrl ?? '',
  founders: (app) => app.founders.map((f) => f.fullName).join('; '),
  reviewStatus: (app) => (app.humanReviews.length > 0 ? 'reviewed' : 'not reviewed'),
  decisionStatus: (app) => (app.internalDecision === 'YES' ? 'yes' : app.internalDecision === 'NO' ? 'no' : 'undecided'),
  operatingModel: (app) => app.operatingModelArchetype ?? app.solutionCategory ?? '',
  states: (app) => app.statesOperating ?? '',
  annualBudget: (app) => app.annualOperatingBudget ?? '',
  yearsExperience: (app) => app.yearsExperience ?? '',
  eligibility: (app) => (evaluateEligibility(app).eligible ? 'eligible' : 'ineligible'),
  eligibilityIssues: (app) => evaluateEligibility(app).failedReasons.join('; '),
  humanComposite: (app) =>
    app.humanReviews.length > 0
      ? Math.round(app.humanReviews.reduce((sum, r) => sum + r.composite, 0) / app.humanReviews.length)
      : '',
  aiComposite: (app) => (app.aiEvaluations[0] ? effectiveScore(app.aiEvaluations[0]).composite : ''),
  reviewer: (app) => app.reviewAssignments.map((r) => r.reviewer.name).join('; '),
  submittedAt: (app) => app.submittedAt.toISOString(),
  comments: (app) => app.comments.map((c) => `${c.author.name}: ${c.body}`).join(' | '),
};

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

  const requestedFields = params.get('fields');
  const fieldIds = requestedFields
    ? requestedFields.split(',').filter((id) => id in CELL_GETTERS)
    : EXPORT_COLUMNS.filter((c) => c.defaultOn).map((c) => c.id);
  const columns = fieldIds.length > 0 ? fieldIds : EXPORT_COLUMNS.filter((c) => c.defaultOn).map((c) => c.id);
  const headers = columns.map((id) => EXPORT_COLUMNS.find((c) => c.id === id)?.label ?? id);

  const rows = applications.map((app) => columns.map((id) => CELL_GETTERS[id](app)));

  const csv = [headers.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="applications-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
