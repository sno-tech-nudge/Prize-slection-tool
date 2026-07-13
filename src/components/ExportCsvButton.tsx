'use client';
import { Button } from '@/design-system';

export function ExportCsvButton({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  function download() {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value);
    }
    window.location.href = `/api/applications/export?${params.toString()}`;
  }

  return (
    <Button variant="secondary" onClick={download}>
      export CSV
    </Button>
  );
}
