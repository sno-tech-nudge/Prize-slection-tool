import { prisma } from '@/lib/db';
import { ORG_VALIDATION_VERDICTS, type OrgValidationVerdictValue } from '@/lib/constants';
import { ORG_VALIDATION_SYSTEM_PROMPT, buildOrgValidationPrompt } from './prompt';

// groq/compound is Groq's agentic model with a built-in web-search tool — this IS the scraper.
// No separate search API key is configured or required for this feature.
const GROQ_COMPOUND_MODEL = process.env.GROQ_COMPOUND_MODEL || 'groq/compound';

interface ValidationSection {
  verdict: OrgValidationVerdictValue;
  summary: string;
  raw: string;
}

interface ValidationResult {
  operating_model: ValidationSection;
  funders: ValidationSection;
  founder_expertise: ValidationSection;
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

function isValidResult(v: unknown): v is ValidationResult {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return isValidSection(r.operating_model) && isValidSection(r.funders) && isValidSection(r.founder_expertise);
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

async function callGroqCompound(userPrompt: string): Promise<ValidationResult> {
  async function attempt(extra?: string): Promise<ValidationResult> {
    const res = await groqCompoundRequest({
      model: GROQ_COMPOUND_MODEL,
      max_tokens: 4000,
      messages: [
        { role: 'system', content: ORG_VALIDATION_SYSTEM_PROMPT },
        { role: 'user', content: extra ? `${userPrompt}\n\n${extra}` : userPrompt },
      ],
    });
    if (!res.ok) throw new Error(`Groq API responded ${res.status}: ${(await res.text()).slice(0, 500)}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    const parsed = extractJson(text);
    if (!isValidResult(parsed)) throw new Error('Model response failed JSON contract validation.');
    return parsed;
  }

  try {
    return await attempt();
  } catch {
    // one retry, reminding the model to emit strictly valid JSON matching the schema
    return attempt('Your previous response was not valid JSON matching the required schema. Respond with ONLY the JSON object, no other text, no markdown fences.');
  }
}

/** Manually triggered only — never runs automatically on ingest or sync. A reviewer clicks
 *  "run validation" on a single application; this never processes more than one at a time. */
export async function validateOrganisation(applicationId: string): Promise<{ usedModel: string }> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured — organisation validation requires Groq.');
  }

  const current = await prisma.application.findUniqueOrThrow({
    where: { id: applicationId },
    select: { orgValidationStatus: true },
  });
  if (current.orgValidationStatus === 'RUNNING') {
    throw new Error('Validation is already running for this application — wait for it to finish.');
  }

  await prisma.application.update({
    where: { id: applicationId },
    data: { orgValidationStatus: 'RUNNING', orgValidationError: null },
  });

  try {
    const app = await prisma.application.findUniqueOrThrow({
      where: { id: applicationId },
      include: { founders: true, funders: true },
    });
    if (!app.orgName) throw new Error('Application has no organisation name — cannot validate.');

    const userPrompt = buildOrgValidationPrompt(app);
    const result = await callGroqCompound(userPrompt);

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        orgValidationStatus: 'DONE',
        orgValidationModel: GROQ_COMPOUND_MODEL,
        orgValidationRunAt: new Date(),
        orgValidationError: null,
        opModelVerdict: result.operating_model.verdict,
        opModelSummary: result.operating_model.summary,
        opModelRaw: result.operating_model.raw,
        fundersVerdict: result.funders.verdict,
        fundersSummary: result.funders.summary,
        fundersRaw: result.funders.raw,
        founderVerdict: result.founder_expertise.verdict,
        founderSummary: result.founder_expertise.summary,
        founderRaw: result.founder_expertise.raw,
      },
    });

    return { usedModel: GROQ_COMPOUND_MODEL };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'organisation validation failed';
    await prisma.application.update({
      where: { id: applicationId },
      data: { orgValidationStatus: 'FAILED', orgValidationError: message },
    });
    throw err;
  }
}
