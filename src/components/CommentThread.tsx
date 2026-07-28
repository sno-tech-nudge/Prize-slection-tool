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

export interface MentionableUser {
  id: string;
  name: string;
}

// renders "@Name" runs (matched against the real team roster) as a highlighted mention,
// everything else as plain text
function renderBody(body: string, users: MentionableUser[]): React.ReactNode {
  if (users.length === 0) return body;
  const names = users.map((u) => u.name).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`@(${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(body)) !== null) {
    if (match.index > lastIndex) parts.push(body.slice(lastIndex, match.index));
    parts.push(
      <strong key={key++} style={{ color: 'var(--delta-red)', fontWeight: 'var(--fw-bold)' as unknown as number }}>
        {match[0]}
      </strong>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < body.length) parts.push(body.slice(lastIndex));
  return parts;
}

export function CommentThread({
  applicationId,
  comments,
  users = [],
}: {
  applicationId: string;
  comments: CommentData[];
  users?: MentionableUser[];
}) {
  const [pending, setPending] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [mentionQuery, setMentionQuery] = React.useState<string | null>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const getTextarea = () => wrapperRef.current?.querySelector('textarea') ?? null;

  const suggestions =
    mentionQuery === null ? [] : users.filter((u) => u.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6);

  function handleChange(value: string, caret: number) {
    setDraft(value);
    const upToCaret = value.slice(0, caret);
    const atIndex = upToCaret.lastIndexOf('@');
    if (atIndex === -1 || /\s/.test(upToCaret.slice(atIndex + 1))) {
      setMentionQuery(null);
      return;
    }
    setMentionQuery(upToCaret.slice(atIndex + 1));
  }

  function applyMention(name: string) {
    const el = getTextarea();
    const caret = el?.selectionStart ?? draft.length;
    const upToCaret = draft.slice(0, caret);
    const atIndex = upToCaret.lastIndexOf('@');
    if (atIndex === -1) return;
    const next = `${draft.slice(0, atIndex)}@${name} ${draft.slice(caret)}`;
    setDraft(next);
    setMentionQuery(null);
    requestAnimationFrame(() => el?.focus());
  }

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
            <p style={{ fontSize: 'var(--fs-small)', margin: 'var(--space-1) 0 0', whiteSpace: 'pre-wrap' }}>{renderBody(c.body, users)}</p>
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
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', position: 'relative' }}
      >
        <input type="hidden" name="applicationId" value={applicationId} />
        <div ref={wrapperRef}>
          <Textarea
            name="body"
            rows={2}
            placeholder="add a comment for the team… (type @ to mention someone)"
            value={draft}
            onChange={(e) => handleChange(e.target.value, e.target.selectionStart ?? e.target.value.length)}
            onKeyUp={(e) => handleChange(e.currentTarget.value, e.currentTarget.selectionStart ?? e.currentTarget.value.length)}
          />
        </div>
        {suggestions.length > 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              marginBottom: 'var(--space-1)',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-strong)',
              zIndex: 'var(--z-sticky)' as unknown as number,
              minWidth: 200,
            }}
          >
            {suggestions.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => applyMention(u.name)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: 'var(--space-2) var(--space-3)',
                  fontSize: 'var(--fs-small)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--text-primary)',
                }}
              >
                @{u.name}
              </button>
            ))}
          </div>
        )}
        <Button type="submit" variant="secondary" size="sm" disabled={pending || !draft.trim()} style={{ alignSelf: 'flex-start' }}>
          {pending ? 'posting…' : 'post comment'}
        </Button>
      </form>
    </div>
  );
}
