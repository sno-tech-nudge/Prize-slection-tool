import 'dotenv/config';
import { prisma } from '../src/lib/db';
import { hashPassword } from '../src/lib/auth/password';

// password = firstname_ddmmyyyy(date of joining), firstname lowercase — the team's own scheme.
// login username = the user's email address (not the firstname).
const LOGINS: {
  matchName: string;
  firstName: string;
  doj: string; // ddmmyyyy
  create?: { name: string; email: string; role: string };
}[] = [
  { matchName: 'KC', firstName: 'kanishka', doj: '02052022' },
  { matchName: 'Sravya Jandhyala', firstName: 'sravya', doj: '26102022' },
  { matchName: 'Nisha Chawla', firstName: 'nisha', doj: '16102023' },
  { matchName: 'Paromita Sen', firstName: 'paromita', doj: '07072025' },
  { matchName: 'Saba Ahmed', firstName: 'saba', doj: '05082024' },
  {
    matchName: 'Anurag V',
    firstName: 'anurag',
    doj: '05122022',
    create: { name: 'Anurag V', email: 'anurag@thedelta.org.in', role: 'ADMIN' },
  },
  {
    matchName: 'Tanush Kalhan',
    firstName: 'tanush',
    doj: '21092006',
    create: { name: 'Tanush Kalhan', email: 'kalhan.tanush@gmail.com', role: 'ADMIN' },
  },
];

async function main() {
  for (const entry of LOGINS) {
    const password = `${entry.firstName}_${entry.doj}`;
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

    const username = user.email.toLowerCase();
    await prisma.user.update({ where: { id: user.id }, data: { username, passwordHash } });
    console.log(`set login for ${user.name} — username: ${username}`);
  }

  await prisma.$disconnect();
}

main();
