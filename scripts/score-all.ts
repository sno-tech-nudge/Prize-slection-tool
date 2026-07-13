import { PrismaClient } from '@prisma/client';
import { scoreApplication } from '../src/lib/scoring/runner';

const prisma = new PrismaClient();

async function main() {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  console.log(hasKey ? `Scoring with Claude (${process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'})...` : 'No ANTHROPIC_API_KEY set — scoring with the heuristic fallback.');

  const applications = await prisma.application.findMany({
    where: { isDuplicateOf: null },
    select: { id: true, orgName: true },
    orderBy: { orgName: 'asc' },
  });

  console.log(`Scoring ${applications.length} applications...`);
  let ok = 0;
  let failed = 0;

  for (const app of applications) {
    try {
      const { usedModel } = await scoreApplication(app.id);
      ok++;
      console.log(`  [${ok + failed}/${applications.length}] ${app.orgName} — ${usedModel}`);
    } catch (err) {
      failed++;
      console.warn(`  [${ok + failed}/${applications.length}] FAILED ${app.orgName}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`Done. ${ok} scored, ${failed} failed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
