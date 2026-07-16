import { prisma } from '@/lib/db';

/** Fixed round-robin order for auto-assignment — same ordering shown in the header role
 *  switcher (role asc, then name asc), which happens to match the order the team wants:
 *  1. Nisha Chawla  2. Sravya Jandhyala  3. KC  4. Paromita Sen  5. Saba Ahmed
 *  New applications cycle through this list one at a time; once it reaches the end it wraps
 *  back to position 1. Anyone (admin or reviewer) can be in the rotation, and an admin can
 *  always override an individual application's assignment from its detail page. */
async function getRotationOrder() {
  return prisma.user.findMany({ orderBy: [{ role: 'asc' }, { name: 'asc' }] });
}

/** Assigns exactly one person to a newly-created application, continuing the rotation from
 *  wherever the last auto-assignment left off. No-ops if the application already has a
 *  reviewer (e.g. it was manually assigned already) or if there's no one to assign. */
export async function autoAssignReviewer(applicationId: string): Promise<void> {
  const alreadyAssigned = await prisma.reviewAssignment.count({ where: { applicationId } });
  if (alreadyAssigned > 0) return;

  const rotation = await getRotationOrder();
  if (rotation.length === 0) return;

  const totalAssignments = await prisma.reviewAssignment.count();
  const nextPerson = rotation[totalAssignments % rotation.length];

  await prisma.reviewAssignment.create({ data: { applicationId, reviewerId: nextPerson.id } });
}

/** Re-runs the rotation from scratch across every application, oldest submission first —
 *  clears all existing assignments and reassigns 1, 2, 3, 4, 5, 1, 2, 3, 4, 5, ... in strict
 *  order. Use this to reset the whole board onto the rotation (e.g. after adding/removing
 *  people), not for routine one-off reassignment — admins can override a single application
 *  from its detail page without affecting anyone else's assignment. */
export async function reassignAllInRotationOrder(): Promise<{ assigned: number; people: number }> {
  const rotation = await getRotationOrder();
  if (rotation.length === 0) return { assigned: 0, people: 0 };

  const applications = await prisma.application.findMany({
    where: { isDuplicateOf: null },
    orderBy: { submittedAt: 'asc' },
    select: { id: true },
  });

  await prisma.reviewAssignment.deleteMany({});

  await prisma.reviewAssignment.createMany({
    data: applications.map((app, i) => ({
      applicationId: app.id,
      reviewerId: rotation[i % rotation.length].id,
    })),
  });

  return { assigned: applications.length, people: rotation.length };
}
