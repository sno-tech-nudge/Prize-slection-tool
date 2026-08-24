import { parseCsv } from '@/lib/csv';

// dynamically imported rather than a static top-level import — pdf-parse@2 (pdfjs-dist) crashed
// the ENTIRE /applications page for every role in production ("ReferenceError: DOMMatrix is not
// defined", from an optional native canvas dependency pdfjs-dist can't find on Vercel) simply by
// being imported, whether or not a pdf was ever actually parsed. Pinned to pdf-parse@1 (a pure-JS,
// text-only extractor with no canvas/DOM dependency) as the real fix; the dynamic import is kept
// as a second line of defense so a future dependency problem here can only break the pdf-viewing
// code path itself, not every page that happens to import this module.
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default;
  const result = await pdfParse(buffer);
  return result.text.trim();
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
