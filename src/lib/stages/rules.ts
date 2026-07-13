import type { StageStatusValue } from '@/lib/constants';

/** Pure state-machine rules — no Prisma import, safe to use from client components. */

export const STAGE_ORDER: StageStatusValue[] = [
  'SUBMITTED',
  'SCREENING',
  'UNDER_REVIEW',
  'SHORTLISTED',
  'JURY_REVIEW',
  'FINALIST',
  'WINNER',
];

export const LEGAL_TRANSITIONS: Record<StageStatusValue, StageStatusValue[]> = {
  SUBMITTED: ['SCREENING', 'WITHDRAWN'],
  SCREENING: ['UNDER_REVIEW', 'REJECTED', 'WITHDRAWN'],
  UNDER_REVIEW: ['SHORTLISTED', 'REJECTED', 'WITHDRAWN'],
  SHORTLISTED: ['JURY_REVIEW', 'REJECTED', 'WITHDRAWN'],
  JURY_REVIEW: ['FINALIST', 'REJECTED', 'WITHDRAWN'],
  FINALIST: ['WINNER', 'REJECTED', 'WITHDRAWN'],
  WINNER: [],
  REJECTED: [],
  WITHDRAWN: [],
};

export function canTransition(from: StageStatusValue, to: StageStatusValue): boolean {
  return LEGAL_TRANSITIONS[from]?.includes(to) ?? false;
}

export class IllegalTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot move an application from ${from} to ${to}.`);
    this.name = 'IllegalTransitionError';
  }
}
