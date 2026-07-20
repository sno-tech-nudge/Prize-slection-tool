import 'dotenv/config';
import { prisma } from '../src/lib/db';
import { scoreApplication } from '../src/lib/scoring/runner';

async function main() {
  const apps = await prisma.application.findMany({
    where: { isDuplicateOf: null },
    select: { id: true, orgName: true, aiEvaluations: { orderBy: { createdAt: 'desc' }, take: 1, select: { criteria: true } } },
  });
  const stale = apps.filter((a) => {
    const e = a.aiEvaluations[0];
    if (!e) return false;
    return JSON.parse(e.criteria)
      .map((x: { key: string }) => x.key)
      .includes('model_clarity');
  });

  console.log(`rescoring ${stale.length} stale (old-rubric) applications...`);
  let done = 0;
  let failed = 0;
  for (const app of stale) {
    try {
      const { usedModel } = await scoreApplication(app.id);
      done++;
      console.log(`[${done}/${stale.length}] ${app.orgName} — scored via ${usedModel}`);
    } catch (err) {
      failed++;
      console.error(`[FAILED] ${app.orgName} — ${err instanceof Error ? err.message : err}`);
    }
  }
  console.log(`done: ${done} scored, ${failed} failed`);
  await prisma.$disconnect();
}
main();
