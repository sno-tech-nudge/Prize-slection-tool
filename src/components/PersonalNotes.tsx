'use client';
import React from 'react';
import { Textarea, Button } from '@/design-system';
import { saveNoteAction } from '@/lib/applications/actions';

export function PersonalNotes({ applicationId, initialBody }: { applicationId: string; initialBody: string }) {
  const [body, setBody] = React.useState(initialBody);
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<number | null>(null);

  async function save() {
    setSaving(true);
    const formData = new FormData();
    formData.set('applicationId', applicationId);
    formData.set('body', body);
    try {
      await saveNoteAction(formData);
      setSavedAt(Date.now());
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      <Textarea rows={5} placeholder="jot down your own thoughts…" value={body} onChange={(e) => setBody(e.target.value)} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Button variant="secondary" size="sm" disabled={saving} onClick={save} style={{ alignSelf: 'flex-start' }}>
          {saving ? 'saving…' : 'save note'}
        </Button>
        {savedAt && <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>saved</span>}
      </div>
    </div>
  );
}
