import Link from 'next/link';
import { AngularBanner, Card } from '@/design-system';
import { FieldVisibilityManager } from '@/components/FieldVisibilityManager';
import { UploadSlot } from '@/components/UploadSlot';
import { getFieldVisibility } from '@/lib/visibility/settings';
import { getUpload } from '@/lib/uploads/settingsUploads';

export default async function ManageViewSettingsPage() {
  const [visibility, guidelinesUpload] = await Promise.all([getFieldVisibility(), getUpload('JURY_GUIDELINES')]);

  return (
    <div>
      <AngularBanner
        eyebrow="internal platform"
        title="manage view"
        subtitle="control which application fields observer and jury roles can see, and upload reference documents for them."
      />
      <div style={{ padding: 'var(--space-10)', maxWidth: 'var(--container-lg)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <Link href="/settings" style={{ fontSize: 'var(--fs-small)', color: 'var(--delta-red)', textDecoration: 'none' }}>
          ← back to settings
        </Link>

        <Card>
          <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-2)' }}>field visibility</h2>
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            checked fields are pre-set to match what observer and jury already see today. saving here does not change
            either role&apos;s actual view yet — that&apos;s a separate follow-up once this configuration is in place.
          </p>
          <FieldVisibilityManager visibility={visibility} />
        </Card>

        <Card>
          <h2 style={{ fontSize: 'var(--fs-h3)', marginBottom: 'var(--space-2)' }}>jury guide</h2>
          <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)' }}>
            upload a jury guide document (csv or pdf only) for reference — a csv&apos;s rows are converted to text, a
            pdf&apos;s text is extracted directly.
          </p>
          <UploadSlot kind="JURY_GUIDELINES" label="jury guide" accept=".csv,.pdf" current={guidelinesUpload} />
          <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', marginTop: 'var(--space-4)' }}>
            the &ldquo;rubric&rdquo; jury sees is the actual scoring rubric built into the jury scoring form (heading,
            weightage and info-button layout) — it&apos;s not a document upload, so there&apos;s no rubric file to
            manage here.
          </p>
        </Card>
      </div>
    </div>
  );
}
