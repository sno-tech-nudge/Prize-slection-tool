'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { Card, Button, Input, Dialog, useToast } from '@/design-system';
import { getResetPreviewCountsAction, resetPlatformDataAction, type ResetPreviewCounts } from '@/lib/automation/resetPlatform';

/** The full "wipe this challenge's data and reuse the platform for the next one" action — its own
 *  clearly separated danger-zone card rather than sitting alongside the routine automation
 *  buttons, since a misclick here is catastrophic in a way none of those are. Double-guarded per
 *  the request: a confirmation dialog showing exactly what's about to be deleted, then the
 *  signed-in admin's own account password re-entered and re-verified server-side before anything
 *  actually runs. */
export function ResetPlatformPanel() {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = React.useState(false);
  const [counts, setCounts] = React.useState<ResetPreviewCounts | null>(null);
  const [loadingCounts, setLoadingCounts] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [deleting, setDeleting] = React.useState(false);

  async function openDialog() {
    setOpen(true);
    setPassword('');
    setError('');
    setLoadingCounts(true);
    try {
      setCounts(await getResetPreviewCountsAction());
    } finally {
      setLoadingCounts(false);
    }
  }

  function closeDialog() {
    if (deleting) return; // don't let an accidental click-away interrupt an in-flight delete
    setOpen(false);
  }

  async function confirmDelete() {
    setError('');
    setDeleting(true);
    try {
      const result = await resetPlatformDataAction(password);
      if (!result.ok) {
        setError(result.error ?? 'something went wrong.');
        return;
      }
      setOpen(false);
      push('platform reset', 'all applications, reviews, benches, targets and non-admin accounts have been deleted.', 'success');
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  const count = (n: number | undefined) => (loadingCounts || n === undefined ? '…' : n);

  return (
    <Card accent accentSide="left">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        <AlertTriangle size={16} color="var(--delta-red)" strokeLinejoin="miter" strokeLinecap="square" />
        <h2 style={{ fontSize: 'var(--fs-h4)' }}>danger zone</h2>
      </div>
      <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
        permanently delete every application, review, jury score, bench and wishlist target, and every non-admin login — for reusing this
        platform on the next challenge. this cannot be undone.
      </p>
      <Button variant="cta" size="sm" onClick={openDialog}>
        reset platform for a new challenge
      </Button>

      <Dialog
        open={open}
        onClose={closeDialog}
        title="reset platform — are you sure?"
        width={480}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={closeDialog} disabled={deleting}>
              cancel
            </Button>
            <Button variant="cta" size="sm" onClick={confirmDelete} disabled={deleting || !password}>
              {deleting ? 'deleting…' : 'permanently delete everything'}
            </Button>
          </>
        }
      >
        <p style={{ marginBottom: 'var(--space-4)' }}>this will permanently delete:</p>
        <ul style={{ margin: 0, marginBottom: 'var(--space-4)', paddingLeft: 'var(--space-5)', lineHeight: 'var(--lh-relaxed)' }}>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>{count(counts?.applications)}</strong> applications, and every review, jury
            score, comment, note, AI evaluation and email tied to them
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>{count(counts?.benches)}</strong> jury benches
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>{count(counts?.targets)}</strong> wishlist targets
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>{count(counts?.nonAdminUsers)}</strong> reviewer / jury / observer logins
          </li>
        </ul>
        <p style={{ marginBottom: 'var(--space-4)' }}>
          <strong style={{ color: 'var(--text-primary)' }}>admin accounts and platform settings are kept.</strong> this cannot be undone.
        </p>
        <Input
          type="password"
          label="enter your password to confirm"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          error={error || undefined}
          autoFocus
        />
      </Dialog>
    </Card>
  );
}
