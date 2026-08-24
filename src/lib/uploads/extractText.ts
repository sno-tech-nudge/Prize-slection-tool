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
