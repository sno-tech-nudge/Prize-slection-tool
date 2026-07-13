import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { listApplications } from '@/lib/applications/queries';
import { effectiveScore } from '@/lib/scoring/effective';

const ELIGIBILITY_FIELDS = ['fcraStatus', 'cert12A', 'cert80G', 'csr1Registration'] as const;

const COLUMNS = [
  'organisation',
  'poc name',
  'email',
  'phone',
  'review status',
  'decision status',
  'operating model',
  'farmers reached',
  'states',
  'eligibility answered',
  'AI composite',
  'reviewer',
  'submitted at',
] as const;

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
  );

  const rows = applications.map((app) => {
    const latestEval = app.aiEvaluations[0];
    const eligibilityAnswered = ELIGIBILITY_FIELDS.filter((f) => app[f] != null).length;
    return [
      app.orgName,
      `${app.pocFirstName} ${app.pocLastName}`,
      app.email,
      app.phone ?? '',
      app.humanReviews.length > 0 ? 'reviewed' : 'not reviewed',
      app.internalDecision === 'YES' ? 'yes' : app.internalDecision === 'NO' ? 'no' : 'undecided',
      app.operatingModelArchetype ?? app.solutionCategory ?? '',
      app.farmersCount ?? '',
      app.statesOperating ?? '',
      `${eligibilityAnswered}/${ELIGIBILITY_FIELDS.length}`,
      latestEval ? effectiveScore(latestEval).composite : '',
      app.reviewAssignments.map((r) => r.reviewer.name).join('; '),
      app.submittedAt.toISOString(),
    ];
  });

  const csv = [COLUMNS.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="applications-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
