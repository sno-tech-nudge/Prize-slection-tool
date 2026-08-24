'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Textarea } from '@/design-system';
import { updateEmailTemplateAction } from '@/lib/mail/actions';

export interface EmailTemplateEditorData {
  acceptance: { subject: string; body: string };
  rejection: { subject: string; body: string };
}

type TemplateKind = 'acceptance' | 'rejection';

const TABS: { kind: TemplateKind; label: string }[] = [
  { kind: 'acceptance', label: 'acceptance template' },
  { kind: 'rejection', label: 'rejection template' },
];

export function EmailTemplateEditor({ templates, canManage }: { templates: EmailTemplateEditorData; canManage: boolean }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<TemplateKind>('acceptance');
  const [subject, setSubject] = React.useState(templates[activeTab].subject);
  const [body, setBody] = React.useState(templates[activeTab].body);
  const [pending, setPending] = React.useState(false);
  const [savedTab, setSavedTab] = React.useState<TemplateKind | null>(null);

  function switchTab(kind: TemplateKind) {
    setActiveTab(kind);
    setSubject(templates[kind].subject);
    setBody(templates[kind].body);
    setSavedTab(null);
  }

  return (
    <Card style={{ marginBottom: 'var(--space-6)' }}>
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        {TABS.map((t) => (
          <button
            key={t.kind}
            type="button"
            onClick={() => switchTab(t.kind)}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--fs-small)',
              textTransform: 'lowercase',
              padding: 'var(--space-2) var(--space-4)',
              border: `1px solid ${activeTab === t.kind ? 'var(--delta-red)' : 'var(--border-strong)'}`,
              background: activeTab === t.kind ? 'var(--delta-red)' : 'transparent',
              color: activeTab === t.kind ? 'var(--text-inverse)' : 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Input label="subject" value={subject} onChange={(e) => setSubject(e.target.value)} disabled={!canManage} />
        <Textarea
          label="body (plain text — use {{orgName}}, {{pocFirstName}}, {{challengeName}})"
          rows={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={!canManage}
        />
        {canManage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Button
              type="button"
              variant="cta"
              size="sm"
              disabled={pending}
              onClick={async () => {
                setPending(true);
                try {
                  const formData = new FormData();
                  formData.set('kind', activeTab);
                  formData.set('subject', subject);
                  formData.set('body', body);
                  await updateEmailTemplateAction(formData);
                  setSavedTab(activeTab);
                  router.refresh();
                } finally {
                  setPending(false);
                }
              }}
            >
              {pending ? 'saving…' : 'save template'}
            </Button>
            {savedTab === activeTab && <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>saved.</span>}
          </div>
        )}
      </div>
    </Card>
  );
}
