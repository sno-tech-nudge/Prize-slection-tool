import 'dotenv/config';
import { prisma } from '../src/lib/db';
import { scoreApplication } from '../src/lib/scoring/runner';

async function main() {
  const apps = await prisma.application.findMany({
    where: { isDuplicateOf: null },
    select: { id: true, orgName: true, aiEvaluations: { orderBy: { createdAt: 'desc' }, take: 1, select: { model: true } } },
    orderBy: { submittedAt: 'asc' },
  });
  const pending = apps.filter((a) => !a.aiEvaluations[0]?.model?.startsWith('groq/'));

  console.log(`rescoring ${pending.length} applications still missing a groq evaluation...`);
  let done = 0;
  let failed = 0;

  for (const app of pending) {
    try {
      const { usedModel } = await scoreApplication(app.id);
      done++;
      console.log(`[${done}/${pending.length}] ${app.orgName} — scored via ${usedModel}`);
    } catch (err) {
      failed++;
      console.error(`[FAILED] ${app.orgName} — ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`done: ${done} scored, ${failed} failed`);
  await prisma.$disconnect();
}

main();
