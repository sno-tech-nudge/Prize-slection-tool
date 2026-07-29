# the^delta prize — rapid re.gen challenge — internal admin tool

Internal Next.js/Prisma tool for managing applications to the **"rapid re.gen challenge"**, run
by **the^delta prize** (a the/nudge institute initiative). Applications flow in automatically from
a live Supabase-backed Zoho Creator form, get AI-scored against an 8-criterion rubric, go through
human review (5 rotating reviewers), an internal yes/no gate, then a jury round (small panels
called "benches"). Real login system, real production Postgres database — **this is not a demo,
it's the live tool the team uses day to day.**

Read this whole file before making any change. It reflects the actual current state of the app —
a much earlier version of this file described a SQLite/dev-only-role-switcher prototype; that
version of the app no longer exists. Don't trust anything you find online or in old commit
messages about "seed data" or "dev-only auth" — this app has a real Postgres database with real
people's logins.

## What this actually is, in one paragraph

Applicants submit through a Zoho Creator form → land in a Supabase Postgres table → this app
syncs them in → AI scores each one against a rubric → 5 human reviewers get applications
auto-assigned round-robin and score them too → an admin marks each one's internal decision
(yes/no) → "yes" applications go onto a jury "bench" (a panel of 1+ jurors) → jurors score them →
admins track everything from a dashboard, and email the applicant automatically at every stage
transition (shortlist, reject, finalist, winner).

## Stack

- Next.js 14 App Router, TypeScript strict mode, React 18.
- Prisma ORM + **PostgreSQL** — a real, live, hosted Supabase Postgres instance (see "Database &
  hosting" below). This is NOT SQLite, has never been SQLite in production, and Prisma "enums"
  are still plain `String` columns (a stack decision made early on, kept for consistency) —
  canonical value lists + labels live in `src/lib/constants.ts`.
- Real authentication: `scryptSync`-hashed passwords, HMAC-signed session cookie. See "Auth &
  roles" below. There is no dev-only role switcher — that was removed long ago.
- `@anthropic-ai/sdk` / Groq / Gemini for AI scoring (auto-detects provider from whichever API key
  is set; falls back to a heuristic scorer with zero API keys).
- `@supabase/supabase-js` — read-only client pulling the live `applications` table (the real
  Zoho-fed production data), NOT the same as this app's own Postgres database (see below).
- No Redis / external queue — async jobs are a DB table drained by client-side polling
  (`JobQueueTicker.tsx` polls `/api/jobs/tick` every few seconds).
- Custom design system in `design-system/` + `src/design-system/` (sharp corners, no
  border-radius, no circles except lucide `CircleAlert` glyphs, lowercase UI copy everywhere, no
  em dashes in user-facing strings, Mulish sans + Cormorant italic serif, red `#b21010` accent).
  Enforced by `npm run lint`.

## Commands

```
npm run dev          # start dev server (localhost:3000)
npm run lint         # oxlint + design-system adherence checker + tsc --noEmit — MUST pass clean before any change is "done"
npm run db:push      # push prisma/schema.prisma to the live Postgres DB (no migration files, just push)
npm run db:reset     # --force-reset the live DB — DESTRUCTIVE, essentially never use this against production
npm run db:seed      # tsx prisma/seed.ts — demo seeder, not used against the real production DB anymore
npm run score:all    # tsx scripts/score-all.ts — batch AI-score every unscored application
```

`npm run lint` chains oxlint, `scripts/check-adherence.mjs` (regex scanner for raw hex colors /
raw px strings / off-brand fonts in `src/`), and `tsc --noEmit`. Must show "Found 0 warnings and 0
errors" and "the^delta adherence check — clean" before considering any change complete.

### Known dev-server quirk (recurs constantly — learn this pattern)

After `prisma db push` / `prisma generate` changes the schema, an **already-running** `next dev`
process keeps its OLD in-memory `@prisma/client` and throws stale errors like `The column
't1.someColumn' does not exist in the current database` or `Cannot read properties of undefined`.
**Fix every time**: kill whatever's on port 3000 (`lsof -ti:3000 | xargs -r kill`, escalate to
`-9` if it doesn't die), confirm the port is free, then restart the dev server. Don't trust
fast-refresh after a schema change — always fully restart.

## Database & hosting — READ THIS BEFORE TOUCHING ANYTHING

**Two separate Supabase-hosted Postgres pieces exist, easy to confuse:**

1. **This app's own database** — a dedicated `delta_admin` schema on a Supabase Postgres project
   (project ref `ysasmuxvusflvcetravz`, region `ap-south-1`). This is where Prisma writes
   everything: users, applications (synced copy), reviews, jury scores, comments, notifications,
   emails, jobs, etc. `DATABASE_URL` (pooled, port 6543, `pgbouncer=true`) and `DIRECT_URL`
   (direct, port 5432) both point here, with `schema=delta_admin` in the query string.
2. **The live Zoho-fed `applications` source table** — a *different* table (not schema) the
   real-world Zoho Creator form writes into automatically. This app has **read-only** access via
   `SUPABASE_URL` + `SUPABASE_ANON_KEY` (anon key, safe to expose, RLS-scoped to read-only). The
   sync module (`src/lib/sources/supabase-source.ts`) pulls every row from there and upserts it
   into this app's own `Application` table, keyed by `externalId` = the source row's id. Triggered
   manually from `/settings` ("sync from supabase" button) — not currently on a schedule.

**Any `prisma db push` here is a schema change against the live, real, production database.**
There is no separate staging DB. Before any schema change that could drop a column with real data
in it: back up the affected column's data first (a small one-off script, read the rows, write
JSON to `/tmp`, run it, delete it), push the schema, then restore via `connect`/relation update if
it was a relation shape change. This exact pattern (back up → push → restore) was used
successfully to convert `User.benchId` (a single FK) into a `User.benches` many-to-many relation
with zero data loss — see git history around "Allow jurors to sit on multiple benches" if you need
the playbook again.

**Never run `prisma db push --force-reset` or `db:reset` against this database** — it is not a
throwaway/demo dataset, it holds ~125 real applicants' data and real team members' logins.

As of the last working session: **125 real applications** synced from the live source, **10 real
team-member accounts**, no seed/demo data of any kind remains.

## Hosting / deployment

- **Vercel project**: `the-delta-prize-v3`, production URL `the-delta-prize-v3.vercel.app`.
  `.vercel/project.json` has the project/org id already linked. Deploy with `vercel --prod` from
  the CLI, or just `git push origin main` if a Git integration is connected (check `vercel ls
  the-delta-prize-v3` after pushing — poll until the newest deployment shows `● Ready`, builds
  take ~40s).
- **GitHub repo**: `tanushhh21/the-delta-prize`, branch `main`. This is the single source of
  truth for deployed code — always commit + push real changes here, never leave meaningful work
  only on a local machine.
- **`postinstall` runs `prisma generate`** automatically on every Vercel build — no manual step
  needed for that.
- Every env var in `.env.example` needs to be set in the Vercel project's Environment Variables
  for the deployed app to work — most importantly `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`,
  `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and whichever AI provider key is in use (`GROQ_API_KEY` is
  the one actually configured as of the last session — `SCORING_PROVIDER="groq"`).

## Auth & roles — real authentication, not a prototype

`src/lib/auth/password.ts` — `hashPassword`/`verifyPassword`, one-way `scryptSync` hashes.
**Never write a plaintext password to any file that gets committed to git.** If you ever need a
one-off script to set someone's password (e.g. `scripts/reset-x-password.ts`), write it, run it
once with `npx tsx scripts/whatever.ts`, then **immediately delete it** with `rm -f` before any
`git add`/`git commit`. This has been the practice throughout and must continue.

Login is at `/login` (email + password form, `LoginForm.tsx` → `loginAction` in
`src/lib/auth/actions.ts`), which looks the user up by `username` (their email, lowercased),
verifies the password hash, and sets a signed session cookie (`delta_session`, HMAC via
`src/lib/auth/session-token.ts`). `getCurrentUser()` (`src/lib/auth/session.ts`) reads and
verifies that cookie server-side, wrapped in React's `cache()` to dedupe repeated calls within one
render pass.

Four roles (`src/lib/constants.ts` `USER_ROLES`): **ADMIN**, **REVIEWER**, **JURY**, **OBSERVER**.

- `assertRole()` + role-list constants in `src/lib/auth/guard.ts`: `CAN_TRANSITION_STAGE` (ADMIN
  only), `CAN_REVIEW` (ADMIN, REVIEWER), `CAN_JURY_SCORE` (ADMIN, JURY), `CAN_MANAGE_SETTINGS`
  (ADMIN only), `CAN_SEND_MAIL` (ADMIN only).
- `visibleApplicationWhere()` — the role-scoped Prisma where-clause every applications query goes
  through. **Reviewers see the full applications list, same as admin/observer** — their
  `ReviewAssignment` only determines who's expected to review what, it does NOT restrict what they
  can look at (this was an explicit late-session change; reviewers used to be restricted to only
  their assigned rows, that was reversed). **Jury only sees applications where
  `internalDecision: 'YES'` AND placed on one of that juror's benches** — a juror can sit on more
  than one bench (many-to-many `User.benches` ↔ `Bench.jurors`), and one on zero benches sees
  nothing.

### Current real team roster (roles, not passwords — check the live DB or `/settings` for current state)

As of the last session: 8 ADMIN accounts (Anurag V, Gaurang, Nisha Chawla, Paromita Sen, "Prize
Applications" — the dedicated outbound-email sending account, Saba Ahmed, Sravya Jandhyala, Tanush
Kalhan/gmail), 1 REVIEWER (KC), 1 JURY (Tanush Kalhan/icloud — this is a **test account**, labeled
"[TEST ORG — DO NOT USE]" adjacent test data exists too, safe to use for verifying jury features
but don't delete the underlying real bench structure it sits on).

**Password scheme for the original team roster** (`scripts/seed-logins.ts`, if still present):
`{firstname_lowercase}_{ddmmyyyy date of joining}` (e.g. a person named "asha" who joined
01/02/2023 would have password `asha_01022023`). Login username is always the person's email, not
their first name. New accounts created ad hoc during this project
(the "Prize Applications" sender account, Gaurang, the test JURY account) had passwords set via
one-off scripts following the same never-commit-plaintext rule above — check with whoever set
them up if you need current credentials; don't try to guess or reset a real person's password
without asking first.

### Reviewer auto-assignment — an allow-list, not a role filter

`src/lib/applications/assignment.ts` — `ROTATION_EMAILS` is a **fixed list of specific email
addresses**, not `role === 'REVIEWER'`. This is deliberate: most of the real reviewers hold the
ADMIN role (that's their actual platform permission level — dashboard/settings access), so
filtering by role alone doesn't identify them. Only the emails in that list ever get a new
application auto-assigned, in round-robin order by name, continuing from wherever the last
assignment left off (`totalAssignments % rotation.length`). As of the last session this list is 4
people (Nisha, Paromita, Saba, Sravya) — **KC was deliberately removed from the rotation** (no new
applications should route to them) though KC's account and role remain intact for whatever they're
still finishing. If you ever need to change who's in rotation, edit `ROTATION_EMAILS` directly —
don't try to derive it from role, that was tried once and silently broke assignment for weeks
until someone noticed 10 unassigned applications (the rotation query returned zero people because
no real reviewer actually had `role: 'REVIEWER'` in the database at the time).

`reassignAllInRotationOrder()` — nuclear option, wipes and rebuilds every assignment from scratch
in strict rotation order across every application by submission date. Use only for a full reset,
not routine reassignment (an admin can hand-assign one application from its detail page's
"reviewers" multi-select without touching anyone else's).

## Schema — current models (`prisma/schema.prisma`)

`User`, `Bench` (jury panel — now **many-to-many** with User via `benches`/`jurors`, a juror can
sit on more than one bench), `Founder`, `Funder`, `TechUseCase`, `ReportLink`, `ReviewAssignment`,
`Application` (the big one — ~60 fields covering identity, registrations/certifications, operating
model, tech/tools, experience/impact, plus a `bench` FK for jury placement), `Comment` (team
discussion thread, supports `@Full Name` mentions), `Notification` (new — powers the bell icon,
see below), `Note` (private per-reviewer scratchpad), `AiEvaluation`, `HumanReview`, `JuryScore`,
`StageTransition`, `Target` (wishlist board), `OutboxEmail`, `Setting`, `Job` (async queue, no FK
to Application — fine for it to accumulate orphaned rows).

Multi-select fields are stored as **semicolon-joined strings**, not arrays —
`split(';').filter(Boolean)` to read, `.join(';')` to write, matches the app's convention
throughout. Value lists + display labels for every enum-like field live in
`src/lib/constants.ts`.

All child models use `onDelete: Cascade`.

## The stage machine vs. the UI-facing "review status"

Full linear stage machine (`src/lib/stages/rules.ts` / `machine.ts`):
`SUBMITTED → SCREENING → UNDER_REVIEW → SHORTLISTED → JURY_REVIEW → FINALIST → WINNER`, terminal
`REJECTED`/`WITHDRAWN`. Drives stage-change emails (shortlist/finalist/winner get a congratulatory
email, rejection gets the rejection template, all via the outbox — never sent inline, always
queued then approved/sent).

**But** the applications table's "review status" column is a **separate, simpler, computed**
binary derived from `humanReviews.length > 0` ("reviewed"/"not reviewed") — does NOT read
`stageStatus` directly. Same pattern for "decision status" — Yes/No/Undecided backed by
`Application.internalDecision`, the gate that controls jury visibility.

**Withdrawal was removed as an admin-facing action** on the individual application page (both the
early-pipeline toggle and the later-stage transition dropdown filter `WITHDRAWN` out of their
options) — `WITHDRAWN` remains a legal stage value for any application already in that state, but
nothing in the UI can put a new application into it anymore.

## Jury round — benches, many-to-many, oversight vs. own view

A **bench** is a small jury panel. Historically one juror per bench (`User.benchId`), converted
mid-session to a true **many-to-many** (`User.benches Bench[]` ↔ `Bench.jurors User[]`) — a juror
can now sit on more than one bench simultaneously; a bench still holds multiple jurors. Managed
from `/settings/benches` (`BenchManager.tsx`) — the juror row uses a checkbox-based `MultiSelect`
component (`src/components/MultiSelect.tsx`) to pick which bench(es) each person is on.

**Watch for this exact bug if you touch `MultiSelect.tsx` again**: it once showed the raw option
*value* (e.g. a cuid like `bench-1-seed`) instead of the option's *label* when exactly one item
was selected — `selected.length === 1 ? selected[0] : ...` instead of looking up the label. Fixed,
but the pattern (using the raw value as a display fallback) is an easy regression to reintroduce.

Two distinct jury-facing surfaces:
- **`/jury`** — internal team's oversight view (ADMIN only; redirects JURY-role users to
  `/applications`). Shows every shortlisted (`internalDecision: YES`) application across every
  bench, alphabetical, with filters: search by name, bench, and an average-jury-score bucket
  (`0-25`/`26-50`/`51-75`/`76-100` — computed in-memory since it's an aggregate across a variable
  number of `JuryScore` rows, not a stored column). Table columns: organisation, bench, int score
  (AI), then one column per juror **seat on the bench** (`j1`, `j2`, ... — keyed to the bench's
  actual juror roster alphabetically, not to how many people have submitted a score yet, so an
  unscored juror still gets an empty `—` column instead of not appearing at all), then avg jury
  score. State/operating-model filters and a `state` table column were deliberately removed from
  this view per explicit request.
- **`/applications`** (when the signed-in user's role is JURY) — that juror's own bench only,
  trimmed to 5 columns (org/bench/state/int score/your score), **no filters** (removed —
  the internal oversight filters were leaking onto jurors' own view, which was a bug, not a
  feature; jurors only ever see their own small bench list so filtering isn't useful there).

`JuryScoreCard.tsx` (on `/jury/[id]`, the oversight detail page) and `JuryScoresTable.tsx` (on
the admin sidebar of the regular `/applications/[id]` page) both render a per-juror ×
per-criterion comparison table, sourced from `getApplicationDetail()`'s `juryScores.juror.benches`
include.

## Notifications — @mention bell in the top nav

New feature: mentioning someone with `@Full Name` in a `Comment` (matched against the real team
roster by exact name — same regex rule the comment thread UI already used to highlight/autocomplete
mentions) creates a `Notification` row for them (never for the comment's own author, never
duplicated if mentioned twice in one comment). `src/lib/notifications/` (`queries.ts`,
`actions.ts`) + `/api/notifications` (GET, returns unread count + recent list) +
`NotificationBell.tsx` in `AppShell.tsx`'s header — polls every 30s, dropdown shows recent
notifications, clicking one marks it read and navigates to the application, "mark all as read"
clears the badge without navigating.

## AI scoring — one rubric, used identically by AI and humans

`src/lib/scoring/rubric.ts` — `RUBRIC_CRITERIA`/`RUBRIC_SECTIONS`, 8 criteria across a handful of
sections. Both the AI scorer (`prompt.ts`, `runner.ts`, `heuristic.ts` fallback) and the human/
jury scoring forms iterate this exact same list.

- Provider resolution: `SCORING_PROVIDER` env var, or auto-detected from whichever API key is set
  — checks `GROQ_API_KEY` → `ANTHROPIC_API_KEY` → `GEMINI_API_KEY` → heuristic fallback, in that
  order. As of the last session, `SCORING_PROVIDER="groq"` is explicitly set.
- `computeComposite`/`dispositionFromComposite` — weighted composite + disposition
  (STRONG_ADVANCE/ADVANCE/HOLD/REJECT), weights tunable per-criterion in `/settings`.
- `effectiveScore()` (`effective.ts`) resolves an admin override over the raw AI score — used
  everywhere a composite is displayed.
- **Section-level score display uses a red/orange/green (ROG) horizontal bar**, not the old
  color-swatch + strong/solid/developing/weak word labels — `sectionTone()` in
  `ApplicationMainContent.tsx`, thresholds `>=80` green / `>=40` orange / else red. Tokens:
  `--status-good`/`--status-warn`/`--status-bad` in `design-system/tokens/colors.css` (raw hex is
  fine there — that file is outside `src/`, exempt from the adherence lint's "no raw hex" rule).
- **Per-section "why" info button** (`SectionScoreInfo.tsx`) — click the small "i" icon next to
  any AI evaluation section heading to see each criterion's actual rationale/evidence text the
  model produced, not just the percentage.
- Async: scoring runs via the job queue (`jobs/queue.ts`), enqueued in order
  `ENRICH_APPLICATION → MATCH_APPLICATION → SCORE_APPLICATION` on create, drained by
  `JobQueueTicker.tsx` polling `/api/jobs/tick`.

## Applications table + full record page

Single view only (no Kanban board). Row click → real `<Link>` to `/applications/[id]`, native
new-tab support (ctrl/cmd/middle/right-click work with zero JS interception). Hover prefetches the
detail route to kill perceived navigation lag.

The full record page is the single source of truth for one application: every submitted field,
AI evaluation with per-criterion breakdown + admin override panel, human reviews, jury scores,
transition history, outreach history, prev/next pager with ←/→ keyboard shortcuts (ignored while
focus is in an input), decision status buttons (admin-only), personal notes (private per-user),
and the `@mention`-aware comment thread.

**Multi-line/bulleted free text fields use `white-space: pre-wrap`** everywhere they render
(Field values, AI summary, eligibility notes, human review comments, founders/funders card, jury
score comments) — the browser was collapsing real embedded newlines from long-form applicant
answers into one paragraph; this is a pure display fix, zero data was ever touched.

**CSV export** (`/api/applications/export`, `ExportCsvButton.tsx`) offers a full Zoho-style dump —
`exportColumns.ts` splits into `CORE_COLUMNS` (the ~20 fields on by default) and `FULL_DUMP_COLUMNS`
(~78 more, opt-in via "select all fields" in the export dialog) covering nearly every remaining
scalar field plus relation-derived summaries (founder emails/LinkedIns, funders, tech use cases,
report links, bench, target-wishlist match). `genericCell()` in the export route falls back to a
plain `app[field]` read for anything without an explicit getter, so most of the full-dump columns
needed zero extra code.

**Filters** (`ApplicationFilters.tsx`) wrap instead of horizontally scrolling, and every filter
control (search box, pill toggles, native selects, the `MultiSelect` checkbox dropdowns) shares
one height constant (`FILTER_CONTROL_HEIGHT = 38`) and border weight for visual consistency.

## Team & roles settings (`/settings`)

`UserRoleManager.tsx` lists everyone with **role edit, name/email edit, and remove** (not just
add) — `updateUserAction`/`deleteUserAction` in `src/lib/auth/actions.ts`. Delete is guarded: if
the person has any `ReviewAssignment`/`JuryScore`/`Note`/`Comment` history, Prisma's FK constraint
(`P2003`) is caught and surfaced as a friendly "reassign or change their role instead" message
rather than a 500.

**JURY-role accounts are excluded from this list** — they're only managed from
`/settings/benches` now (that page's `BenchManager.tsx` has its own add/edit/remove for jury
members with real logins). Showing the same juror in two different management forms invited
editing their login from either one inconsistently.

## Directory map

```
src/app/
  (public)/                challenge, apply, apply/thank-you, status — public-facing pages
  login/                    real email+password sign-in
  (app)/                     internal tool, behind AppShell nav + real auth
    dashboard/                KPIs, funnel, operating-model mix, reviewer stats, red flags card
    applications/               list page + [id] full record page (see above)
    jury/                        internal oversight list + [id] jury score card detail (ADMIN only)
    outreach/                     rejection/confirmation email outbox (approve/send)
    targets/                       wishlist board + CSV upload + reverse matching
    analytics/                      deeper dashboard chart versions
    settings/                        team & roles, jury benches sub-page, rubric weights, active
                                     data source, Supabase sync trigger, automation panel
  api/
    applications/export/              CSV export
    notifications/                     GET unread count + recent list for the bell
    ingest/                             webhook stub for external form ingestion
    jobs/tick/                           drains the async job queue (polled client-side)
    score/                                manual single-application (re)score endpoint

src/components/          most are self-descriptively named — ApplicationRow, ApplicationFilters,
                          ApplicationMainContent (the big detail-page renderer, incl. ROG bars +
                          SectionScoreInfo), StageActionBar, ReviewScoringForm, JuryScoreCard,
                          JuryScoresTable, JuryListFilters, InternalJuryRow, JuryApplicationRow,
                          JurySidePanel, BenchManager, MultiSelect, NotificationBell, CommentThread,
                          PersonalNotes, DecisionStatusButtons, ExportCsvButton, UserRoleManager,
                          AppShell (nav + header, incl. the bell)

src/design-system/        raw UI primitives — index.ts re-exports everything, no hand-rolled
                          buttons/inputs/cards anywhere in src/

src/lib/
  applications/            queries.ts (list/detail/adjacent/jury-scoped), actions.ts (stage
                            transitions, decisions, notes, comments — wires notification creation
                            on @mention), apply-action.ts, assignment.ts (reviewer rotation),
                            exportColumns.ts, consensus.ts
  auth/                     session.ts, guard.ts, actions.ts, password.ts, session-token.ts
  benches/                   queries.ts (listBenches, listJuryUsers, listJuryOversight w/ score
                             bucket filter), actions.ts (bench CRUD, juror multi-bench assignment)
  notifications/              queries.ts, actions.ts (mention parsing + read/unread)
  automation/actions.ts        admin-triggered batch actions
  analytics/queries.ts          dashboard/analytics chart data
  dashboard/queries.ts            KPIs, recent activity, reviewer stats (built from real
                                  ReviewAssignment/HumanReview rows, not a role-based guess)
  enrichment/                     public-data enrichment scraper
  jobs/queue.ts                    DB-table job queue
  mail/                             outbox model, templates, mailer (stub/resend/gmail)
  matching/matcher.ts                target-wishlist reverse matching
  scoring/                            rubric, prompt, heuristic, runner, types, parse, effective
  sources/                             pluggable ingestion — supabase-source.ts is the real one
  stages/                                rules.ts, machine.ts
  targets/                                 queries.ts, actions.ts
  constants.ts                              canonical value lists + display labels
  db.ts                                      Prisma client singleton
  settings.ts / settings-actions.ts

prisma/schema.prisma        see "Schema" above
scripts/                     check-adherence.mjs (part of npm run lint), score-all.ts — treat
                              this directory as scratch space for one-off DB scripts too (write,
                              run once with npx tsx, delete immediately after — especially
                              anything touching passwords or real user data)
```

## Conventions worth knowing before editing

- **Lowercase everywhere in UI copy**, **no em dashes in user-facing strings**, **no
  border-radius/circular elements** (except lucide `CircleAlert` glyphs) — enforced partly by
  lint, partly by convention. Match existing style.
- Prefer editing existing files over creating new ones.
- After any schema change: `npx prisma generate` then `npx prisma db push`, confirm no
  unexpected/unwanted data-loss warnings, then **fully restart the dev server** (see the quirk
  above) — don't trust fast-refresh.
- Before calling any change done: `npm run lint` must exit clean, and if the change is
  browser-observable, verify live via the preview tools, not just by reading code.
- **Never commit a plaintext password** to any script. Write the one-off script, run it, delete
  it, before staging anything for git.
- **Any production DB mutation beyond a straightforward additive schema push** (deleting a user,
  bulk-reassigning applications, resetting someone's password) should be confirmed with the user
  first if there's any ambiguity about scope — this codebase's safety classifier will often block
  these outright until you either find a read-only alternative or get explicit sign-off.
- Only commit/push when explicitly asked ("push", "yes push", etc.) — don't push proactively after
  every small fix. After pushing, poll `vercel ls the-delta-prize-v3` until the new deployment
  shows `● Ready` (builds take ~40s) before telling the user it's live.

## Environment variables (`.env`, see `.env.example` for the full annotated list — names only, no values belong in any doc)

```
DATABASE_URL / DIRECT_URL       # delta_admin schema on the Supabase Postgres project — see "Database & hosting"
AUTH_SECRET                     # signs the session cookie — never rotate this without understanding it logs everyone out
SCORING_PROVIDER                # currently "groq" — auto-detects otherwise (groq > anthropic > gemini > heuristic)
GROQ_API_KEY / GROQ_MODEL / GROQ_COMPOUND_MODEL
ANTHROPIC_API_KEY / ANTHROPIC_MODEL
GEMINI_API_KEY / GEMINI_MODEL
EMAIL_PROVIDER                  # stub | resend | gmail — "Prize Applications" (applications@thedelta.org.in) is meant to be the ONLY sending account once gmail is wired up; Gmail SMTP setup (GMAIL_USER/GMAIL_APP_PASSWORD) was started but not finished as of the last session — needs a real Gmail App Password from the account owner
RESEND_API_KEY / GMAIL_USER / GMAIL_APP_PASSWORD / TEST_EMAIL_OVERRIDE
APPLICATION_SOURCE              # currently "supabase" — the real live source
SUPABASE_URL / SUPABASE_ANON_KEY   # read-only client for the live Zoho-fed applications table (different from this app's own DB — see above)
GOOGLE_FORM_ID / GOOGLE_INGEST_SECRET / ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET / ZOHO_REFRESH_TOKEN  # unused stubs
CHALLENGE_NAME / SHORTLIST_SIZE
SEARCH_API_KEY / SEARCH_ENGINE_ID  # optional enrichment — website fetch works without these
```

## Known open items (as of the last working session)

- Gmail SMTP for the "Prize Applications" sending account was discussed and partly explained but
  not completed — needs `GMAIL_USER`, `GMAIL_APP_PASSWORD` (a real Google App Password, requires
  2-Step Verification enabled first), and `EMAIL_PROVIDER=gmail` set on Vercel. The guardrail:
  **all outbound email should go through this one account only** once configured.
- No other explicitly pending feature requests as of the last message in the previous session.
