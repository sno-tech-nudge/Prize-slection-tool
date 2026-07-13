import { prisma } from '@/lib/db';
import { enrichFromWebsite, enrichFromSearch } from './scraper';

export async function enrichApplication(applicationId: string): Promise<{ enriched: boolean }> {
  const app = await prisma.application.findUniqueOrThrow({ where: { id: applicationId } });
  if (!app.website) return { enriched: false };

  const website = await enrichFromWebsite(app.website);
  const search = await enrichFromSearch(app.orgName);

  if (!website && !search) {
    await prisma.application.update({ where: { id: applicationId }, data: { enrichedAt: new Date() } });
    return { enriched: false };
  }

  const parts: string[] = [];
  if (website?.title) parts.push(`Website title: "${website.title}".`);
  if (website?.description) parts.push(`Website description: "${website.description}".`);
  else if (website?.excerpt) parts.push(`Website excerpt: "${website.excerpt}".`);
  if (search?.summary) parts.push(`Public search summary: "${search.summary}".`);

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      enrichmentSummary: parts.join(' '),
      enrichmentSource: search ? 'website+search' : 'website',
      enrichedAt: new Date(),
    },
  });

  return { enriched: true };
}
