import type { Prisma } from '@prisma/client';
import { Card, Badge } from '@/design-system';
import { PieChart } from '@/components/PieChart';
import { IndiaStatesMap } from '@/components/IndiaStatesMap';
import { getOperatingModelMix, getOrgSizeMix, getStateApplicationMix, getRegenPracticesMix } from '@/lib/analytics/queries';

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
      <h2 style={{ fontSize: 'var(--fs-h4)' }}>{title}</h2>
    </div>
  );
}

/** Applicant-composition breakdown for a round's applications — operating model, team size,
 *  states/UTs of operation, and regenerative practices covered — scoped to whichever subset of
 *  applications a round page passes in via `where`, reusing the same analytics queries the main
 *  dashboard uses rather than duplicating them per round. */
export async function RoundAnalyticsSection({ where }: { where: Prisma.ApplicationWhereInput }) {
  const [operatingModelMix, orgSizeMix, stateMix, regenPracticesMix] = await Promise.all([
    getOperatingModelMix(where),
    getOrgSizeMix(where),
    getStateApplicationMix(where),
    getRegenPracticesMix(where),
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <div style={{ borderTop: '2px solid var(--border-default)', paddingTop: 'var(--space-8)' }}>
        <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-6)' }}>analytics</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)', alignItems: 'start' }}>
        <Card accent>
          <SectionHeader title="operating model mix" />
          <PieChart data={operatingModelMix.map((c) => ({ label: c.category, count: c.count }))} />
        </Card>

        <Card accent>
          <SectionHeader title="team size" />
          <PieChart data={orgSizeMix} size={160} />
        </Card>
      </div>

      <Card accent>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
          <h2 style={{ fontSize: 'var(--fs-h4)' }}>states / UTs of operation</h2>
          <Badge tone="outline">{stateMix.length} states represented</Badge>
        </div>
        <IndiaStatesMap data={stateMix} />
      </Card>

      <Card accent>
        <SectionHeader title="regenerative practices" />
        <PieChart data={regenPracticesMix} />
      </Card>
    </div>
  );
}
