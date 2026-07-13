# the^delta — Design System

A design system for **the^delta**, a the/nudge initiative: a platform and social ecosystem that helps social entrepreneurs learn, collaborate and build the networks that turn passion into purpose. Programs run under the parent lock-up as **the^delta incubator**, **the^delta accelerator** and **the^delta prize**.

The name is **always written `the^delta`** — lowercase, with the red caret between the words.

## Sources
- `uploads/the^delta brand guidelines.pdf` (24 pp) — the sole source. Copy, colour, typography, logo geometry, imagery rules and collateral examples were all extracted from it. Extracted reference images live in `scraps/` and `assets/imagery/`.
- No codebase, Figma or slide template was provided. Components below are an authored standard set sized to the brand; the two UI kits recreate the brand's real surfaces (marketing site + collateral).

---

## Font substitutions (ACTION NEEDED)
The brand fonts are licensed and were **not** shipped with the guidelines. The system currently substitutes the nearest free matches:
- **Avenir** (headings bold/lowercase, body light/sentence case) → **Mulish**
- **Argent** (emphasis words, roles, taglines — italic) → **Cormorant** (italic)

➡️ **Please provide the licensed Avenir and Argent CF web kits** and we'll swap them into `tokens/fonts.css` for pixel-accurate type.

---

## CONTENT FUNDAMENTALS
How the^delta writes.

- **Core messaging:** empowerment, growth, innovation, opportunity, acceleration, future-thinking.
- **Tone:** inspirational, motivating, action-oriented — always momentum and progress. Humble and collaborative, yet aspirational; emphasises impact, growth and future potential.
- **Voice:** professional but approachable, excited about possibility. Copy reads like an invitation to a community of forward-thinkers and doers.
- **Person:** speaks to "you" (the entrepreneur) and about "we/our" (the ecosystem). Collective and inviting, not corporate.
- **Casing:** headings and the wordmark are **lowercase**. Body is **sentence case**. Button CTAs appear both lowercase ("apply now") and as uppercase tracked labels on collateral ("APPLY NOW").
- **Emphasis:** a single highlighted word set in **Argent italic** (e.g. transform your ideas into *impact*). Roles and taglines also use Argent italic.
- **Spelling:** **UK spellings** — centre, organisation, programme… **Exception: "program"** (US spelling) is retained, as it is used across collateral and in program names.
- **Emoji:** not used.
- **Example lines:** "transform your ideas into *impact*" · "registration now open for 2025 cohort" · "the catalyst and the community, together."

---

## VISUAL FOUNDATIONS

**Colours** (`tokens/colors.css`)
- `#b21010` **delta red** — passion, action, transformation. The signature accent: caret, CTAs, emphasis, active states, diagonal cuts.
- `#363d3f` **charcoal** — headings/ink, dark sections, apparel.
- `#6e7475` **muted slate** — body/secondary text, program sub-labels.
- `#f0f0f0` **light grey** — "the blank canvas": section and card grounds.
- `#f4c024` **vivid yellow** — accent ONLY, **≤10%** of any composition (quotation marks, the odd highlight). Never dominant; always subdued by the primaries.
- Photography leans black-and-white (see Imagery). Compositions should be ~60% brand colour.

**Type** (`tokens/typography.css`)
- Sans: Mulish (Avenir). Headings 700 lowercase, tight leading; body 300 sentence case, relaxed leading.
- Serif: Cormorant (Argent), italic only, for emphasis words / roles / taglines.
- Scale: display 64 · h1 44 · h2 32 · h3 24 · h4 20 · body 16 · caption 12.

**Spacing & layout** (`tokens/spacing.css`) — 4px base unit. Generous whitespace; the logo keeps clear space around it.

**Corners & edges** — **SHARP. All radii are 0.** No curved or circular borders on any element, button, icon, input or placeholder. Even radio/checkbox/switch indicators are square. Rounding is reserved only for true logo/photo exceptions handled manually.

**Signature motif — the angular cut** (`--delta-cut`) — blank canvases framed by sharp red diagonal triangles (top-left + bottom-right). See `AngularBanner` and the collateral banner.

**Backgrounds** — mostly white or light-grey blank canvas; charcoal for dark sections/footers. No gradients as brand decoration (only functional photo-legibility scrims). No patterns/textures.

**Borders** — hairline `--border-subtle` (#e2e4e4) on light cards; charcoal `--border-strong` for emphasis; red for accents/focus.

**Shadow** — restrained and flat. Cards are usually bordered-flat; `--shadow-md/lg` used sparingly for modals and raised cards.

**Motion** (`tokens/effects.css`) — purposeful, forward. `--ease-out` (no elastic bounce), 120–360ms. Momentum and progress, never playful bounce.

**Hover states** — primary/CTA darken to `--red-700`; secondary fills charcoal with inverse text; ghost/links deepen red. **Press** stays colour-based, not scale-based (brand is square and stable).

**Focus** — 2px red outline with offset (`--focus-ring` / red).

**Cards** — square, flat, hairline border (or subtle shadow when `elevated`); optional 4px red accent bar on the top or left edge.

**Transparency & blur** — used only for photo scrims (charcoal at ~15–75% for text legibility). No frosted-glass decoration.

**Imagery vibe** — documentary, human, warm subjects but **controlled colour**: colour photos are shown black & white; toned red/mono illustrations preferred (line drawings and silhouettes, never playful colourful vectors). Secondary colours may appear in incidental image elements, never in main elements or text.

---

## ICONOGRAPHY
- The guidelines define **no bespoke icon set** and ship no icon assets. They do require that icons follow the same rules as everything else: **sharp edges, no curves/circles, primary colours only**, minimal and clean.
- **Recommendation (flagged substitution):** use **Lucide** (via CDN) with **`stroke-linejoin="miter"` / square linecaps** so joins read sharp and on-brand. Keep icons monochrome in charcoal or red. Lucide is a substitution — swap for a brand icon set if one is later provided.
- **Emoji:** never.
- **Unicode as icons:** the caret `^` is the one brand glyph (it is the logo, not a UI icon). Small affordances in this system use simple marks (× for close/remove, ▾ for select, a CSS triangle for the "apply now ▶" arrow) rather than an icon font, to stay dependency-free.
- The **caret mark** is provided as SVG in `assets/logos/` (red / dark / white) and inline in the `Logo` component (`variant="mark"`).

---

## Index / manifest

**Root**
- `styles.css` — global entry point (import this); `@import`s all token files.
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `effects.css`.
- `assets/logos/` — `caret-red.svg`, `caret-dark.svg`, `caret-white.svg`.
- `assets/imagery/` — extracted brand photos + `portrait-sonali-bw.png` (clean B&W portrait).
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand).
- `SKILL.md` — Agent-Skills-compatible entry point.

**Components** (`components/`, namespace `window.TheDeltaDesignSystem_88b8ab`)
- brand/ — **Logo**, **AngularBanner**
- core/ — **Button**, **IconButton**, **Card**, **Badge**, **Tag**
- forms/ — **Input**, **Textarea**, **Select**, **Checkbox**, **Radio**, **Switch**
- feedback/ — **Dialog**, **Toast**, **Tooltip**
- navigation/ — **Tabs**
- content/ — **Quote**

**UI kits** (`ui_kits/`)
- website/ — interactive marketing site (home · programs · apply).
- collateral/ — reusable creative templates (social post · testimonial · banner).

**Intentional additions** (no source component library existed)
- `AngularBanner` — encodes the diagonal-cut hero motif seen throughout the collateral.
- `Quote` — encodes the recurring testimonial card layout.
- `Logo` — the wordmark/caret is central to the brand and used everywhere.

---

## Caveats
- Fonts are substituted (Avenir→Mulish, Argent→Cormorant) — see above.
- Extracted photos have baked-in text; only `portrait-sonali-bw.png` is a clean crop. Collateral templates use drop-in `<image-slot>`s for photography.
- Stats and body copy in the UI kits are illustrative placeholders.
