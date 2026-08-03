import { prisma } from '@/lib/db';

export interface EmailTemplate {
  subject: string;
  body: string;
}

/** The query-outreach template also carries a link to the additional-information form (tally.so)
 *  — not sent as its own field, substituted into the body via {{formLink}} same as the other
 *  tokens, but kept structured here so the settings UI can show it as its own input. */
export interface QueryEmailTemplate extends EmailTemplate {
  formLink: string;
}

export interface DeltaSettings {
  /** snapshotted onto every AiEvaluation so historical scores stay interpretable if the rubric
   *  itself is ever replaced again later. */
  rubricVersion: number;
  shortlistSize: number;
  autoSendRejections: boolean;
  activeSource: 'seed' | 'zoho_crm' | 'google_form' | 'supabase';
  emailTemplateAcceptance: EmailTemplate;
  emailTemplateRejection: EmailTemplate;
  emailTemplateQuery: QueryEmailTemplate;
}

const DEFAULTS: DeltaSettings = {
  rubricVersion: 3,
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
  emailTemplateQuery: {
    subject: 'a quick follow-up on your application — {{challengeName}}',
    body: 'dear {{pocFirstName}},\n\nthank you for applying to {{challengeName}} on behalf of {{orgName}}. as we review your application, we need a little more information before we can move forward.\n\ncould you share a few additional details using the short form below?\n\n{{formLink}}\n\nwith thanks,\nthe^delta prize team',
    formLink: 'https://tally.so/r/q4XYpk',
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
  const next: DeltaSettings = { ...current, ...patch };
  await prisma.setting.upsert({
    where: { key: SETTINGS_KEY },
    create: { key: SETTINGS_KEY, value: JSON.stringify(next) },
    update: { value: JSON.stringify(next) },
  });
  return next;
}
