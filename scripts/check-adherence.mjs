#!/usr/bin/env node
/**
 * Companion to design-system/_adherence.oxlintrc.json.
 *
 * That file encodes the^delta brand rules as ESLint-style AST selectors
 * (no-restricted-syntax with `selector` strings). The oxlint version pinned
 * in this repo (chosen for Node 18 compatibility — see README) does not
 * execute custom selector rules, so it silently passes raw hex/px. This
 * script re-implements the same checks with plain regex over `src/` so the
 * brand law in the build brief is actually enforced, not just declared.
 *
 * Run via `npm run lint` (alongside real oxlint, which still catches
 * standard correctness/unused-vars issues).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const SRC = join(process.cwd(), 'src');
const ALLOWED_FONTS = ['Mulish', 'Cormorant'];
const EXT = new Set(['.ts', '.tsx']);

// Transactional HTML email cannot use CSS custom properties (var(--token)) — Gmail, Outlook and
// most mail clients strip or ignore them. Literal hex/px values in rendered email markup are a
// documented, deliberate exception to the token rule, not a lapse — the literals there are copied
// straight from tokens/colors.css so they still match the brand palette exactly.
const EXEMPT_FILES = ['src/lib/mail/templates.ts'];

/** @type {string[]} */
const violations = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === 'design-system') continue; // the DS port itself defines the tokens
      walk(full);
    } else if (EXT.has(extname(entry)) && !EXEMPT_FILES.some((f) => full.split(/[\\/]/).join('/').endsWith(f))) {
      checkFile(full);
    }
  }
}

function checkFile(path) {
  const text = readFileSync(path, 'utf8');
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const lineNo = i + 1;

    // raw hex color, e.g. #b21010 / #fff — allow var(--token) fallbacks and comments
    const hexMatches = line.match(/#[0-9a-fA-F]{3,8}\b/g);
    if (hexMatches) {
      violations.push(`${path}:${lineNo}  raw hex color ${hexMatches[0]} — use a design-system color token via var()`);
    }

    // raw px in a *string* literal, e.g. '12px' — numeric style props (12) are fine, that's the DS convention.
    // Border-width shorthand ("1px solid ...") and grid track sizing (minmax/repeat) are structural, not
    // spacing-scale values, and have no token equivalent — the shipped DS components use them the same way.
    const pxMatches = line.match(/['"`][^'"`]*\b\d+px\b[^'"`]*['"`]/g);
    const structuralPx = pxMatches?.filter(
      (m) => /\d+px\s+(solid|dashed|dotted|none)/.test(m) || /(minmax|repeat)\(/.test(m),
    );
    if (pxMatches && pxMatches.length !== (structuralPx?.length ?? 0)) {
      violations.push(`${path}:${lineNo}  raw px value ${pxMatches[0]} — use a design-system spacing token via var()`);
    }

    // font-family strings that aren't Mulish/Cormorant/var(--font-*)
    const fontFamilyMatch = line.match(/fontFamily:\s*['"`]([^'"`]+)['"`]/);
    if (fontFamilyMatch) {
      const value = fontFamilyMatch[1];
      const isVar = value.startsWith('var(');
      const isAllowed = ALLOWED_FONTS.some((f) => value.includes(f));
      if (!isVar && !isAllowed) {
        violations.push(`${path}:${lineNo}  font-family "${value}" not provided by the design system (Mulish, Cormorant)`);
      }
    }
  });
}

walk(SRC);

if (violations.length > 0) {
  console.error(`\nthe^delta adherence check — ${violations.length} violation(s):\n`);
  for (const v of violations) console.error('  ' + v);
  console.error('\nFix these before merging — see design-system/SKILL.md.\n');
  process.exit(1);
} else {
  console.log('the^delta adherence check — clean. no raw hex, no raw px strings, no off-brand fonts in src/.');
}
