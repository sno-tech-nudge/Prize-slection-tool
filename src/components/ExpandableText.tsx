'use client';
import React from 'react';

// only worth truncating once a field runs noticeably past a skimmable length — anything at or
// under this just renders in full, no button, so short answers never grow a pointless toggle.
const TRUNCATE_THRESHOLD_WORDS = 100;
// where the cut looks for a sentence boundary to land on, per the requested 70-100 word range —
// accumulating sentences until this is crossed naturally lands the cut somewhere in that band
// for ordinary prose, without ever stopping mid-sentence.
const TARGET_WORDS = 70;

function splitSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+(?:\s+|$)/g);
  return matches && matches.join('') === text ? matches : [text];
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

/** A long free-text answer field, truncated to a clean sentence boundary past ~70-100 words with
 *  a "read more" toggle — used for the handful of explainer fields (funders' funding nature, how
 *  the model works, adoption hurdles, tech use cases, verified impacts, prize fund plans) whose
 *  answers can otherwise run to several paragraphs and dominate the page. Renders in full, no
 *  toggle at all, when the answer is already short. */
export function ExpandableText({ text }: { text: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const textStyle: React.CSSProperties = {
    fontSize: 'var(--fs-body)',
    color: 'var(--text-primary)',
    lineHeight: 'var(--lh-relaxed)',
    whiteSpace: 'pre-wrap',
    margin: 0,
  };

  if (wordCount(text) <= TRUNCATE_THRESHOLD_WORDS) {
    return <p style={textStyle}>{text}</p>;
  }

  const truncated = truncateAtSentence(text, TARGET_WORDS);
  if (!truncated) {
    return <p style={textStyle}>{text}</p>;
  }

  return (
    <div>
      <p style={textStyle}>{expanded ? text : `${truncated}…`}</p>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        style={{
          marginTop: 'var(--space-2)',
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
