import { prisma } from '@/lib/db';
import { SYNOPSIS_SYSTEM_PROMPT, buildSynopsisPrompt } from './prompt';
import { heuristicSynopsis } from './heuristic';

// llama-3.3-70b-versatile was deprecated by Groq on 2026-06-17 for free/developer tiers — a
// hardcoded default pointing at a dead model silently fails every call (404 model_not_found) and
// falls back to the heuristic template with zero visible error, which is exactly what was
// producing the truncated ("...") synopsis bullets — the heuristic's own truncate() helper, not
// the AI prompt, was the actual source. Groq's own migration guidance for 3.3 70b is
// openai/gpt-oss-120b.
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : trimmed;
  return JSON.parse(candidate);
}

function isValidSynopsis(v: unknown): v is { synopsis: string } {
  return !!v && typeof v === 'object' && typeof (v as Record<string, unknown>).synopsis === 'string';
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// a bare conjunction/preposition/article immediately before the final terminator is the
// signature of a dangling, unfinished sentence (e.g. "...across Jammikunta and.") — never a
// legitimate sentence ending.
const DANGLING_ENDING = /\b(and|or|but|with|to|of|the|a|an|in|on|for|as|by|is|are|was|were|that|which|who|its|their|our)\.?\s*$/i;

/** Deterministic safety net applied to every AI-generated synopsis (Groq, Gemini, and — harmless
 *  no-op — the heuristic fallback), regardless of how well the prompt's instructions land with a
 *  given model: strips any lingering bullet/numbered-list markers a model wrote despite the
 *  no-bullets instruction, and trims a trailing unfinished sentence (one ending on a bare
 *  conjunction/preposition, the classic sign of a cut-off generation) back to the last complete
 *  one. Prompt wording alone can steer a model but never guarantees it — this is what actually
 *  guarantees nothing incomplete or bulleted ever reaches a juror, independent of model behaviour.
 *
 *  Bullet stripping covers more than the ASCII "•"/"-"/"*" cases: it also catches common bullet
 *  glyphs a model might use instead (‣▪●◦∙·) and numbered markers ("1. "), and — since a model
 *  that skips a real newline before a bullet still visually looks bulleted under this app's
 *  pre-wrap rendering — matches a marker at the start of the text, right after any newline, or
 *  right after a sentence-ending "."/"!"/"?" and some whitespace, not only at an actual line start. */
function sanitizeSynopsis(raw: string): string {
  let text = raw.replace(/(^|\n|(?<=[.!?])\s+)[ \t]*(?:[•‣▪●◦∙·*-]|\d+\.)\s+/g, '\n\n').trim();

  if (DANGLING_ENDING.test(text)) {
    const sentences = text.match(/[^.!?]+[.!?]+(?:\s+|$)/g);
    if (sentences && sentences.length > 1) {
      text = sentences.slice(0, -1).join('').trim();
    }
  }

  return text;
}

/** Same rate-limit-aware retry as scoring/runner.ts's groqRequest — Groq's free tier hits 429s
 *  under a burst, and the error body tells us exactly how long to wait. */
async function groqRequest(body: unknown, maxRetries = 6): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
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

async function callGroq(userPrompt: string): Promise<string> {
  async function attempt(extra?: string): Promise<string> {
    const res = await groqRequest({
      model: GROQ_MODEL,
      // generous headroom over the ~150-210 word target (roughly 200-280 tokens for the text
      // itself) — a tight limit here is exactly what was causing the API to cut the completion
      // off mid-word before the model finished writing, which no prompt instruction can prevent
      // since the model never gets the chance to finish.
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYNOPSIS_SYSTEM_PROMPT },
        { role: 'user', content: extra ? `${userPrompt}\n\n${extra}` : userPrompt },
      ],
    });
    if (!res.ok) throw new Error(`Groq API responded ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';
    const parsed = extractJson(text);
    if (!isValidSynopsis(parsed)) throw new Error('Model response failed JSON contract validation.');
    return parsed.synopsis;
  }

  try {
    return await attempt();
  } catch {
    return attempt('Your previous response was not valid JSON matching the required shape. Respond with ONLY the JSON object, no other text.');
  }
}

async function callGemini(userPrompt: string): Promise<string> {
  async function attempt(extra?: string): Promise<string> {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYNOPSIS_SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: extra ? `${userPrompt}\n\n${extra}` : userPrompt }] }],
          generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 1200 },
        }),
      },
    );
    if (!res.ok) throw new Error(`Gemini API responded ${res.status}: ${(await res.text()).slice(0, 500)}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const parsed = extractJson(text);
    if (!isValidSynopsis(parsed)) throw new Error('Model response failed JSON contract validation.');
    return parsed.synopsis;
  }

  try {
    return await attempt();
  } catch {
    return attempt('Your previous response was not valid JSON matching the required shape. Respond with ONLY the JSON object, no other text.');
  }
}

/** Manually re-triggerable, and auto-enqueued (via the SYNOPSIZE_APPLICATION job) once an
 *  application's internal decision is set to YES — see setInternalDecisionAction. Tries Groq,
 *  then Gemini, then falls back to a deterministic template (heuristic.ts) if both AI providers
 *  fail or neither is configured — same "never silently no-op, always show something real"
 *  philosophy as scoring/heuristic.ts, since jury has no way to retry this themselves. FAILED is
 *  reserved for a genuine bug (the heuristic itself throwing), not an AI provider outage. */
export async function generateOrgSynopsis(applicationId: string): Promise<{ usedModel: string }> {
  // There used to be an "already RUNNING, refuse to start again" guard here — but orgSynopsisStatus
  // has no staleness recovery the way the Job queue's status does (see reclaimStaleRunningJobs in
  // jobs/queue.ts), so any generation interrupted mid-flight (a serverless timeout, a deploy
  // landing mid-request) left the row stuck at RUNNING forever, permanently refusing every future
  // regenerate attempt for that application — exactly the same failure mode the job queue fix
  // addressed, just for this separate status field. Removed rather than reproduce that same bug
  // here: the job queue's own atomic claim already prevents the same queued job from double-
  // running, and a user double-clicking "regenerate this one" is a low-consequence race (whichever
  // call finishes last simply wins), not worth reintroducing a bug this disruptive to guard against.
  await prisma.application.update({ where: { id: applicationId }, data: { orgSynopsisStatus: 'RUNNING', orgSynopsisError: null } });

  try {
    const app = await prisma.application.findUniqueOrThrow({ where: { id: applicationId }, include: { techUseCases: true } });
    const userPrompt = buildSynopsisPrompt(app);

    let synopsis: string | undefined;
    let usedModel: string | undefined;
    let aiError: string | undefined;

    if (process.env.GROQ_API_KEY) {
      try {
        synopsis = await callGroq(userPrompt);
        usedModel = `groq/${GROQ_MODEL}`;
      } catch (err) {
        aiError = `groq: ${err instanceof Error ? err.message : 'unknown error'}`;
      }
    }

    if (!synopsis && process.env.GEMINI_API_KEY) {
      try {
        synopsis = await callGemini(userPrompt);
        usedModel = process.env.GROQ_API_KEY ? `gemini/${GEMINI_MODEL} (groq fallback)` : `gemini/${GEMINI_MODEL}`;
      } catch (err) {
        aiError = [aiError, `gemini: ${err instanceof Error ? err.message : 'unknown error'}`].filter(Boolean).join(' · ');
      }
    }

    if (!synopsis) {
      synopsis = heuristicSynopsis(app);
      usedModel = 'heuristic-fallback-v1';
    }

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        orgSynopsisStatus: 'DONE',
        orgSynopsisModel: usedModel,
        orgSynopsisRunAt: new Date(),
        // kept even on a successful (heuristic) result so an admin can see why the AI path was
        // skipped, without that ever surfacing as a scary FAILED state to anyone.
        orgSynopsisError: aiError ?? null,
        orgSynopsisText: sanitizeSynopsis(synopsis),
      },
    });

    return { usedModel: usedModel ?? 'unknown' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'synopsis generation failed';
    await prisma.application.update({ where: { id: applicationId }, data: { orgSynopsisStatus: 'FAILED', orgSynopsisError: message } });
    throw err;
  }
}
