import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { JURY_RUBRIC_CRITERIA } from '@/lib/scoring/juryRubric';
import { parseCriteria } from '@/lib/scoring/parse';

// no request-derived dynamic signal (no searchParams/cookies/headers read) — without this, Next
// tries to statically pre-render this route at build time and bake in a stale CSV snapshot.
export const dynamic = 'force-dynamic';

function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Per-juror jury scoring export — new, distinct from the main applications CSV export (which has
 *  no jury-score columns at all). One row per submitted jury score, not per application, so a
 *  bench with 3 jurors produces 3 rows for that organisation. */
export async function GET() {
  const scores = await prisma.juryScore.findMany({
    where: { application: { round1Decision: 'YES' } },
    orderBy: [{ application: { orgName: 'asc' } }, { juror: { name: 'asc' } }],
    include: {
      application: { select: { orgName: true, bench: { select: { name: true } } } },
      juror: { select: { name: true } },
    },
  });

  const headers = [
    'organisation',
    'bench',
    'juror',
    ...JURY_RUBRIC_CRITERIA.map((c) => c.label),
    'composite',
    'verdict',
    'comment',
  ];

  const rows = scores.map((s) => {
    const criteria = parseCriteria(s.criteria);
    const byKey = new Map(criteria.map((c) => [c.key, c]));
    return [
      s.application.orgName,
      s.application.bench?.name ?? '',
      s.juror.name,
      ...JURY_RUBRIC_CRITERIA.map((c) => byKey.get(c.key)?.score ?? ''),
      s.composite,
      s.verdict,
      s.comment ?? '',
    ];
  });

  const csv = [headers.join(','), ...rows.map((r) => r.map(csvCell).join(','))].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="round-2-jury-scoring-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
