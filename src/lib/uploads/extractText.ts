import { parseCsv } from '@/lib/csv';

// dynamically imported rather than a static top-level import — pdf-parse@2 (pdfjs-dist) crashed
// the ENTIRE /applications page for every role in production ("ReferenceError: DOMMatrix is not
// defined", from an optional native canvas dependency pdfjs-dist can't find on Vercel) simply by
// being imported, whether or not a pdf was ever actually parsed. Kept as a second line of defense
// so a future dependency problem here can only break the pdf-viewing code path itself, not every
// page that happens to import this module.
//
// unpdf (not pdf-parse@1) is the actual extractor — pdf-parse@1's own bundled pdf.js build is from
// ~2015 and can't read modern PDF structures (cross-reference streams, common in anything
// exported from Word/Google Docs/a modern print-to-pdf), so a real uploaded rubric pdf came back
// "could not read" while a trivial test pdf worked fine. unpdf ships a current, serverless-safe
// pdf.js build with no canvas/DOM dependency, and correctly reads the same file pdf-parse@1 failed
// on (verified locally before switching).
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const { getDocumentProxy, extractText } = await import('unpdf');
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text } = await extractText(pdf, { mergePages: true });
  return text.trim();
}

/** Turns a rubric/guidelines csv into flowing text instead of a grid — just the cell content
 *  itself, in reading order, no column-name labels attached. Each row's non-empty cells become
 *  their own line; rows are separated by a blank line. */
export function csvToReadableText(csvText: string): string {
  const rows = parseCsv(csvText).filter((r) => r.some((c) => c.trim().length > 0));
  return rows
    .map((row) =>
      row
        .map((c) => c.trim())
        .filter(Boolean)
        .join('\n'),
    )
    .filter(Boolean)
    .join('\n\n');
}
