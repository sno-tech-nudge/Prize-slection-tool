import fs from 'node:fs';
import { prisma } from '../src/lib/db';

interface RawTargetRow {
  connectStatus: string | null;
  name: string;
  model: string | null;
  focusType: string | null;
  orgFundingType: string | null;
  description: string | null;
  keyLocations: string | null;
  currentImpact: string | null;
  prizeRelevance: string | null;
  clarifications: string | null;
  pocName: string | null;
  pocDesignation: string | null;
  pocEmail: string | null;
  founder: string | null;
  contactNumber: string | null;
}

async function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) throw new Error('usage: tsx scripts/seed-real-targets.ts <path-to-targets.json>');
  const rows: RawTargetRow[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  await prisma.target.deleteMany();

  for (const row of rows) {
    const domain = row.pocEmail?.includes('@') ? row.pocEmail.split('@')[1].toLowerCase().replace(/^www\./, '') : null;
    await prisma.target.create({
      data: {
        name: row.name,
        domain,
        founders: row.founder ? JSON.stringify([row.founder]) : null,
        connectStatus: row.connectStatus,
        model: row.model,
        focusType: row.focusType,
        orgFundingType: row.orgFundingType,
        description: row.description,
        keyLocations: row.keyLocations,
        currentImpact: row.currentImpact,
        prizeRelevance: row.prizeRelevance,
        clarifications: row.clarifications,
        pocName: row.pocName,
        pocDesignation: row.pocDesignation,
        pocEmail: row.pocEmail,
        contactNumber: row.contactNumber,
      },
    });
  }

  const count = await prisma.target.count();
  console.log('seeded targets:', count);
  await prisma.$disconnect();
}

main();
