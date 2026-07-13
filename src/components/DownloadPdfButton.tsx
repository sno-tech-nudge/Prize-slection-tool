'use client';
import { Button } from '@/design-system';

/** Every application detail page is print-friendly (nav/footer hidden via the `.no-print`
 *  global rule), so "download PDF" is just the browser's native print-to-PDF — no extra
 *  PDF-generation dependency needed. */
export function DownloadPdfButton() {
  return (
    <Button variant="secondary" onClick={() => window.print()}>
      download PDF
    </Button>
  );
}
