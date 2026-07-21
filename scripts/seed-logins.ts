import 'dotenv/config';
import { prisma } from '../src/lib/db';
import { hashPassword } from '../src/lib/auth/password';

// firstname_ddmmyyyy(date of joining), firstname lowercase — the team's own password scheme.
const LOGINS: {
  matchName: string;
  username: string;
  doj: string; // ddmmyyyy
  create?: { name: string; email: string; role: string };
}[] = [
  { matchName: 'KC', username: 'kanishka', doj: '02052022' },
  { matchName: 'Sravya Jandhyala', username: 'sravya', doj: '26102022' },
  { matchName: 'Nisha Chawla', username: 'nisha', doj: '16102023' },
  { matchName: 'Paromita Sen', username: 'paromita', doj: '07072025' },
  { matchName: 'Saba Ahmed', username: 'saba', doj: '05082024' },
  {
    matchName: 'Anurag V',
    username: 'anurag',
    doj: '05122022',
    create: { name: 'Anurag V', email: 'anurag@thedelta.org.in', role: 'ADMIN' },
  },
  {
    matchName: 'Tanush Kalhan',
    username: 'tanush',
    doj: '21092006',
    create: { name: 'Tanush Kalhan', email: 'kalhan.tanush@gmail.com', role: 'ADMIN' },
  },
];

async function main() {
  for (const entry of LOGINS) {
    const password = `${entry.username}_${entry.doj}`;
    const passwordHash = hashPassword(password);

    let user = await prisma.user.findFirst({ where: { name: entry.matchName } });
    if (!user && entry.create) {
      user = await prisma.user.create({ data: entry.create });
      console.log(`created ${entry.create.name}`);
    }
    if (!user) {
      console.error(`[SKIPPED] no existing user matched "${entry.matchName}" and no create info given`);
      continue;
    }

    await prisma.user.update({ where: { id: user.id }, data: { username: entry.username, passwordHash } });
    console.log(`set login for ${user.name} — username: ${entry.username}`);
  }

  await prisma.$disconnect();
}

main();
