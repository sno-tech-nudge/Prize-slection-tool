'use client';
import React from 'react';
import { Textarea, Button } from '@/design-system';
import { postCommentAction } from '@/lib/applications/actions';

export interface CommentData {
  id: string;
  body: string;
  createdAt: Date | string;
  author: { name: string };
}

export function CommentThread({ applicationId, comments }: { applicationId: string; comments: CommentData[] }) {
  const [pending, setPending] = React.useState(false);
  const [draft, setDraft] = React.useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', maxHeight: 220, overflowY: 'auto' }}>
        {comments.length === 0 && <p style={{ fontSize: 'var(--fs-small)', color: 'var(--text-muted)' }}>no comments yet.</p>}
        {comments.map((c) => (
          <div key={c.id} style={{ borderLeft: '2px solid var(--border-subtle)', paddingLeft: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-caption)', color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{c.author.name}</strong>
              <span>{new Date(c.createdAt).toLocaleString('en-GB')}</span>
            </div>
            <p style={{ fontSize: 'var(--fs-small)', margin: 'var(--space-1) 0 0' }}>{c.body}</p>
          </div>
        ))}
      </div>
      <form
        action={async (formData) => {
          setPending(true);
          try {
            await postCommentAction(formData);
            setDraft('');
          } finally {
            setPending(false);
          }
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}
      >
        <input type="hidden" name="applicationId" value={applicationId} />
        <Textarea
          name="body"
          rows={2}
          placeholder="add a comment for the team…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" variant="secondary" size="sm" disabled={pending || !draft.trim()} style={{ alignSelf: 'flex-start' }}>
          {pending ? 'posting…' : 'post comment'}
        </Button>
      </form>
    </div>
  );
}
