import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt';
import { computeComposite, dispositionFromComposite, RUBRIC_CRITERIA } from './rubric';
import { heuristicScore } from './heuristic';
import type { ScoringResult } from './types';

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
// llama-3.3-70b-versatile was deprecated by Groq on 2026-06-17 for free/developer tiers — a
// hardcoded default pointing at a dead model silently fails every call and falls back to the
// heuristic scorer with zero visible error anywhere in the app, so this needs to stay a live,
// non-deprecated model. Groq's own migration guidance for 3.3 70b is openai/gpt-oss-120b.
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : trimmed;
  return JSON.parse(candidate);
}

function isValidResult(value: unknown): value is ScoringResult {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.criteria) && v.criteria.length > 0 && typeof v.composite !== 'undefined';
}

async function callClaude(userPrompt: string): Promise<ScoringResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  async function attempt(extra?: string): Promise<ScoringResult> {
    const message = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: extra ? `${userPrompt}\n\n${extra}` : userPrompt }],
    });
    const text = message.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
    const parsed = extractJson(text);
    if (!isValidResult(parsed)) throw new Error('Model response failed JSON contract validation.');
    return parsed;
  }

  try {
    return await attempt();
  } catch {
    // one retry, reminding the model to emit strictly valid JSON
    return attempt('Your previous response was not valid JSON matching the required shape. Respond with ONLY the JSON object, no other text.');
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Groq's free tier enforces a low tokens-per-minute budget, so a burst of scoring calls hits
 *  429s quickly. The error body tells us exactly how long to wait ("Please try again in Xs") —
 *  read that back rather than guessing, and retry until the budget frees up. */
async function groqRequest(body: unknown, maxRetries = 6): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (res.status !== 429 || attempt === maxRetries) return res;

    const text = await res.text();
    const match = text.match(/try again in ([\d.]+)s/i);
    const waitSeconds = match ? Number(match[1]) : 20;
    await sleep(Math.ceil(waitSeconds * 1000) + 1000);
  }
  throw new Error('unreachable');
}

/** Groq's chat completions API is OpenAI-compatible — plain fetch, no extra SDK dependency.
 *  response_format: json_object gets a much more reliable JSON-only reply than prompting alone. */
async function callGroq(userPrompt: string): Promise<ScoringResult> {
  async function attempt(extra?: string): Promise<ScoringResult> {
    const res = await groqRequest({
      model: GROQ_MODEL,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: extra ? `${userPrompt}\n\n${extra}` : userPrompt },
      ],
    });
    if (!res.ok) throw new Error(`Groq API responded ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    const parsed = extractJson(text);
    if (!isValidResult(parsed)) throw new Error('Model response failed JSON contract validation.');
    return parsed;
  }

  try {
    return await attempt();
  } catch {
    return attempt('Your previous response was not valid JSON matching the required shape. Respond with ONLY the JSON object, no other text.');
  }
}

/** Gemini's generateContent REST endpoint — responseMimeType: application/json gets a reliable
 *  JSON-only reply, same role response_format plays for Groq. Used both as an explicit provider
 *  and as scoreApplication's automatic fallback when Groq is rate-limited. */
async function callGemini(userPrompt: string): Promise<ScoringResult> {
  async function attempt(extra?: string): Promise<ScoringResult> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: extra ? `${userPrompt}\n\n${extra}` : userPrompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      },
    );
    if (!res.ok) throw new Error(`Gemini API responded ${res.status}: ${(await res.text()).slice(0, 500)}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const parsed = extractJson(text);
    if (!isValidResult(parsed)) throw new Error('Model response failed JSON contract validation.');
    return parsed;
  }

  try {
    return await attempt();
  } catch {
    return attempt('Your previous response was not valid JSON matching the required shape. Respond with ONLY the JSON object, no other text.');
  }
}

/** Explicit SCORING_PROVIDER wins; otherwise auto-detect from whichever key is actually present.
 *  Falls back to the heuristic estimator if neither is configured — never silently no-ops. */
function resolveProvider(): 'anthropic' | 'groq' | 'gemini' | 'heuristic' {
  const configured = process.env.SCORING_PROVIDER?.toLowerCase();
  if (configured === 'anthropic' || configured === 'groq' || configured === 'gemini' || configured === 'heuristic') return configured;
  if (process.env.GROQ_API_KEY) return 'groq';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  return 'heuristic';
}

export async function scoreApplication(applicationId: string): Promise<{ usedModel: string }> {
  const app = await prisma.application.findUniqueOrThrow({
    where: { id: applicationId },
    include: { founders: true, funders: true, techUseCases: true, reportLinks: true },
  });

  const settings = await getSettings();
  const provider = resolveProvider();

  let result: ScoringResult;
  let modelLabel: string;

  if (provider === 'groq') {
    const userPrompt = buildUserPrompt(app);
    try {
      result = await callGroq(userPrompt);
      modelLabel = `groq/${GROQ_MODEL}`;
    } catch (err) {
      // Groq's free tier hits its daily/per-minute token cap often — if Gemini is configured,
      // fall back to it automatically rather than dropping straight to the heuristic estimator.
      if (!process.env.GEMINI_API_KEY) throw err;
      result = await callGemini(userPrompt);
      modelLabel = `gemini/${GEMINI_MODEL} (groq fallback)`;
    }
  } else if (provider === 'gemini') {
    const userPrompt = buildUserPrompt(app);
    result = await callGemini(userPrompt);
    modelLabel = `gemini/${GEMINI_MODEL}`;
  } else if (provider === 'anthropic') {
    const userPrompt = buildUserPrompt(app);
    result = await callClaude(userPrompt);
    modelLabel = ANTHROPIC_MODEL;
  } else {
    result = heuristicScore(app);
    modelLabel = 'heuristic-fallback-v1';
  }

  if (provider !== 'heuristic') {
    // recompute composite server-side from the rubric's own per-criterion point scale, even
    // though the model already returns its own composite estimate — keeps the model honest to
    // the maxScore each criterion actually carries.
    const scoreMap = Object.fromEntries(result.criteria.map((c) => [c.key, c.score]));
    result.composite = computeComposite(scoreMap);
    result.disposition = dispositionFromComposite(result.composite);
  }

  await prisma.aiEvaluation.create({
    data: {
      applicationId,
      model: modelLabel,
      criteria: JSON.stringify(result.criteria),
      composite: result.composite,
      disposition: result.disposition,
      redFlags: JSON.stringify(result.red_flags),
      eligibility: JSON.stringify(result.eligibility),
      summary: result.summary,
      rubricVersion: settings.rubricVersion,
      rubricWeightsSnapshot: JSON.stringify(Object.fromEntries(RUBRIC_CRITERIA.map((c) => [c.key, c.maxScore]))),
    },
  });

  return { usedModel: modelLabel };
}

export { RUBRIC_CRITERIA };
