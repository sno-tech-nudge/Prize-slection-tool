import { redirect } from 'next/navigation';
import { AngularBanner } from '@/design-system';
import { JuryBriefingContent } from '@/components/JuryBriefingContent';
import { getCurrentUser } from '@/lib/auth/session';

/** Jury guide, on its own route so it opens in a new browser tab from the nav — a juror can keep
 *  it open in one tab while scoring in another, instead of a slide-out panel that closed the
 *  moment they navigated to a different application. */
export default async function JuryGuidePage() {
  const user = await getCurrentUser();
  if (user?.role !== 'JURY') redirect('/applications');

  return (
    <div>
      <AngularBanner eyebrow="jury review · rapid re.gen challenge" title="jury guide" />
      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-lg)', margin: '0 auto' }}>
        <JuryBriefingContent />
      </div>
    </div>
  );
}
