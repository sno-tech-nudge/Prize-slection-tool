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

/** Jury only sees applications an admin has explicitly marked internalDecision: YES (the internal
 *  go/no-go gate) AND placed on one of that juror's benches — a juror can sit on more than one
 *  bench, and one not yet assigned to any bench sees nothing rather than everything. Reviewers
 *  see the whole applications list, same as admin/observer — their assignment only determines
 *  who they're expected to review, not what they're allowed to look at. */
export function visibleApplicationWhere(user: User | null): Prisma.ApplicationWhereInput {
  if (!user) return { id: 'none' };
  if (user.role === 'JURY') {
    return { internalDecision: 'YES', bench: { jurors: { some: { id: user.id } } } };
  }
  return {};
}

export const CAN_REVIEW: UserRole[] = ['ADMIN', 'REVIEWER'];
export const CAN_JURY_SCORE: UserRole[] = ['ADMIN', 'JURY'];
export const CAN_MANAGE_SETTINGS: UserRole[] = ['ADMIN'];
export const CAN_SEND_MAIL: UserRole[] = ['ADMIN'];

/** CAN_REVIEW answers "can this role review at all" — this answers "can THIS user manage THIS
 *  application": submit a score, transition its stage, or set its internal decision. Admin can
 *  manage anything (matches every other admin override in this app). Reviewer can only manage an
 *  application they have an explicit ReviewAssignment for — most real reviewers hold the ADMIN
 *  role for unrelated platform-access reasons, so without this check every admin could act on
 *  every application regardless of who was actually assigned to review it. */
export function canManageApplication(user: User | null, reviewAssignments: { reviewerId: string }[]): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (user.role === 'REVIEWER') return reviewAssignments.some((a) => a.reviewerId === user.id);
  return false;
}
