'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_MANAGE_SETTINGS } from '@/lib/auth/guard';
import { updateSettings } from '@/lib/settings';

export async function updateSettingsAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  await updateSettings({
    autoSendRejections: formData.get('autoSendRejections') === 'on',
  });

  revalidatePath('/settings');
}
