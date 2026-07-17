'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_JURY_SCORE } from '@/lib/auth/guard';
import { prisma } from '@/lib/db';
import { RUBRIC_CRITERIA, computeComposite } from '@/lib/scoring/rubric';

export async function submitJuryScoreAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_JURY_SCORE);

  const applicationId = String(formData.get('applicationId'));
  const verdict = String(formData.get('verdict'));
  const comment = String(formData.get('comment') ?? '');

  const scoreMap: Record<string, number> = {};
  const criteria = RUBRIC_CRITERIA.map((c) => {
    const score = Number(formData.get(`criterion_${c.key}`) ?? 0);
    scoreMap[c.key] = score;
    return { key: c.key, score, rationale: '', evidence: '', confidence: 1 };
  });
  const composite = computeComposite(scoreMap);

  await prisma.juryScore.upsert({
    where: { applicationId_jurorId: { applicationId, jurorId: user.id } },
    create: { applicationId, jurorId: user.id, criteria: JSON.stringify(criteria), composite, verdict, comment },
    update: { criteria: JSON.stringify(criteria), composite, verdict, comment, submittedAt: new Date() },
  });

  revalidatePath(`/jury/${applicationId}`);
  revalidatePath('/jury');
}
