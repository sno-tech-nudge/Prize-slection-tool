/** Outreach mail is sent per round (acceptance/rejection/query for round 1, 2 or 3). The round is
 *  encoded in the outbox row's template name instead of its own column — "bulk_acceptance" is
 *  round 1 (every row sent before rounds existed is round 1), "bulk_acceptance_r2"/"_r3" are the
 *  later rounds. Keeping it in the template name also means the existing "already sent this
 *  template to this application" check naturally becomes per-round without a schema change. */
export type OutreachKind = 'acceptance' | 'rejection' | 'query';
export type OutreachRound = 1 | 2 | 3;

export const OUTREACH_ROUNDS: OutreachRound[] = [1, 2, 3];

export function outboxTemplateName(kind: OutreachKind, round: OutreachRound): string {
  return round === 1 ? `bulk_${kind}` : `bulk_${kind}_r${round}`;
}

export function parseOutboxTemplate(template: string): { kind: OutreachKind; round: OutreachRound } | null {
  const match = template.match(/^bulk_(acceptance|rejection|query)(?:_r([23]))?$/);
  if (!match) return null;
  return { kind: match[1] as OutreachKind, round: (match[2] ? Number(match[2]) : 1) as OutreachRound };
}

/** The round an application is currently "at" for mailing purposes: the latest round that has a
 *  decision recorded. That's the round whose outcome (acceptance / rejection) there is something to
 *  tell the applicant about. */
export function latestDecidedRound(app: { round2Decision: string | null; round3Decision: string | null }): OutreachRound {
  if (app.round3Decision) return 3;
  if (app.round2Decision) return 2;
  return 1;
}

export function decisionForRound(
  app: { round1Decision: string | null; round2Decision: string | null; round3Decision: string | null },
  round: OutreachRound,
): string | null {
  return round === 1 ? app.round1Decision : round === 2 ? app.round2Decision : app.round3Decision;
}
