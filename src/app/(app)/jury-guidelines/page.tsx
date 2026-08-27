import { redirect } from 'next/navigation';
import { AngularBanner } from '@/design-system';
import { UploadedDocumentView } from '@/components/UploadedDocumentView';
import { getCurrentUser } from '@/lib/auth/session';
import { getUpload } from '@/lib/uploads/settingsUploads';

/** Jury guidelines, on its own route so it opens in a new browser tab from the nav — a juror can
 *  keep it open in one tab while scoring in another, instead of a slide-out panel that closed the
 *  moment they navigated to a different application. */
export default async function JuryGuidelinesPage() {
  const user = await getCurrentUser();
  if (user?.role !== 'JURY') redirect('/applications');

  const guidelinesUpload = await getUpload('JURY_GUIDELINES');

  return (
    <div>
      <AngularBanner eyebrow="jury review · rapid re.gen challenge" title="jury guidelines" />
      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-lg)', margin: '0 auto' }}>
        <UploadedDocumentView upload={guidelinesUpload} />
      </div>
    </div>
  );
}
