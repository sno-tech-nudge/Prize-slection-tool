import { prisma } from '@/lib/db';
import { SYNOPSIS_SYSTEM_PROMPT, buildSynopsisPrompt } from './prompt';

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
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
      max_tokens: 500,
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
          generationConfig: { responseMimeType: 'application/json' },
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
 *  application's internal decision is set to YES — see setInternalDecisionAction. Groq primary,
 *  Gemini fallback, same provider pairing as the rest of the scoring pipeline; no web search
 *  involved, this only synthesises fields the applicant already submitted. */
export async function generateOrgSynopsis(applicationId: string): Promise<{ usedModel: string }> {
  if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
    throw new Error('Neither GROQ_API_KEY nor GEMINI_API_KEY is configured — the organisation & model synopsis needs one of them.');
  }

  const currentStatus = (await prisma.application.findUniqueOrThrow({ where: { id: applicationId }, select: { orgSynopsisStatus: true } }))
    .orgSynopsisStatus;
  if (currentStatus === 'RUNNING') {
    throw new Error('The synopsis is already being generated for this application — wait for it to finish.');
  }

  await prisma.application.update({ where: { id: applicationId }, data: { orgSynopsisStatus: 'RUNNING', orgSynopsisError: null } });

  try {
    const app = await prisma.application.findUniqueOrThrow({ where: { id: applicationId }, include: { techUseCases: true } });
    const userPrompt = buildSynopsisPrompt(app);

    let synopsis: string;
    let usedModel: string;
    if (process.env.GROQ_API_KEY) {
      try {
        synopsis = await callGroq(userPrompt);
        usedModel = `groq/${GROQ_MODEL}`;
      } catch (err) {
        if (!process.env.GEMINI_API_KEY) throw err;
        synopsis = await callGemini(userPrompt);
        usedModel = `gemini/${GEMINI_MODEL} (groq fallback)`;
      }
    } else {
      synopsis = await callGemini(userPrompt);
      usedModel = `gemini/${GEMINI_MODEL}`;
    }

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        orgSynopsisStatus: 'DONE',
        orgSynopsisModel: usedModel,
        orgSynopsisRunAt: new Date(),
        orgSynopsisError: null,
        orgSynopsisText: synopsis.trim(),
      },
    });

    return { usedModel };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'synopsis generation failed';
    await prisma.application.update({ where: { id: applicationId }, data: { orgSynopsisStatus: 'FAILED', orgSynopsisError: message } });
    throw err;
  }
}
