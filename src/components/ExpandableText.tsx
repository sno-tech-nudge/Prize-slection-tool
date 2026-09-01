'use client';
import React from 'react';

// only worth truncating once a field runs noticeably past a skimmable length — anything at or
// under this just renders in full, no button, so short answers never grow a pointless toggle.
const TRUNCATE_THRESHOLD_WORDS = 160;
// where the cut looks for a sentence boundary to land on, per the requested 150-160 word range —
// accumulating sentences until this is crossed naturally lands the cut in that band for ordinary
// prose, without ever stopping mid-sentence.
const TARGET_WORDS = 150;

// a paragraph that opens with a short "Label — " lead-in (the application synopsis's own format —
// "Model — ...", "Regenerative approach — ...") gets that lead-in rendered bold, everything else
// renders as plain prose. Harmless no-op for fields that don't use this convention.
const LABEL_LEAD_IN = /^([A-Z][A-Za-z][A-Za-z /&-]{0,38}) — /;

// Real applicant free text very often doesn't end with a final ".", "!" or "?" (people just stop
// typing) — a strict "every chunk must end in punctuation" split would then fail to account for
// that trailing remainder and silently disable truncation for the whole field. Instead, capture
// whatever properly-terminated sentences exist, then append any leftover un-terminated text as one
// final chunk so it still participates in the word-count accumulation below.
function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+(?:\s+|$)/g) ?? [];
  const remainder = text.slice(matches.join('').length);
  return remainder.trim().length > 0 ? [...matches, remainder] : matches;
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function truncateAtSentence(text: string, targetWords: number): string | null {
  const sentences = splitSentences(text);
  if (sentences.length <= 1) return null; // no sentence boundary to cut at — leave it whole
  let words = 0;
  let end = 0;
  for (const s of sentences) {
    words += wordCount(s);
    end += s.length;
    if (words >= targetWords) break;
  }
  if (end >= text.length) return null; // the whole text is one accumulation, nothing was cut
  return text.slice(0, end).trimEnd();
}

// splits on blank lines into paragraphs, bolding any "Label — " lead-in each paragraph opens
// with. Every field renders through this — plain single-paragraph prose with no such lead-in
// just comes out as one unstyled paragraph, identical to before.
function renderParagraphs(text: string): React.ReactNode {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  return paragraphs.map((para, i) => {
    const match = para.match(LABEL_LEAD_IN);
    return (
      <p key={i} style={{ margin: i === 0 ? 0 : undefined, marginTop: i === 0 ? 0 : 'var(--space-3)' }}>
        {match ? (
          <>
            <strong style={{ fontWeight: 'var(--fw-bold)' as unknown as number }}>{match[1]} — </strong>
            {para.slice(match[0].length)}
          </>
        ) : (
          para
        )}
      </p>
    );
  });
}

/** A long free-text answer field, truncated to a clean sentence boundary past ~150-160 words with
 *  a "read more" toggle — used everywhere a free-text answer can run long: the application
 *  synopsis, funders' funding nature, how the model works, adoption hurdles, tech use cases,
 *  verified impacts, prize fund plans. Renders in full, no toggle at all, when the answer is
 *  already short. Paragraphs separated by a blank line render with consistent spacing, and any
 *  paragraph opening with a short "Label — " lead-in (the synopsis's own convention) gets that
 *  lead-in bolded as a subheading rather than shown as plain inline text. */
export function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const containerStyle: React.CSSProperties = {
    fontSize: 'var(--fs-body)',
    color: 'var(--text-primary)',
    lineHeight: 'var(--lh-relaxed)',
    whiteSpace: 'pre-wrap',
  };

  if (wordCount(text) <= TRUNCATE_THRESHOLD_WORDS) {
    return <div style={containerStyle}>{renderParagraphs(text)}</div>;
  }

  const truncated = truncateAtSentence(text, TARGET_WORDS);
  if (!truncated) {
    return <div style={containerStyle}>{renderParagraphs(text)}</div>;
  }

  return (
    <div>
      <div style={containerStyle}>{renderParagraphs(expanded ? text : `${truncated}…`)}</div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: 'block',
          marginTop: 'var(--space-2)',
          marginLeft: 'auto',
          padding: 0,
          border: 'none',
          background: 'none',
          color: 'var(--delta-red)',
          fontSize: 'var(--fs-caption)',
          fontWeight: 'var(--fw-bold)' as unknown as number,
          textTransform: 'uppercase',
          letterSpacing: 'var(--ls-wide)',
          cursor: 'pointer',
        }}
      >
        {expanded ? 'read less' : 'read more'}
      </button>
    </div>
  );
}
