import { distance } from 'fastest-levenshtein';
import type { Target } from '@prisma/client';
import { orgKey, domainFromWebsite } from '@/lib/sources/normalize';
import { ORG_SUFFIX_STOPWORDS } from '@/lib/constants';
import { prisma } from '@/lib/db';

// A single bar for "this wishlist startup applied" — the confidence % is still shown on the
// card for the team's own judgement, but the status itself no longer has a separate
// "confirmed vs suggested" tier (that distinction proved confusing in practice).
export const MATCH_THRESHOLD_SUGGEST = 0.55;

export function stripOrgSuffixes(name: string): string {
  let s = orgKey(name);
  for (const suffix of ORG_SUFFIX_STOPWORDS) {
    s = s.replace(new RegExp(`\\b${suffix.replace(/\./g, '\\.')}\\b`, 'g'), ' ');
  }
  return s.replace(/\s+/g, ' ').trim();
}

function nameSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const d = distance(a, b);
  const maxLen = Math.max(a.length, b.length) || 1;
  return 1 - d / maxLen;
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
      const nameSim = nameSimilarity(appNameStripped, stripOrgSuffixes(t.name));
      const tDomain = t.domain?.toLowerCase() ?? domainFromWebsite(t.website ?? undefined)?.toLowerCase();
      const domainMatch = appDomain && tDomain && appDomain === tDomain;

      let founderMatch = false;
      if (app.founders?.length && t.founders) {
        try {
          const targetFounders: string[] = JSON.parse(t.founders);
          founderMatch = app.founders.some((f) =>
            targetFounders.some((tf) => nameSimilarity(orgKey(f.fullName), orgKey(tf)) > 0.85),
          );
        } catch {
          // ignore malformed JSON
        }
      }

      let confidence = nameSim;
      let reason = `org name similarity ${(nameSim * 100).toFixed(0)}%`;
      if (domainMatch) {
        confidence = Math.max(confidence, 0.97);
        reason = 'exact website/email domain match';
      } else if (founderMatch) {
        confidence = Math.max(confidence, 0.9);
        reason = 'founder name match';
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
