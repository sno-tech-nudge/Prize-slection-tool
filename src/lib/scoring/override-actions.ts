'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_MANAGE_SETTINGS } from '@/lib/auth/guard';
import { prisma } from '@/lib/db';
import { DISPOSITIONS } from '@/lib/constants';

/** An admin's explicit correction to the AI's own record — distinct from a HumanReview, which is
 *  a separate reviewer's independent score. AI is decision support; this is the human overruling
 *  it directly, with a reason recorded for the audit trail. */
export async function overrideAiEvaluationAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const evaluationId = String(formData.get('evaluationId'));
  const applicationId = String(formData.get('applicationId'));
  const overrideComposite = Number(formData.get('overrideComposite'));
  const overrideDisposition = String(formData.get('overrideDisposition'));
  const overrideReason = String(formData.get('overrideReason') ?? '');

  if (!DISPOSITIONS.includes(overrideDisposition as (typeof DISPOSITIONS)[number])) {
    throw new Error('invalid disposition');
  }
  if (Number.isNaN(overrideComposite) || overrideComposite < 0 || overrideComposite > 100) {
    throw new Error('override composite must be between 0 and 100');
  }

  await prisma.aiEvaluation.update({
    where: { id: evaluationId },
    data: {
      overrideComposite,
      overrideDisposition,
      overrideReason,
      overriddenById: user.id,
      overriddenAt: new Date(),
    },
  });

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath('/applications');
  revalidatePath('/dashboard');
}

export async function clearAiOverrideAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const evaluationId = String(formData.get('evaluationId'));
  const applicationId = String(formData.get('applicationId'));

  await prisma.aiEvaluation.update({
    where: { id: evaluationId },
    data: { overrideComposite: null, overrideDisposition: null, overrideReason: null, overriddenById: null, overriddenAt: null },
  });

  revalidatePath(`/applications/${applicationId}`);
  revalidatePath('/applications');
  revalidatePath('/dashboard');
}
