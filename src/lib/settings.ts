import { prisma } from '@/lib/db';

export interface EmailTemplate {
  subject: string;
  body: string;
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
  emailTemplateQuery: EmailTemplate;
}

const DEFAULTS: DeltaSettings = {
  rubricVersion: 3,
  shortlistSize: Number(process.env.SHORTLIST_SIZE ?? 20),
  autoSendRejections: false,
  activeSource: (process.env.APPLICATION_SOURCE as DeltaSettings['activeSource']) ?? 'seed',
  emailTemplateAcceptance: {
    subject: 'Congratulations | rapid re.gen challenge - You have advanced to the next stage',
    body: [
      'Dear {{pocFirstName}},',
      'Congratulations. {{orgName}} has been selected to advance to the next stage of the rapid re.gen challenge selection process.',
      '{{orgName}} is one of the top 45 organisations selected from a pool of 341 applications (~13%) to move forward to the jury round.',
      'The first stage involved a rigorous review of your organisational and model strength, regenerative agriculture expertise, evidence of impact, scientific and technical capabilities, scalability, technology, and farmer adoption potential.',
      'The next stage will be an in-depth interview with a jury bench, who will engage with your leadership team to evaluate your farmer transition model, scientific breakthrough potential, scale and precision capabilities, farmer economics, and ecosystem leverage.',
      'Following the jury round, 15 organisations will progress to field validation in October, after which ~10 organisations will be selected for the rapid re.gen challenge cohort.',
      'As a Grand Challenge, cohort selection does not unlock the main Prize fund. Cohort organisations will receive a support grant of approximately ₹20–30 lakh. The larger Prize fund will be awarded at later stages, with the final Prize awarded in 2028 to the winner and up to two runner-ups based on demonstrated performance against the Challenge thresholds.',
      'At the heart of the rapid re.gen challenge is a national ambition: to surface models that can demonstrate a credible, replicable pathway to a soil-health breakthrough in India, while creating sustained value for smallholder farmers.',
      'We are glad to have your organisation as part of this next stage.',
      'We will soon share your interview slot, jury bench details, and deck guidance.',
      'For now, kindly keep 2-4 September available. Your 45-minute jury round will take place between 9:00 AM–12:00 PM or 2:00–5:00 PM. We will confirm your exact slot by Wednesday afternoon.',
      'Kindly reply to confirm your participation in the jury round. If you have any questions in the meantime, please feel free to reach out to Nisha or me.',
      'Warmly,\nSravya\nSr Associate\nthe^delta prize',
    ].join('\n\n'),
  },
  emailTemplateRejection: {
    subject: 'an update on your application — {{challengeName}}',
    body: 'dear {{pocFirstName}},\n\nthank you for taking the time to apply to {{challengeName}} on behalf of {{orgName}}, and for the work that went into your submission.\n\nafter careful review, we will not be advancing your application this cycle. we received a strong pool of applications, and this decision reflects fit against this specific challenge, not the merit of your work.\n\nwith thanks,\nthe^delta prize team',
  },
  emailTemplateQuery: {
    subject: 'a quick follow-up on your application — {{challengeName}}',
    body: 'dear {{pocFirstName}},\n\nthank you for applying to {{challengeName}} on behalf of {{orgName}}. as we review your application, we need a little more information before we can move forward — could you reply to this email with the additional details?\n\nwith thanks,\nthe^delta prize team',
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
