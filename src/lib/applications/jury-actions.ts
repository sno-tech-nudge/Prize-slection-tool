'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_JURY_SCORE } from '@/lib/auth/guard';
import { prisma } from '@/lib/db';
import { JURY_RUBRIC_CRITERIA, computeJuryComposite } from '@/lib/scoring/juryRubric';

export async function submitJuryScoreAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_JURY_SCORE);

  const applicationId = String(formData.get('applicationId'));
  const verdict = String(formData.get('verdict')) === 'YES' ? 'YES' : 'NO';
  // the "winning model" free text only makes sense alongside a YES verdict — the form itself
  // only renders the field when YES is selected, so a NO submission always saves it empty.
  const comment = verdict === 'YES' ? String(formData.get('comment') ?? '') : '';

  // a blank score input submits as an empty string, and Number('') is silently 0 — with no check
  // here, a score missing several criteria (e.g. reopened after a rubric change replaced most
  // criterion keys, so most fields reload blank) would save a badly deflated composite with zero
  // indication anything was wrong. Reject incomplete submissions outright instead.
  const missing = JURY_RUBRIC_CRITERIA.filter((c) => String(formData.get(`criterion_${c.key}_score`) ?? '').trim() === '');
  if (missing.length > 0) {
    throw new Error(`Score every criterion before submitting — missing: ${missing.map((c) => c.label).join(', ')}.`);
  }

  const scoreMap: Record<string, number> = {};
  const criteria = JURY_RUBRIC_CRITERIA.map((c) => {
    const score = Number(formData.get(`criterion_${c.key}_score`) ?? 0);
    scoreMap[c.key] = score;
    const criterionComment = String(formData.get(`criterion_${c.key}_comment`) ?? '');
    return { key: c.key, score, rationale: '', evidence: '', confidence: 1, comment: criterionComment };
  });
  const composite = computeJuryComposite(scoreMap);

  await prisma.juryScore.upsert({
    where: { applicationId_jurorId: { applicationId, jurorId: user.id } },
    create: { applicationId, jurorId: user.id, criteria: JSON.stringify(criteria), composite, verdict, comment },
    update: { criteria: JSON.stringify(criteria), composite, verdict, comment, submittedAt: new Date() },
  });

  revalidatePath(`/jury/${applicationId}`);
  revalidatePath('/jury');
}
