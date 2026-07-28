import type { Prisma, User } from '@prisma/client';
import type { UserRoleValue as UserRole } from '@/lib/constants';

export class ForbiddenError extends Error {
  constructor(message = 'Not permitted.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export function assertRole(user: User | null, allowed: UserRole[]): asserts user is User {
  if (!user || !allowed.includes(user.role as UserRole)) {
    throw new ForbiddenError(`This action requires one of: ${allowed.join(', ')}.`);
  }
}

/** Reviewers only see applications assigned to them; jury only sees applications an admin has
 *  explicitly marked internalDecision: YES (the internal go/no-go gate) AND placed on one of
 *  that juror's benches — a juror can sit on more than one bench, and one not yet assigned to
 *  any bench sees nothing rather than everything; admin/observer see all. */
export function visibleApplicationWhere(user: User | null): Prisma.ApplicationWhereInput {
  if (!user) return { id: 'none' };
  if (user.role === 'REVIEWER') {
    return { reviewAssignments: { some: { reviewerId: user.id } } };
  }
  if (user.role === 'JURY') {
    return { internalDecision: 'YES', bench: { jurors: { some: { id: user.id } } } };
  }
  return {};
}

export const CAN_TRANSITION_STAGE: UserRole[] = ['ADMIN'];
export const CAN_REVIEW: UserRole[] = ['ADMIN', 'REVIEWER'];
export const CAN_JURY_SCORE: UserRole[] = ['ADMIN', 'JURY'];
export const CAN_MANAGE_SETTINGS: UserRole[] = ['ADMIN'];
export const CAN_SEND_MAIL: UserRole[] = ['ADMIN'];
