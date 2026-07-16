import type { Target } from '@prisma/client';
import { orgKey, domainFromWebsite } from '@/lib/sources/normalize';
import { ORG_SUFFIX_STOPWORDS } from '@/lib/constants';
import { prisma } from '@/lib/db';

// Only exact matches count — a target is a real, specific organisation from a curated list,
// and a fuzzy/partial name match (e.g. shared words like "Foundation" or "Farms") produced
// false positives in practice. A candidate is only ever confidence 1 (exact match) or excluded.
export const MATCH_THRESHOLD_SUGGEST = 1;

// Personal email providers never count as an organisational domain match — most of our
// applicants and targets list a personal gmail/yahoo/etc address rather than an org website, so
// treating those as equal would match every gmail.com applicant to every gmail.com target.
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'yahoo.co.in',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'rediffmail.com',
  'protonmail.com',
  'aol.com',
]);

export function stripOrgSuffixes(name: string): string {
  let s = orgKey(name);
  for (const suffix of ORG_SUFFIX_STOPWORDS) {
    s = s.replace(new RegExp(`\\b${suffix.replace(/\./g, '\\.')}\\b`, 'g'), ' ');
  }
  return s.replace(/\s+/g, ' ').trim();
}

export interface MatchCandidate {
  target: Target;
  confidence: number;
  reason: string;
}

export function scoreApplicationAgainstTargets(
  app: { orgName: string; website?: string | null; email?: string | null; founders?: { fullName: string }[] },
  targets: Target[],
): MatchCandidate[] {
  const appNameStripped = stripOrgSuffixes(app.orgName);
  const appDomain = domainFromWebsite(app.website ?? undefined) ?? app.email?.split('@')[1]?.toLowerCase();

  return targets
    .map((t) => {
      const nameMatch = appNameStripped.length > 0 && appNameStripped === stripOrgSuffixes(t.name);
      const tDomain = t.domain?.toLowerCase() ?? domainFromWebsite(t.website ?? undefined)?.toLowerCase();
      const domainMatch = Boolean(appDomain && tDomain && appDomain === tDomain && !FREE_EMAIL_DOMAINS.has(appDomain));

      let founderMatch = false;
      if (app.founders?.length && t.founders) {
        try {
          const targetFounders: string[] = JSON.parse(t.founders);
          founderMatch = app.founders.some((f) => {
            const key = orgKey(f.fullName);
            return key.length > 0 && targetFounders.some((tf) => orgKey(tf) === key);
          });
        } catch {
          // ignore malformed JSON
        }
      }

      let confidence = 0;
      let reason = 'no exact match';
      if (nameMatch) {
        confidence = 1;
        reason = 'exact organisation name match';
      } else if (domainMatch) {
        confidence = 1;
        reason = 'exact website/email domain match';
      } else if (founderMatch) {
        confidence = 1;
        reason = 'exact founder name match';
      }

      return { target: t, confidence, reason };
    })
    .sort((a, b) => b.confidence - a.confidence);
}

/** Runs the matcher for one application and links it to the best target, if any. */
export async function runMatcherForApplication(applicationId: string) {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { founders: true },
  });
  if (!app) return null;

  const targets = await prisma.target.findMany();
  if (targets.length === 0) return null;

  const [best] = scoreApplicationAgainstTargets(app, targets);
  if (!best || best.confidence < MATCH_THRESHOLD_SUGGEST) return null;

  // Multiple applications can independently clear the threshold against the same target
  // (e.g. two orgs that both contain the word "Labs"). Since Target.status/matchConfidence is a
  // single summary field, never let a later, weaker coincidental match undo an already-CONTACTED
  // target, and prefer the higher-confidence match if two applications both clear the bar.
  const existingTarget = await prisma.target.findUnique({ where: { id: best.target.id } });
  const shouldUpdateTargetSummary =
    !existingTarget ||
    existingTarget.status === 'NOT_APPLIED' ||
    (existingTarget.status === 'APPLIED' && (existingTarget.matchConfidence ?? 0) <= best.confidence);

  await prisma.$transaction([
    prisma.application.update({
      where: { id: applicationId },
      data: { targetMatchId: best.target.id },
    }),
    ...(shouldUpdateTargetSummary
      ? [
          prisma.target.update({
            where: { id: best.target.id },
            data: { status: 'APPLIED', matchConfidence: best.confidence },
          }),
        ]
      : []),
  ]);

  return { target: best.target, confidence: best.confidence };
}
