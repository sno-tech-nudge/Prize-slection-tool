import 'dotenv/config';
import { prisma } from '../src/lib/db';
import { scoreApplication } from '../src/lib/scoring/runner';

async function main() {
  const apps = await prisma.application.findMany({
    where: { isDuplicateOf: null },
    select: { id: true, orgName: true },
    orderBy: { submittedAt: 'asc' },
  });

  console.log(`rescoring ${apps.length} applications against the new rubric...`);
  let done = 0;
  let failed = 0;

  for (const app of apps) {
    try {
      const { usedModel } = await scoreApplication(app.id);
      done++;
      console.log(`[${done}/${apps.length}] ${app.orgName} — scored via ${usedModel}`);
    } catch (err) {
      failed++;
      console.error(`[FAILED] ${app.orgName} — ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`done: ${done} scored, ${failed} failed`);
  await prisma.$disconnect();
}

main();
