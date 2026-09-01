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
    // fields with no jurySection have no rendering slot in jury's view at all — force false
    // regardless of the (absent) checkbox, so a stale/tampered form value can't set something
    // that would just silently do nothing anyway.
    jury[f.key] = f.jurySection ? formData.get(`jury_${f.key}`) === 'on' : false;
  }

  // the reorder buttons keep the current order in a hidden input, comma-separated — same
  // "just a form field" approach as everything else here, no extra client/server plumbing.
  const observerSectionOrder = String(formData.get('observerSectionOrder') ?? '').split(',').filter(Boolean);
  const jurySectionOrder = String(formData.get('jurySectionOrder') ?? '').split(',').filter(Boolean);

  await updateFieldVisibility({ observer, jury, observerSectionOrder, jurySectionOrder });
  revalidatePath('/settings/view');
  revalidatePath('/applications');
}
