import { Button, Badge } from '@/design-system';
import { uploadResourceAction, deleteResourceAction, MAX_UPLOAD_BYTES } from '@/lib/uploads/actions';
import type { StoredUpload, UploadKind } from '@/lib/uploads/settingsUploads';

export function UploadSlot({
  kind,
  label,
  accept,
  current,
}: {
  kind: UploadKind;
  label: string;
  accept: string;
  current: StoredUpload | null;
}) {
  return (
    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
        <h3 style={{ fontSize: 'var(--fs-h4)' }}>{label}</h3>
        {current && <Badge tone="outline">uploaded</Badge>}
      </div>

      {current ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          <div style={{ fontSize: 'var(--fs-small)' }}>
            <a href={`/api/uploads/${kind}`} style={{ color: 'var(--delta-red)', fontWeight: 'var(--fw-bold)' as unknown as number }}>
              {current.filename}
            </a>
            <span style={{ color: 'var(--text-muted)' }}>
              {' '}
              · {Math.max(1, Math.round(current.size / 1024))}kb · uploaded by {current.uploadedByName} on{' '}
              {new Date(current.uploadedAt).toLocaleDateString('en-GB')}
            </span>
          </div>
          <form action={deleteResourceAction}>
            <input type="hidden" name="kind" value={kind} />
            <Button type="submit" variant="secondary" size="sm">
              remove
            </Button>
          </form>
        </div>
      ) : (
        <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>nothing uploaded yet.</p>
      )}

      <form action={uploadResourceAction} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="hidden" name="kind" value={kind} />
        <input type="file" name="file" accept={accept} required />
        <Button type="submit" variant="cta" size="sm">
          {current ? 'replace' : 'upload'}
        </Button>
      </form>
      <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)', marginTop: 'var(--space-2)' }}>
        max {Math.floor(MAX_UPLOAD_BYTES / (1024 * 1024))}MB. stored here for now, not yet shown on any observer/jury page.
      </p>
    </div>
  );
}
