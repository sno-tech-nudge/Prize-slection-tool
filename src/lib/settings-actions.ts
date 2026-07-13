'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_MANAGE_SETTINGS } from '@/lib/auth/guard';
import { updateSettings } from '@/lib/settings';
import { RUBRIC_CRITERIA } from '@/lib/scoring/rubric';

export async function updateSettingsAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const rubricWeights = Object.fromEntries(
    RUBRIC_CRITERIA.map((c) => [c.key, Number(formData.get(`weight_${c.key}`) ?? 1)]),
  );

  await updateSettings({
    rubricWeights,
    shortlistSize: Number(formData.get('shortlistSize') ?? 20),
    autoSendRejections: formData.get('autoSendRejections') === 'on',
    activeSource: formData.get('activeSource') as 'seed' | 'zoho_crm' | 'google_form',
  });

  revalidatePath('/settings');
}
