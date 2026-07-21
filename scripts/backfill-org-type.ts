import 'dotenv/config';
import { prisma } from '../src/lib/db';
import { deriveOrgTypeFromLegalRegistration } from '../src/lib/sources/normalize';

async function main() {
  const apps = await prisma.application.findMany({
    select: { id: true, orgName: true, legalRegistrationType: true, orgType: true },
  });

  let changed = 0;
  for (const app of apps) {
    const next = deriveOrgTypeFromLegalRegistration(app.legalRegistrationType);
    if (next !== app.orgType) {
      await prisma.application.update({ where: { id: app.id }, data: { orgType: next } });
      console.log(`${app.orgName}: ${app.orgType} -> ${next} (legal: ${app.legalRegistrationType ?? 'none'})`);
      changed++;
    }
  }

  console.log(`\n${changed}/${apps.length} applications updated.`);
  await prisma.$disconnect();
}

main();
