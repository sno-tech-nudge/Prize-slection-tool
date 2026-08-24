import { PDFParse } from 'pdf-parse';
import { parseCsv } from '@/lib/csv';

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}

/** Turns a rubric/guidelines csv into flowing text instead of a grid — each data row becomes a
 *  "header: value" block, blank cells dropped, rows separated by a blank line. Reads like a
 *  document, matching how the rest of the app presents free text rather than tabular data here. */
export function csvToReadableText(csvText: string): string {
  const rows = parseCsv(csvText).filter((r) => r.some((c) => c.trim().length > 0));
  if (rows.length === 0) return '';
  const [header, ...body] = rows;
  return body
    .map((row) =>
      header
        .map((h, i) => (row[i]?.trim() ? `${h.trim() || `column ${i + 1}`}: ${row[i].trim()}` : null))
        .filter(Boolean)
        .join('\n'),
    )
    .filter(Boolean)
    .join('\n\n');
}
