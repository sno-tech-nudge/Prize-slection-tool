# the^delta prize — rapid re.gen challenge — internal admin tool

Internal Next.js/Prisma tool for managing applications to the **"rapid re.gen challenge"** (a
startup/NGO challenge run by the^delta prize; the codebase and some historical data still say
"AgWater" in places — that was the previous cycle's name, deliberately kept for the 134 legacy
rows... which have since been **deleted**, see "current data state" below). Roles: ADMIN,
REVIEWER, JURY, OBSERVER. AI-assisted scoring + human review + jury round + email outreach bot,
all against one shared 8-criterion rubric.

Read this whole file before making changes — it's the fastest way to get oriented in a codebase
that has been through several major pivots in one long session.

## Stack

- Next.js 14 App Router, TypeScript strict mode, React 18.
- Prisma ORM + **SQLite** (`prisma/dev.db`). All Prisma "enums" are plain `String` columns —
  canonical value lists + labels live in [src/lib/constants.ts](src/lib/constants.ts).
- `@anthropic-ai/sdk` for AI scoring (falls back to a heuristic scorer if no API key).
- `@supabase/supabase-js` — read-only client for the **live production backend** (see below).
- No Redis / external queue — async jobs are a DB table drained by client-side polling.
- Custom design system in `design-system/` + `src/design-system/` (sharp corners, no
  border-radius, no circles, lowercase headings, Mulish sans + Cormorant italic serif, red
  `#b21010` accent). Enforced by `npm run lint`.

## Commands

```
npm run dev         # start dev server (localhost:3000)
npm run lint         # oxlint + design-system adherence checker + tsc --noEmit — run before calling anything done
npm run db:push      # push prisma/schema.prisma to dev.db (no migration files, just push)
npm run db:seed       # tsx prisma/seed.ts — seeds demo users + (historically) legacy apps
npm run db:reset       # delete dev.db and db:push fresh
npm run score:all      # tsx scripts/score-all.ts — batch AI-score every unscored application
```

`npm run lint` is the single command that must pass clean before considering any change done —
it chains oxlint, `scripts/check-adherence.mjs` (regex scanner for raw hex colors / px strings /
off-brand fonts), and `tsc --noEmit`.

**Known dev-server quirk**: renaming an exported symbol (a query function, a component) sometimes
throws a stale "not exported from..." error on hot-reload even after the source is fixed. Fix:
fully stop and restart the dev server, don't just wait for fast-refresh.

## Data sources — how applications get into the database

`src/lib/sources/` is a pluggable ingestion layer, selected by `activeSource` in
[src/lib/settings.ts](src/lib/settings.ts) (`DeltaSettings.activeSource`, editable at `/settings`):

- **`supabase`** — **the live, real, production data source**. [supabase-source.ts](src/lib/sources/supabase-source.ts)
  pulls every row from a live Supabase Postgres `applications` table (fed automatically by the
  team's Zoho Creator form) and upserts into the local DB keyed by `externalId` = Supabase row
  id. Defensive parsing throughout (tries multiple plausible JSONB key names, never throws on one
  bad row). Triggered from `/settings` via the "sync from supabase" button
  ([SupabaseSyncPanel.tsx](src/components/SupabaseSyncPanel.tsx) →
  `syncSupabaseAction` in [automation/actions.ts](src/lib/automation/actions.ts)). Every newly
  created application is automatically stage-seeded, queued for AI scoring/enrichment/matching,
  and assigned reviewers (see "reviewer assignment" below).
  Client: [supabase-client.ts](src/lib/sources/supabase-client.ts) — `getSupabaseClient()`
  returns `null` if `SUPABASE_URL`/`SUPABASE_ANON_KEY` env vars aren't set (graceful "not
  configured" UI state).
- **`seed`** — [seed-source.ts](src/lib/sources/seed-source.ts), the historical AgWater-cycle
  xlsx import. Was live; the applications it produced have since been bulk-deleted (see below).
- **`zoho_crm`** / **`google_form`** — documented stubs
  ([zoho-crm-source.ts](src/lib/sources/zoho-crm-source.ts),
  [google-form-source.ts](src/lib/sources/google-form-source.ts)), not implemented.
- Public apply form at `/apply` ([apply/page.tsx](src/app/(public)/apply/page.tsx) +
  [apply-action.ts](src/lib/applications/apply-action.ts)) is a **separate, parallel** manual
  entry path — mirrors the real rapid re.gen Google Form field-for-field. Also auto-assigns
  reviewers and enqueues scoring jobs on submit.

### Current data state (as of last session)

The database was pared down to **only the 11 real Supabase-sourced applications** — all 134
historical AgWater-cycle rows and 1 test application were permanently deleted at the user's
request. Verified: organisation names that look garbled/oddly long (e.g. full addresses stuffed
into the org-name field) are **genuine source data quality issues from the real form**, not a
sync bug — this was directly verified against Supabase, not assumed.

## Schema — two eras coexisting in one `Application` model

[prisma/schema.prisma](prisma/schema.prisma) `Application` model carries **both**:
1. Legacy AgWater-cycle fields (`waterEfficiencyFocus`, `trl`, `smallMarginalFarmerPct`,
   `problemAddressing`, `aboutSolution`, `beneficiaries`, `areaHectaresRaw`, `focusCrops`,
   `cropProductionFocus`, `valueChainFocus`, `historicallyShortlisted`, `solutionCategory`) — kept
   only because they used to be load-bearing for the 134 deleted rows; now vestigial but harmless.
2. Current rapid re.gen fields (~30 of them): `legalRegistrationType`, `fcraStatus`, `cert12A`,
   `cert80G`, `csr1Registration`, `darpanRegistered`, `annualOperatingBudget`,
   `operatingModelArchetype`, `operatingModelDescription`, `primaryCrops`,
   `regenerativePractices`, `adoptionHurdle`, `techTools`, `techToolsInternal`,
   `yearsExperience`, `verifiedImpacts`, `statesOperating`, `farmersCount`,
   `smallholderFarmersCount`, `avgLandHolding`, `areaUnderRegenPractice`, `villagesCount`,
   `districtsCount`, `worksBeyondAg`, `materialsInLocalLanguages`, `teamFormalTraining`,
   `melHandling`, `fundUsagePlan`, `linkedinUrl`, plus child models `Founder` (now has `.email`),
   `Funder`, `TechUseCase`, `ReportLink`.

Multi-select fields are stored as **semicolon-joined strings**, not arrays (matches the app's
convention throughout — `split(';').filter(Boolean)` to read, `.join(';')` to write). Value lists
+ display labels for every enum-like field live in `src/lib/constants.ts` (e.g.
`OPERATING_MODEL_ARCHETYPE_LABEL`, `CROP_TYPE_LABEL`, `REGEN_PRACTICE_LABEL`, `TECH_TOOL_LABEL`,
`MEL_HANDLING_LABEL`, `LEGAL_REGISTRATION_TYPE_LABEL`, `ANNUAL_BUDGET_BAND_LABEL`,
`INDIAN_STATES`).

`externalId` is `@unique` — the Supabase row id, used as the upsert key by the sync.

`Job` model has **no FK relation** to `Application` (just a JSON payload) — it's fine for it to
accumulate orphaned rows after an application is deleted.

All child models (`Founder`, `Funder`, `TechUseCase`, `ReportLink`, `ReviewAssignment`,
`Comment`, `Note`, `AiEvaluation`, `HumanReview`, `JuryScore`, `StageTransition`, `OutboxEmail`)
use `onDelete: Cascade`.

## The stage machine vs. the UI-facing "review status"

Full linear stage machine still exists underneath
([src/lib/stages/rules.ts](src/lib/stages/rules.ts) / [machine.ts](src/lib/stages/machine.ts)):
`SUBMITTED → SCREENING → UNDER_REVIEW → SHORTLISTED → JURY_REVIEW → FINALIST → WINNER`, terminal
`REJECTED`/`WITHDRAWN`. This is still used for the admin-only "stage action" bar on the full
application record page ([StageActionBar.tsx](src/components/StageActionBar.tsx)) and drives
stage-change emails.

**But** the applications table's "review status" column (per explicit user request — "not so
many stages, just reviewed or not reviewed") is a **separate, simpler, computed** binary derived
from `humanReviews.length > 0` ("reviewed" / "not reviewed") — it does **not** read
`stageStatus`. Don't conflate the two. Same pattern for "decision status" (renamed from
"internal") — Yes/No/Undecided, backed by `Application.internalDecision`, gates jury visibility
(`visibleApplicationWhere` in [guard.ts](src/lib/auth/guard.ts) shows JURY role only
`internalDecision: 'YES'` applications).

## Reviewer assignment (auto-distribution)

[src/lib/applications/assignment.ts](src/lib/applications/assignment.ts) — `autoAssignReviewers(applicationId)`
round-robins across every REVIEWER-role user (respecting `settings.reviewersPerApplication`,
default 2), idempotent (no-ops if already assigned). Called automatically:
- from the Supabase sync, for every newly-created application
- from the public apply-form action, on every submission

`autoAssignAllUnassigned()` is the one-time backfill for apps that predate this feature — exposed
as an "assign reviewers" button in the settings automation panel
([AutomationPanel.tsx](src/components/AutomationPanel.tsx) →
`assignUnassignedReviewersAction`). Already run once against the 11 real applications.

## AI scoring — one rubric, used identically by AI and humans

[src/lib/scoring/rubric.ts](src/lib/scoring/rubric.ts) — `RUBRIC_CRITERIA`, 8 criteria:
`model_clarity`, `regenerative_depth`, `scale_and_reach`, `verified_impact`, `org_credibility`,
`tech_and_data_maturity`, `team_and_execution`, `fund_utilization`. Both the AI scorer
([prompt.ts](src/lib/scoring/prompt.ts), [runner.ts](src/lib/scoring/runner.ts),
[heuristic.ts](src/lib/scoring/heuristic.ts) fallback) and the human reviewer form
([ReviewScoringForm.tsx](src/components/ReviewScoringForm.tsx)) iterate this exact same list —
already verified aligned in code, no divergence.

- `computeComposite` / `dispositionFromComposite` — weighted composite score + disposition
  (STRONG_ADVANCE / ADVANCE / HOLD / REJECT), weights configurable per-criterion in
  `/settings` (`rubricWeights`, auto-bumps `rubricVersion` on change).
- [effective.ts](src/lib/scoring/effective.ts) — `effectiveScore()` resolves an admin override
  (`overrideComposite`/`overrideDisposition` on `AiEvaluation`) over the raw AI score, used
  everywhere the composite is displayed so overrides are consistent app-wide.
- Async: scoring runs via the job queue ([jobs/queue.ts](src/lib/jobs/queue.ts)), not inline —
  `ENRICH_APPLICATION` → `MATCH_APPLICATION` → `SCORE_APPLICATION` enqueued in that order on
  create, drained by [JobQueueTicker.tsx](src/components/JobQueueTicker.tsx) polling
  `POST /api/jobs/tick` client-side every few seconds.

## Eligibility indicator

Per explicit tech-team spec: counts 4 fields — `fcraStatus`, `cert12A`, `cert80G`,
`csr1Registration` — answered vs. not. Shown as `n/4` with a red circle icon
(`CircleAlert` from lucide-react) when incomplete. Appears in the applications table
([ApplicationRow.tsx](src/components/ApplicationRow.tsx)) and rolls up into the dashboard's
"red flags & ineligible applicants" card
([dashboard/queries.ts](src/lib/dashboard/queries.ts) `getFlaggedApplications()`).

## Applications table + full record page (recently reworked — read carefully)

**Single view only** — the Kanban/board view was removed entirely (deleted
`applications/board/page.tsx` and `KanbanBoard.tsx`) per explicit request.

[ApplicationRow.tsx](src/components/ApplicationRow.tsx) is now a **thin, mostly presentational**
table row — no modal, no dialog, no tabs. Clicking a row (or ctrl/cmd/middle/right-click) is a
**real `<Link href="/applications/[id]">`** — navigates straight to the big full record page,
native browser new-tab behavior works with zero JS interception. This was a deliberate
simplification from an earlier iteration that opened a modal on left-click — the user explicitly
asked for the full page instead.

The full record page
([applications/[id]/page.tsx](src/app/(app)/applications/[id]/page.tsx)) is the single source of
truth for everything about one application:
- All the organisation/model/tech/impact fields, AI evaluation with per-criterion breakdown +
  override panel, human reviews, jury scores, transition history, outreach history.
- **Prev/next application pager** — "‹ previous" / "N of Total" / "next ›" links right below the
  banner, plus **← / → keyboard shortcuts** (ignored while focus is in an input/textarea) via
  [ApplicationPagerKeys.tsx](src/components/ApplicationPagerKeys.tsx). Backed by
  `getAdjacentApplications()` in [queries.ts](src/lib/applications/queries.ts) — same order as
  the applications list (submittedAt desc), respects role-based visibility.
- **Decision status buttons** (admin-only, [DecisionStatusButtons.tsx](src/components/DecisionStatusButtons.tsx)),
  **personal notes** (private per-user, [PersonalNotes.tsx](src/components/PersonalNotes.tsx)),
  and **discussion/comments thread** ([CommentThread.tsx](src/components/CommentThread.tsx)) all
  live here now — they used to be inside the row's modal before that was removed; moved onto
  this page so no functionality was lost.
- **Download PDF** button ([DownloadPdfButton.tsx](src/components/DownloadPdfButton.tsx)) — just
  `window.print()`, no PDF library. Nav/footer are hidden while printing via a global
  `.no-print` CSS rule (`src/styles/globals.css`) applied to `AppShell`'s header/footer.

**CSV export**: `/api/applications/export` route
([route.ts](src/app/api/applications/export/route.ts)) streams a CSV of the (optionally
filtered) applications list; triggered by
[ExportCsvButton.tsx](src/components/ExportCsvButton.tsx) on the applications list page.

## Roles & auth

Dev-only role switcher (httpOnly cookie, no real auth) —
[src/lib/auth/session.ts](src/lib/auth/session.ts) `getCurrentUser()`,
[actions.ts](src/lib/auth/actions.ts) `switchUser()`. Guard logic in
[guard.ts](src/lib/auth/guard.ts): `assertRole`, `CAN_TRANSITION_STAGE` (ADMIN),
`CAN_REVIEW` (ADMIN, REVIEWER), `CAN_JURY_SCORE` (ADMIN, JURY), `CAN_MANAGE_SETTINGS` (ADMIN),
`CAN_SEND_MAIL` (ADMIN), `visibleApplicationWhere` (role-scoped Prisma where-clause — REVIEWER
sees only their `reviewAssignments`, JURY sees only `internalDecision: 'YES'`, ADMIN/OBSERVER
see everything).

## Directory map

```
src/app/
  (public)/            challenge, apply, apply/thank-you, status — public-facing pages
  (app)/                internal tool, behind AppShell nav
    dashboard/           KPIs, funnel, operating-model mix, AI calibration backtest,
                          reviewer throughput, target matches, reviewer divergence,
                          red flags & ineligible card, recent activity
    applications/         list page + [id] full record page (see above)
    review/               reviewer queue + per-application scoring page
    jury/                  jury queue + per-application jury scoring page
    outreach/               rejection/confirmation email outbox (approve/send)
    targets/                 ~100-startup wishlist board + CSV upload + reverse matching
    analytics/                deeper versions of the dashboard's charts
    settings/                  rubric weights, active data source, Supabase sync trigger,
                                pipeline automation panel, rejection auto-send toggle
  api/
    applications/export/        CSV export
    ingest/                       webhook stub for external form ingestion
    jobs/tick/                     drains the async job queue (polled client-side)
    score/                          manual single-application (re)score endpoint

src/components/         all client/shared components — see inline comments per file, most
                         are self-descriptively named (ApplicationRow, ApplicationFilters,
                         AutomationPanel, StageActionBar, StageStatusDropdown, ReviewScoringForm,
                         JuryScoringForm, AiOverridePanel, RescoreButton, CommentThread,
                         PersonalNotes, DecisionStatusButtons, DownloadPdfButton,
                         ExportCsvButton, ApplicationPagerKeys, SupabaseSyncPanel,
                         JobQueueTicker, TargetCard, TargetUploadForm, OutboxTable, BarRow,
                         OrgTitle, StatusBadges — CompositeBadge/DispositionTag/StageBadge/
                         SolutionCategoryTag)

src/design-system/       raw UI primitives (Button, Card, Badge, Input, Select, Textarea, Tag,
                          Tabs, Dialog (portal-based, see below), Checkbox, Radio, Switch,
                          Toast/ToastProvider, Tooltip, Logo, AngularBanner, Quote, IconButton)
                          — index.ts re-exports everything

src/lib/
  applications/          queries.ts (list/detail/adjacent), actions.ts (stage transition,
                          decision, notes, comments), apply-action.ts (public form submit),
                          assignment.ts (reviewer auto-distribution), consensus.ts,
                          jury-actions.ts
  auth/                   session.ts, guard.ts, actions.ts
  automation/actions.ts    admin-triggered batch actions: sync Supabase, score all unscored,
                            enrich all, rerun matcher, assign unassigned reviewers, get stats
  analytics/queries.ts     funnel, operating-model mix, value-chain mix, geography mix, small
                           farmer histogram (legacy), TRL distribution (legacy), reviewer
                           throughput, AI-vs-historical-outcome calibration backtest
  dashboard/queries.ts     KPIs, recent activity, divergent (AI vs human) applications, flagged
                           (red-flag / ineligible) applications
  enrichment/               website/search public-data enrichment scraper (feeds AI scoring
                            context, not authoritative)
  jobs/queue.ts             DB-table job queue: enqueue/process/stats, no Redis
  mail/                     outbox model, templates, mailer (stub/resend/gmail providers),
                            queries, actions — rejection bot + congratulatory confirmations
  matching/matcher.ts        target-wishlist reverse matching
  scoring/                  rubric, prompt, heuristic, runner, types, parse, effective,
                            override-actions — see "AI scoring" above
  sources/                  pluggable ingestion — see "data sources" above
  stages/                    rules.ts (STAGE_ORDER, LEGAL_TRANSITIONS), machine.ts
                            (transitionApplication, seedTransitionPath)
  targets/                   queries.ts, actions.ts — wishlist CRUD + CSV import
  constants.ts                canonical value lists + display labels for every enum-like field
  db.ts                       Prisma client singleton
  settings.ts / settings-actions.ts   DeltaSettings (reviewersPerApplication, activeSource,
                                       rubricWeights, rubricVersion, autoSendRejections)

prisma/
  schema.prisma            see "schema" above
  seed.ts                   demo data seeder (users + historical round-robin assignment
                             pattern that inspired assignment.ts)

scripts/
  check-adherence.mjs       design-system regex scanner (part of npm run lint)
  score-all.ts               batch-score every unscored application

design-system/               SKILL.md + shared CSS tokens/rules referenced by both
                              src/design-system/ components and the adherence checker
```

## Conventions worth knowing before editing

- **Lowercase everywhere in UI copy** — headings, badges, buttons are all lowercase by design
  system convention (`text-transform: lowercase` in places, but also just typed lowercase).
- **No em dashes in UI copy** — removed platform-wide for a "serious/production-grade tool"
  tone; don't reintroduce them in user-facing strings.
- **No border-radius, no circular elements** — sharp/square corners throughout, per
  `design-system/SKILL.md`. The one exception is intentional: `CircleAlert` icon glyphs (lucide
  icons aren't restyled).
- Prefer editing existing files over creating new ones; new components/files were only added
  this session where genuinely new standalone functionality was needed (e.g.
  `DecisionStatusButtons.tsx`, `PersonalNotes.tsx`, `CommentThread.tsx` were **extracted**, not
  newly invented — they used to be inline in the now-deleted modal).
- After any schema change: `npm run db:push` (confirm no unexpected data-loss warnings on
  columns with real data), then restart the dev server.
- After any renamed export or schema change: **fully restart the dev server**, don't trust
  fast-refresh.
- Before calling any change done: `npm run lint` must exit clean, and if the change is
  browser-observable, verify live via the preview tools (screenshot / console logs / server
  logs), not just by reading code.

## Environment variables (`.env`, see `.env.example` for the full annotated list)

```
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY=""            # optional — falls back to heuristic scorer if unset
ANTHROPIC_MODEL="claude-sonnet-4-6"
EMAIL_PROVIDER="stub"            # stub | resend | gmail
APPLICATION_SOURCE="supabase"     # seed | zoho_crm | google_form | supabase — currently supabase
SUPABASE_URL="https://ysasmuxvusflvcetravz.supabase.co"
SUPABASE_ANON_KEY="..."            # real anon key, deliberately safe/public (read-only RLS)
CHALLENGE_NAME="the^delta prize · rapid re.gen challenge"
```

## What's explicitly done (full punch list from the last "tech team" review, all implemented)

1. Single view — Kanban board removed.
2. Real `<Link>` rows — left-click navigates to full page, ctrl/cmd/middle/right-click work
   natively for new tabs.
3. Eligibility indicator — n/4 + red circle.
4. "Reviewed by" → "Reviewer", real auto-distributed reviewer assignment (not dummy data).
5. "Stage" → "Review Status" (Reviewed/Not Reviewed only), "Internal" → "Decision Status"
   (Yes/No/Undecided).
6. AI review and human review confirmed on identical rubric.
7. CSV export of the applications table.
8. PDF downloadability per application (print-to-PDF).
9. Dashboard red flags / ineligible applicants section.
10. AI scraper — acknowledged as already-partially-existing (website enrichment); no concrete
    "experiment" spec given yet, open for follow-up.
11. (Follow-up request, also done) Clicking a row goes to the full page, not a modal — modal
    content (comments/notes/decision buttons) migrated onto the full page.
12. (Follow-up request, also done) Prev/next pager + arrow-key navigation between applications
    on the full record page.

No open/pending items from the user as of the last message in this session.
