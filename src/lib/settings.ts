import { prisma } from '@/lib/db';
import { DEFAULT_RUBRIC_WEIGHTS } from '@/lib/scoring/rubric';

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface DeltaSettings {
  rubricWeights: Record<string, number>;
  /** bumped automatically whenever rubricWeights actually change — snapshotted onto every
   *  AiEvaluation so historical scores stay interpretable after weights move later. */
  rubricVersion: number;
  shortlistSize: number;
  autoSendRejections: boolean;
  activeSource: 'seed' | 'zoho_crm' | 'google_form' | 'supabase';
  emailTemplateAcceptance: EmailTemplate;
  emailTemplateRejection: EmailTemplate;
}

const DEFAULTS: DeltaSettings = {
  rubricWeights: DEFAULT_RUBRIC_WEIGHTS,
  rubricVersion: 1,
  shortlistSize: Number(process.env.SHORTLIST_SIZE ?? 20),
  autoSendRejections: false,
  activeSource: (process.env.APPLICATION_SOURCE as DeltaSettings['activeSource']) ?? 'seed',
  emailTemplateAcceptance: {
    subject: 'you have been accepted — {{challengeName}}',
    body: 'dear {{pocFirstName}},\n\ncongratulations — {{orgName}} has been accepted for {{challengeName}}. we were impressed by your application and look forward to the next steps.\n\nour team will be in touch shortly with more details.\n\nwith thanks,\nthe^delta prize team',
  },
  emailTemplateRejection: {
    subject: 'an update on your application — {{challengeName}}',
    body: 'dear {{pocFirstName}},\n\nthank you for taking the time to apply to {{challengeName}} on behalf of {{orgName}}, and for the work that went into your submission.\n\nafter careful review, we will not be advancing your application this cycle. we received a strong pool of applications, and this decision reflects fit against this specific challenge, not the merit of your work.\n\nwith thanks,\nthe^delta prize team',
  },
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
