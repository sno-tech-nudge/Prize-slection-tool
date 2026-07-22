import { prisma } from '@/lib/db';
import { ORG_VALIDATION_VERDICTS, type OrgValidationVerdictValue } from '@/lib/constants';
import {
  OPERATING_MODEL_SYSTEM_PROMPT,
  FUNDERS_SYSTEM_PROMPT,
  FOUNDER_EXPERTISE_SYSTEM_PROMPT,
  buildOperatingModelPrompt,
  buildFundersPrompt,
  buildFounderExpertisePrompt,
  type ApplicationForValidation,
} from './prompt';

// groq/compound is Groq's agentic model with a built-in web-search tool — this IS the scraper.
// No separate search API key is configured or required for this feature.
const GROQ_COMPOUND_MODEL = process.env.GROQ_COMPOUND_MODEL || 'groq/compound';

interface ValidationSection {
  verdict: OrgValidationVerdictValue;
  summary: string;
  raw: string;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : trimmed;
  return JSON.parse(candidate);
}

function isValidSection(v: unknown): v is ValidationSection {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  return (
    typeof s.summary === 'string' &&
    typeof s.raw === 'string' &&
    typeof s.verdict === 'string' &&
    (ORG_VALIDATION_VERDICTS as readonly string[]).includes(s.verdict)
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Web-search tool calls run considerably longer than a plain scoring completion, so this uses a
 *  longer per-attempt timeout and fewer retries than scoring/runner.ts's groqRequest — a stuck
 *  request should fail fast into a stored error rather than hold a reviewer's click open for
 *  minutes across a long 429 backoff chain. */
async function groqCompoundRequest(body: unknown, maxRetries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (res.status !== 429 || attempt === maxRetries) return res;
      const text = await res.text();
      const match = text.match(/try again in ([\d.]+)s/i);
      const waitSeconds = match ? Number(match[1]) : 15;
      await sleep(Math.ceil(waitSeconds * 1000) + 1000);
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error('unreachable');
}

async function callGroqCompoundSection(systemPrompt: string, userPrompt: string): Promise<ValidationSection> {
  async function attempt(extra?: string): Promise<ValidationSection> {
    const res = await groqCompoundRequest({
      model: GROQ_COMPOUND_MODEL,
      max_tokens: 1200,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: extra ? `${userPrompt}\n\n${extra}` : userPrompt },
      ],
    });
    if (!res.ok) throw new Error(`Groq API responded ${res.status}: ${(await res.text()).slice(0, 500)}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    const parsed = extractJson(text);
    if (!isValidSection(parsed)) throw new Error('Model response failed JSON contract validation.');
    return parsed;
  }

  try {
    return await attempt();
  } catch {
    // one retry, reminding the model to emit strictly valid JSON matching the schema
    return attempt('Your previous response was not valid JSON matching the required schema. Respond with ONLY the JSON object, no other text, no markdown fences.');
  }
}

type SectionKey = 'opModel' | 'funders' | 'founder';

const SECTION_CONFIG: Record<
  SectionKey,
  { systemPrompt: string; buildPrompt: (app: ApplicationForValidation) => string }
> = {
  opModel: { systemPrompt: OPERATING_MODEL_SYSTEM_PROMPT, buildPrompt: buildOperatingModelPrompt },
  funders: { systemPrompt: FUNDERS_SYSTEM_PROMPT, buildPrompt: buildFundersPrompt },
  founder: { systemPrompt: FOUNDER_EXPERTISE_SYSTEM_PROMPT, buildPrompt: buildFounderExpertisePrompt },
};

interface RunningCheck {
  getStatus(applicationId: string): Promise<string | null>;
  markRunning(applicationId: string): Promise<void>;
  markDone(applicationId: string, result: ValidationSection): Promise<void>;
  markFailed(applicationId: string, message: string): Promise<void>;
}

const CHECKS: Record<SectionKey, RunningCheck> = {
  opModel: {
    getStatus: async (id) => (await prisma.application.findUniqueOrThrow({ where: { id }, select: { opModelStatus: true } })).opModelStatus,
    markRunning: (id) => prisma.application.update({ where: { id }, data: { opModelStatus: 'RUNNING', opModelError: null } }).then(() => undefined),
    markDone: (id, r) =>
      prisma.application
        .update({
          where: { id },
          data: {
            opModelStatus: 'DONE',
            opModelModel: GROQ_COMPOUND_MODEL,
            opModelRunAt: new Date(),
            opModelError: null,
            opModelVerdict: r.verdict,
            opModelSummary: r.summary,
            opModelRaw: r.raw,
          },
        })
        .then(() => undefined),
    markFailed: (id, message) => prisma.application.update({ where: { id }, data: { opModelStatus: 'FAILED', opModelError: message } }).then(() => undefined),
  },
  funders: {
    getStatus: async (id) => (await prisma.application.findUniqueOrThrow({ where: { id }, select: { fundersStatus: true } })).fundersStatus,
    markRunning: (id) => prisma.application.update({ where: { id }, data: { fundersStatus: 'RUNNING', fundersError: null } }).then(() => undefined),
    markDone: (id, r) =>
      prisma.application
        .update({
          where: { id },
          data: {
            fundersStatus: 'DONE',
            fundersModel: GROQ_COMPOUND_MODEL,
            fundersRunAt: new Date(),
            fundersError: null,
            fundersVerdict: r.verdict,
            fundersSummary: r.summary,
            fundersRaw: r.raw,
          },
        })
        .then(() => undefined),
    markFailed: (id, message) => prisma.application.update({ where: { id }, data: { fundersStatus: 'FAILED', fundersError: message } }).then(() => undefined),
  },
  founder: {
    getStatus: async (id) => (await prisma.application.findUniqueOrThrow({ where: { id }, select: { founderStatus: true } })).founderStatus,
    markRunning: (id) => prisma.application.update({ where: { id }, data: { founderStatus: 'RUNNING', founderError: null } }).then(() => undefined),
    markDone: (id, r) =>
      prisma.application
        .update({
          where: { id },
          data: {
            founderStatus: 'DONE',
            founderModel: GROQ_COMPOUND_MODEL,
            founderRunAt: new Date(),
            founderError: null,
            founderVerdict: r.verdict,
            founderSummary: r.summary,
            founderRaw: r.raw,
          },
        })
        .then(() => undefined),
    markFailed: (id, message) => prisma.application.update({ where: { id }, data: { founderStatus: 'FAILED', founderError: message } }).then(() => undefined),
  },
};

/** Shared runner for a single validation check — manually triggered only, never runs
 *  automatically on ingest or sync. Each section (operating model / funders / founder expertise)
 *  is billed and can fail independently, so a rate limit on one doesn't block the others. */
async function runSection(applicationId: string, section: SectionKey): Promise<{ usedModel: string }> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured — organisation validation requires Groq.');
  }

  const check = CHECKS[section];
  const currentStatus = await check.getStatus(applicationId);
  if (currentStatus === 'RUNNING') {
    throw new Error('This check is already running for this application — wait for it to finish.');
  }

  await check.markRunning(applicationId);

  try {
    const app = await prisma.application.findUniqueOrThrow({
      where: { id: applicationId },
      include: { founders: true, funders: true },
    });
    if (!app.orgName) throw new Error('Application has no organisation name — cannot validate.');

    const { systemPrompt, buildPrompt } = SECTION_CONFIG[section];
    const result = await callGroqCompoundSection(systemPrompt, buildPrompt(app));

    await check.markDone(applicationId, result);
    return { usedModel: GROQ_COMPOUND_MODEL };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'validation check failed';
    await check.markFailed(applicationId, message);
    throw err;
  }
}

export async function validateOperatingModel(applicationId: string) {
  return runSection(applicationId, 'opModel');
}

export async function validateFunders(applicationId: string) {
  return runSection(applicationId, 'funders');
}

export async function validateFounderExpertise(applicationId: string) {
  return runSection(applicationId, 'founder');
}
