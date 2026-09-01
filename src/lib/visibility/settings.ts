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
 *  has — so a stale/partial order never hides or loses a section. */
function reconcileOrder(stored: string[] | undefined, registryKeys: string[]): string[] {
  const known = new Set(registryKeys);
  const kept = (stored ?? []).filter((k) => known.has(k));
  const missing = registryKeys.filter((k) => !kept.includes(k));
  return [...kept, ...missing];
}

/** The admin-configurable source of truth for which fields observer/jury see, and in what
 *  section order — read by ApplicationMainContent.tsx (both the shared admin/reviewer/observer
 *  tree and JuryApplicationView) on every application-detail render. Missing keys (a field/
 *  section added to the registry after someone last saved) fall back to that item's own default
 *  rather than reading as hidden or falling off the end of the order. */
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
