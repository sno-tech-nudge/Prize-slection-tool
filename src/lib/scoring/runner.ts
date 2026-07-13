import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt';
import { computeComposite, dispositionFromComposite, RUBRIC_CRITERIA } from './rubric';
import { heuristicScore } from './heuristic';
import type { ScoringResult } from './types';

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

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
      model: MODEL,
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

export async function scoreApplication(applicationId: string): Promise<{ usedModel: string }> {
  const app = await prisma.application.findUniqueOrThrow({
    where: { id: applicationId },
    include: { founders: true, funders: true, techUseCases: true, reportLinks: true },
  });

  const settings = await getSettings();
  const hasKey = !!process.env.ANTHROPIC_API_KEY;

  let result: ScoringResult;
  let modelLabel: string;

  if (hasKey) {
    const userPrompt = buildUserPrompt(app);
    result = await callClaude(userPrompt);
    // recompute composite server-side from the weighted rubric so admin-tunable weights always apply,
    // even though the model already returns its own composite estimate.
    const scoreMap = Object.fromEntries(result.criteria.map((c) => [c.key, c.score]));
    result.composite = computeComposite(scoreMap, settings.rubricWeights);
    result.disposition = dispositionFromComposite(result.composite);
    modelLabel = MODEL;
  } else {
    result = heuristicScore(app);
    modelLabel = 'heuristic-fallback-v1';
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
      rubricWeightsSnapshot: JSON.stringify(settings.rubricWeights),
    },
  });

  return { usedModel: modelLabel };
}

export { RUBRIC_CRITERIA };
