'use client';
import React from 'react';
import { Tabs } from '@/design-system';

export function ApplicationDetailTabs({
  applicationContent,
  reviewContent,
}: {
  applicationContent: React.ReactNode;
  reviewContent: React.ReactNode;
}) {
  const [tab, setTab] = React.useState('application');

  return (
    <div>
      <Tabs
        items={[
          { id: 'application', label: 'application' },
          { id: 'review', label: 'review' },
        ]}
        value={tab}
        onChange={setTab}
        style={{ marginBottom: 'var(--space-6)' }}
      />
      {tab === 'application' ? applicationContent : reviewContent}
    </div>
  );
}
