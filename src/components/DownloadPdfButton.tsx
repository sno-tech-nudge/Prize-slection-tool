'use client';
import React from 'react';
import { Button } from '@/design-system';

/** Renders the already-visible <main> content (the same print-friendly layout used by browser
 *  print — header/footer are siblings marked .no-print, not descendants, so capturing <main>
 *  alone already excludes them) into a real multi-page A4 PDF file, client-side. No server route
 *  or headless-browser dependency — html2canvas + jsPDF run entirely in the browser. */
export function DownloadPdfButton({ filename }: { filename: string }) {
  const [pending, setPending] = React.useState(false);

  return (
    <Button
      variant="secondary"
      disabled={pending}
      onClick={async () => {
        const main = document.querySelector('main');
        if (!main) return;
        setPending(true);
        try {
          const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);

          const cardBackground = getComputedStyle(document.documentElement).getPropertyValue('--surface-card').trim();
          const canvas = await html2canvas(main as HTMLElement, { scale: 2, useCORS: true, backgroundColor: cardBackground });

          const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();

          const imgWidth = pageWidth;
          const pxPerPdfPage = (canvas.width * pageHeight) / pageWidth;

          let renderedHeight = 0;
          let pageIndex = 0;
          while (renderedHeight < canvas.height) {
            const sliceHeight = Math.min(pxPerPdfPage, canvas.height - renderedHeight);
            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = sliceHeight;
            const ctx = sliceCanvas.getContext('2d');
            ctx?.drawImage(canvas, 0, renderedHeight, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

            if (pageIndex > 0) pdf.addPage();
            pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, imgWidth, (sliceHeight * imgWidth) / canvas.width);

            renderedHeight += sliceHeight;
            pageIndex += 1;
          }

          pdf.save(`${filename}.pdf`);
        } finally {
          setPending(false);
        }
      }}
    >
      {pending ? 'generating pdf…' : 'download PDF'}
    </Button>
  );
}
