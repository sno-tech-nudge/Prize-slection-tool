'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/session';
import { assertRole, CAN_MANAGE_SETTINGS } from '@/lib/auth/guard';
import { updateFieldVisibility } from './settings';
import { VIEW_FIELDS } from './fieldRegistry';

export async function updateFieldVisibilityAction(formData: FormData) {
  const user = await getCurrentUser();
  assertRole(user, CAN_MANAGE_SETTINGS);

  const observer: Record<string, boolean> = {};
  const jury: Record<string, boolean> = {};
  for (const f of VIEW_FIELDS) {
    observer[f.key] = formData.get(`observer_${f.key}`) === 'on';
    jury[f.key] = formData.get(`jury_${f.key}`) === 'on';
  }

  await updateFieldVisibility({ observer, jury });
  revalidatePath('/settings/view');
}
