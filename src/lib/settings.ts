import { prisma } from '@/lib/db';
import { DEFAULT_RUBRIC_WEIGHTS } from '@/lib/scoring/rubric';

export interface DeltaSettings {
  rubricWeights: Record<string, number>;
  /** bumped automatically whenever rubricWeights actually change — snapshotted onto every
   *  AiEvaluation so historical scores stay interpretable after weights move later. */
  rubricVersion: number;
  shortlistSize: number;
  autoSendRejections: boolean;
  activeSource: 'seed' | 'zoho_crm' | 'google_form' | 'supabase';
}

const DEFAULTS: DeltaSettings = {
  rubricWeights: DEFAULT_RUBRIC_WEIGHTS,
  rubricVersion: 1,
  shortlistSize: Number(process.env.SHORTLIST_SIZE ?? 20),
  autoSendRejections: false,
  activeSource: (process.env.APPLICATION_SOURCE as DeltaSettings['activeSource']) ?? 'seed',
};

const SETTINGS_KEY = 'delta_settings';

export async function getSettings(): Promise<DeltaSettings> {
  const row = await prisma.setting.findUnique({ where: { key: SETTINGS_KEY } });
  if (!row) return DEFAULTS;
  try {
    return { ...DEFAULTS, ...JSON.parse(row.value) };
  } catch {
    return DEFAULTS;
  }
}

export async function updateSettings(patch: Partial<DeltaSettings>): Promise<DeltaSettings> {
  const current = await getSettings();
  const weightsChanged = patch.rubricWeights && JSON.stringify(patch.rubricWeights) !== JSON.stringify(current.rubricWeights);
  const next: DeltaSettings = {
    ...current,
    ...patch,
    rubricVersion: weightsChanged ? current.rubricVersion + 1 : current.rubricVersion,
  };
  await prisma.setting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  return next;
}
