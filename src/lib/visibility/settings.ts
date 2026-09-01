import { prisma } from '@/lib/db';
import { VIEW_FIELDS, VIEW_SECTIONS } from './fieldRegistry';

export interface FieldVisibilityConfig {
  observer: Record<string, boolean>;
  jury: Record<string, boolean>;
  /** a permutation of VIEW_SECTIONS' keys, independently for each role — missing or unknown keys
   *  fall back to registry order, same "never read as broken" philosophy as the visibility maps. */
  observerSectionOrder: string[];
  jurySectionOrder: string[];
}

const KEY = 'fieldVisibility';

function defaults(): FieldVisibilityConfig {
  const observer: Record<string, boolean> = {};
  const jury: Record<string, boolean> = {};
  for (const f of VIEW_FIELDS) {
    observer[f.key] = f.defaultObserver;
    jury[f.key] = f.defaultJury;
  }
  return {
    observer,
    jury,
    observerSectionOrder: VIEW_SECTIONS.map((s) => s.key),
    jurySectionOrder: VIEW_SECTIONS.map((s) => s.key),
  };
}

/** Reconciles a stored order against the registry's current key set: keeps the stored order for
 *  keys that still exist, appends any new registry keys the stored order doesn't know about yet
 *  (a section added after someone last saved), and drops any stored keys the registry no longer
 *  has — so a stale/partial order never hides or loses a section.
 *
 *  If the registry's shape changed enough that barely any stored keys still match (e.g. jury went
 *  from its own small closed section list to the full admin/reviewer section list), a partial
 *  reconcile does more harm than good — a single surviving key can land first (or last) by pure
 *  accident of old ordering, not by anyone's actual intent. Below a 50% overlap, treat the stored
 *  order as stale and start clean from natural registry order instead. */
function reconcileOrder(stored: string[] | undefined, registryKeys: string[]): string[] {
  const known = new Set(registryKeys);
  const kept = (stored ?? []).filter((k) => known.has(k));
  if (kept.length < registryKeys.length / 2) return [...registryKeys];
  const missing = registryKeys.filter((k) => !kept.includes(k));
  return [...kept, ...missing];
}

/** The admin-configurable source of truth for which fields observer/jury see, and in what
 *  section order — read by ApplicationMainContent.tsx on every application-detail render, for
 *  every role. Missing keys (a field/section added to the registry after someone last saved)
 *  fall back to that item's own default rather than reading as hidden or falling off the order. */
export async function getFieldVisibility(): Promise<FieldVisibilityConfig> {
  const row = await prisma.setting.findUnique({ where: { key: KEY } });
  const base = defaults();
  if (!row) return base;
  try {
    const parsed = JSON.parse(row.value) as Partial<FieldVisibilityConfig>;
    return {
      observer: { ...base.observer, ...(parsed.observer ?? {}) },
      jury: { ...base.jury, ...(parsed.jury ?? {}) },
      observerSectionOrder: reconcileOrder(parsed.observerSectionOrder, base.observerSectionOrder),
      jurySectionOrder: reconcileOrder(parsed.jurySectionOrder, base.jurySectionOrder),
    };
  } catch {
    return base;
  }
}

export async function updateFieldVisibility(next: FieldVisibilityConfig): Promise<void> {
  await prisma.setting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
}
