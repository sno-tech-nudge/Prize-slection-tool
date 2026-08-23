import { prisma } from '@/lib/db';
import { VIEW_FIELDS } from './fieldRegistry';

export interface FieldVisibilityConfig {
  observer: Record<string, boolean>;
  jury: Record<string, boolean>;
}

const KEY = 'fieldVisibility';

function defaults(): FieldVisibilityConfig {
  const observer: Record<string, boolean> = {};
  const jury: Record<string, boolean> = {};
  for (const f of VIEW_FIELDS) {
    observer[f.key] = f.defaultObserver;
    jury[f.key] = f.defaultJury;
  }
  return { observer, jury };
}

/** Not yet read by any observer/jury-facing page — this is the admin-configurable source of
 *  truth for a future pass that wires it in. Missing keys (a field added to the registry after
 *  someone last saved) fall back to that field's own default rather than reading as hidden. */
export async function getFieldVisibility(): Promise<FieldVisibilityConfig> {
  const row = await prisma.setting.findUnique({ where: { key: KEY } });
  const base = defaults();
  if (!row) return base;
  try {
    const parsed = JSON.parse(row.value) as Partial<FieldVisibilityConfig>;
    return {
      observer: { ...base.observer, ...(parsed.observer ?? {}) },
      jury: { ...base.jury, ...(parsed.jury ?? {}) },
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
