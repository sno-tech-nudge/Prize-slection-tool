# the^delta prize — application platform (prototype)

An end-to-end prize-challenge selection platform for **the^delta prize**, a the/nudge institute
initiative. This build targets the regenerative agriculture / AgWater challenge, sponsored by
DCM Shriram — application ingestion, AI-assisted scoring, human review, jury, rejection-email
automation, target-startup matching and analytics, seeded from the historical 134-applicant
workbook (78 shortlisted).

This is a prototype: optimised for a fully clickable end-to-end flow, real AI scoring on seeded
data, and cleanly stubbed external integrations — not a production launch.

**This is a team tool, not an applicant-facing site.** `/` redirects straight to `/dashboard` —
the internal platform is the front door. The public marketing/apply/status pages still exist
(they demonstrate the ingestion schema and are the future home of a swap to Zoho/Google Form
webhooks) but live at `/challenge`, `/apply`, `/status` and are not linked from primary nav.

## Beyond the original brief

A few things were added on top of the phased build above, in response to later feedback:

- **Kanban board** (`/applications/board`) — drag-and-drop pipeline view. Illegal drops (skipping
  a stage) are rejected client-side before any server call, with a toast explaining why.
- **Confirmation emails on every advance** — not just rejection. Shortlist/finalist/winner
  transitions now queue a congratulatory email the same way rejections do (see
  `STAGE_EMAIL_TEMPLATE` in `src/lib/applications/actions.ts`).
- **Explicit AI-score override** — an admin can directly correct an `AiEvaluation`'s composite
  and disposition with a recorded reason (`src/components/AiOverridePanel.tsx`), distinct from a
  reviewer's independent `HumanReview`. The override propagates everywhere the score is shown,
  including the AI-calibration backtest on `/analytics`.
- **Rubric versioning** — every `AiEvaluation` snapshots the rubric weights and a version number
  in effect when it ran, so changing weights in `/settings` later never silently reinterprets
  old scores.
- **Async job queue** (`src/lib/jobs/queue.ts`) — a `Job` table replaces the old inline
  synchronous calls. Ingestion (apply form, `/api/ingest` webhook) and the automation panel's
  bulk actions enqueue jobs and return immediately; a client-side ticker
  (`src/components/JobQueueTicker.tsx`) polls `/api/jobs/tick` every 3.5s to drain them, visible
  as a "processing N jobs" badge in the header. Swap point for production: point
  `processPendingJobs` at a real queue consumer (SQS/BullMQ/pg-boss) instead of polling.
- **Public-data enrichment** (`src/lib/enrichment/`) — a real, working website scraper (no API
  key needed): fetches the applicant's own site server-side and extracts title/description/an
  excerpt, which then feeds into the AI scoring prompt as corroborating (not authoritative)
  evidence. Search-based enrichment (news mentions, funding rounds) is a documented stub behind
  `SEARCH_API_KEY` — wire in Google Custom Search, Gemini grounding, or SerpAPI there.

## Run it

```
npm install
npm run db:reset      # (re)creates prisma/dev.db from schema.prisma
npm run db:seed       # imports the AgWater workbook, seeds users/targets/reviews/outbox
npm run dev
```

No live external credentials are required to run the full demo. Set `ANTHROPIC_API_KEY` in
`.env` for real Claude scoring — without it, `npm run score:all` and the seed's scoring step
fall back to a transparent, clearly-labelled heuristic scorer (`model: heuristic-fallback-v1`).

Switch identity with the role dropdown in the header (dev-only role switcher — see
[Assumptions](#assumptions-flagged-for-correction)). Ten users are seeded: 2 admins (Nisha
Chawla, Sravya Jandhyala), 4 reviewers, 3 jurors, 1 observer.

## Assumptions (flagged for correction)

- **Stack**: Next.js 14 (App Router) + Prisma + SQLite, chosen for a zero-setup local prototype.
  SQLite has no native Prisma enum support, so every enum-like column is a `String`; the
  canonical value lists live as TS union types in `src/lib/constants.ts` (see the comment block
  at the top of `prisma/schema.prisma`).
- **Auth**: a dev-only role switcher (httpOnly cookie), not real sign-in. Every read/write path
  already goes through `getCurrentUser()` (`src/lib/auth/session.ts`) and role guards
  (`src/lib/auth/guard.ts`), so swapping in Supabase Auth / Clerk is mechanical — replace
  `session.ts`, keep the guard call sites.
- **Email**: an in-app `OutboxEmail` table + preview UI, never a live send. See
  [Rejection email swap](#rejection-email-swap) below.
- **This year's applications**: not live yet (they'll arrive via Zoho CRM). The prototype is
  seeded entirely from `data/Copy_of_Applicants_details_-_DCM_Shriram_AgWater_Challenge.xlsx`.
- **AI scoring model**: `claude-sonnet-4-6` via `@anthropic-ai/sdk`, gated behind
  `ANTHROPIC_API_KEY`. Composite is a weighted average of eight rubric criteria
  (`src/lib/scoring/rubric.ts`), recomputed server-side from admin-tunable weights
  (`/settings`) even when the model returns its own composite estimate.
- **Target wishlist**: `data/target_startups.sample.csv` mixes ~22 real applicant org names
  (so the matcher has something to find) with ~78 plausible placeholder names. Replace via
  CSV upload on `/targets` (admin only).
- **oxlint version**: pinned to `0.18.1` (not the latest 1.x line) for Node 18 compatibility in
  this environment. See [Adherence linting](#adherence-linting) for why a companion script
  exists alongside it.

## Swap points (production path)

### Application source — Zoho CRM
`src/lib/sources/` defines one `ApplicationSource` interface with three implementations:
- `SeedSource` — reads the AgWater workbook. Used today (`APPLICATION_SOURCE=seed`).
- `ZohoCrmSource` — stub. `pull()` returns an empty array and logs a warning; `toApplication()`
  is already wired to a field-mapping table (see the comment block in
  `src/lib/sources/zoho-crm-source.ts`) so the real swap is: implement OAuth token refresh +
  a COQL/records fetch in `pull()`, confirm the Zoho field API names with the CRM admin, done.
- `GoogleFormSource` — stub for a Google Apps Script `onFormSubmit` → `POST /api/ingest` webhook
  (shared secret via `GOOGLE_INGEST_SECRET`). Route already exists at
  `src/app/api/ingest/route.ts`.

Switch via the `APPLICATION_SOURCE` env var / the "active application source" field on
`/settings` (the setting is stored; wiring a scheduled Zoho poll to read it is the remaining
step).

### Rejection email swap
`src/lib/mail/mailer.ts` defines a `Mailer` interface:
- `StubMailer` (default) — never touches the network; the Outbox row itself is the audit trail.
- `ResendMailer` — behind `EMAIL_PROVIDER=resend`. Even when enabled, it **refuses to send**
  unless `TEST_EMAIL_OVERRIDE` is set, and always sends there instead of the real recipient —
  a real founder's inbox cannot be reached by flipping one flag alone, on purpose.

To go live: get a Resend API key, set `EMAIL_PROVIDER=resend` + `RESEND_API_KEY`, and when
ready to actually reach founders, remove the `TEST_EMAIL_OVERRIDE` guard in `ResendMailer.send()`.

### Auth swap
Replace `src/lib/auth/session.ts`'s `getCurrentUser()` with a real session lookup. Every
call site already expects a `User | null` and funnels through `assertRole()` /
`visibleApplicationWhere()` in `src/lib/auth/guard.ts`, so RLS-equivalent scoping (reviewers see
only assigned applications, jury see only shortlisted+) carries over unchanged.

### Database swap
Change `DATASOURCE_URL` and `provider` in `prisma/schema.prisma` from `sqlite` to `postgresql`
and re-run `npx prisma db push`. All queries are ORM-level (no raw SQL), so this is a
datasource-only change — except that Postgres *does* support native enums, so the
`String`-typed enum columns could be upgraded to real `enum` types if desired (optional).

## Design system adherence

The provided `design-system/` folder is copied in verbatim and its global stylesheet is loaded
once from the root layout (`src/styles/globals.css` → `design-system/styles.css`). All UI is
built from the ported component barrel at `src/design-system/` (typed re-exports of the
provided Button, Card, Badge, Input, etc.) — no hand-rolled buttons/inputs/cards.

### Adherence linting
`design-system/_adherence.oxlintrc.json` ships with custom ESLint-style `no-restricted-syntax`
AST-selector rules (raw hex, raw px, off-contract props). The oxlint version pinned here
(`0.18.1`, chosen for Node 18 compatibility) **does not execute custom selector rules** — it
runs clean even against a raw-hex test file. Real oxlint's rule engine doesn't yet support that
ESLint feature at this version.

To actually enforce the brand law rather than just declare it, `scripts/check-adherence.mjs` is
a small companion script that re-implements the same checks via regex over `src/` (raw hex,
raw px string literals, non-system fonts), with two deliberate, documented exceptions:
- Border-width shorthand (`'1px solid ...'`) and CSS grid track sizing (`minmax()`/`repeat()`)
  — structural values with no spacing-token equivalent; the shipped DS components use the same
  pattern.
- `src/lib/mail/templates.ts` — transactional HTML email can't use `var(--token)` (mail clients
  strip custom properties), so its literal hex/px values are copied straight from
  `tokens/colors.css` and exempted by name.

`npm run lint` runs oxlint (for standard correctness rules) + the adherence script + `tsc
--noEmit`, in that order. CI should treat all three as build blockers.

## Deploying to Vercel

The database is Postgres (a dedicated `delta_admin` schema on the Supabase project's Postgres
instance — deliberately separate from the `applications` source table so Prisma migrations never
touch externally-owned data). Steps:

1. **Get connection strings** — Supabase dashboard → Project Settings → Database → Connection
   string. You need both:
   - `DATABASE_URL` — the pooled connection, port `6543`, with `?pgbouncer=true` appended
   - `DIRECT_URL` — the direct connection, port `5432`
   - Append `&schema=delta_admin` (or `?schema=delta_admin` if it's the first param) to both.
2. **Push the schema once** against the real database: `DATABASE_URL=... DIRECT_URL=... npx prisma db push`
   (creates the `delta_admin` schema and all tables — safe to re-run).
3. **Seed or sync**: either `npm run db:seed` for demo data, or set `APPLICATION_SOURCE=supabase`
   and trigger a sync from `/settings` once deployed to pull the real applications.
4. **Push to git + connect on Vercel** (or `vercel --prod` from the CLI) and set every variable
   from `.env.example` in the Vercel project's Environment Variables — most importantly
   `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`.
5. `postinstall` runs `prisma generate` automatically on every Vercel build, so no manual step
   is needed there.

**Known gap**: the dev-only role switcher (`src/lib/auth/session.ts`, `src/lib/auth/actions.ts`)
has no real authentication — anyone with the URL can switch to ADMIN via the header dropdown.
Fine for an internal prototype behind a private URL; add real auth (NextAuth, Clerk, etc.) before
sharing the link outside a trusted circle.

## Repository notes

- `prisma/seed.ts` is idempotent — it clears all tables before reseeding, so `npm run db:seed`
  can be re-run any time (e.g. after changing the matcher or scoring logic).
- `npm run score:all` scores every application that doesn't yet have an `AiEvaluation` (or
  re-scores everything if run after clearing evaluations) — uses Claude if `ANTHROPIC_API_KEY`
  is set, the heuristic fallback otherwise.
- The target matcher (`src/lib/matching/matcher.ts`) is idempotent per-application, and
  intentionally never lets a later, weaker coincidental match downgrade an already-confirmed
  higher-confidence link on the same `Target` row (first-write-wins-if-better).
- The dashboard's **automation** panel (`src/components/AutomationPanel.tsx`) exposes "score all
  unscored" and "re-run target matcher" as one-click buttons backed by
  `src/lib/automation/actions.ts` — the same operations `score:all` runs from the CLI, but
  reachable without a terminal. Bulk scoring is capped at 40 applications per click (click again
  to pick up the rest) to keep the request responsive.
