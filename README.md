# the^delta prize — rapid re.gen challenge — internal admin tool

This is the **live, real internal tool** the^delta prize team uses to run the "rapid re.gen
challenge" — an application-selection pipeline for a regenerative-agriculture prize challenge.
It is **not a demo or a prototype** — it has a real production Postgres database, real team
logins, real applicant data, and is deployed and in active use.

This document is written as a full handoff: everything a new developer, a new Claude Code
account, or a new hosting owner needs to pick this project up with zero prior context. See also
`CLAUDE.md` in the repo root — that file is auto-loaded by Claude Code at the start of every
session in this repo and covers the same ground in more implementation-level detail.

---

## 1. What this app does, end to end

1. Applicants submit through a **Zoho Creator form** (external, not part of this codebase).
2. Zoho writes each submission into a **Supabase Postgres table** (the "live source" — see
   §4, Database & hosting).
3. This app **syncs** that source table into its own database (`/settings` → "sync from
   supabase" button, or automatically for anything newly created).
4. Every new application is queued for **AI scoring** against an 8-criterion rubric (Groq/
   Anthropic/Gemini, or a heuristic fallback with no API key) and **public-data enrichment**
   (a website scrape for corroborating context).
5. Applications are **auto-assigned** round-robin to a fixed rotation of real human reviewers.
6. An admin marks each application's **internal decision** (yes/no) — only "yes" applications
   proceed to jury.
7. "Yes" applications get placed on a **jury bench** (a small panel of 1+ jurors — a juror can
   sit on more than one bench). Jurors score independently; admins see a cross-bench oversight
   view.
8. Stage transitions (shortlist / reject / finalist / winner) queue an **outbound email** to the
   applicant — reviewed and approved by an admin before sending, never sent automatically.
9. A dashboard, analytics pages, and a target-organisation "wishlist" board with reverse-matching
   round out the internal-team tooling.

## 2. Tech stack

- **Next.js 14** (App Router), **TypeScript** (strict), **React 18**.
- **Prisma ORM** against a **real hosted PostgreSQL** database (Supabase). There is no SQLite
  anywhere in this app's current form — an earlier prototype version used SQLite, but that
  version has been fully replaced.
- **Real authentication** — `scryptSync`-hashed passwords, HMAC-signed session cookies. No
  "dev-only role switcher" exists; every login is a real person's real credential.
- **AI scoring**: `@anthropic-ai/sdk`, Groq, and Gemini are all wired as interchangeable
  providers, auto-detected from whichever API key is present (Groq is what's actually configured
  as of the last working session), with a heuristic fallback needing zero API keys.
- **`@supabase/supabase-js`** — a second, separate, read-only integration pulling the live
  Zoho-fed applications table (see §4).
- **No external queue/Redis** — async work (scoring, enrichment, matching) is a `Job` table in
  Postgres, drained by a client-side polling ticker in the browser.
- **Custom design system** (`design-system/` + `src/design-system/`) — sharp corners, no
  border-radius, lowercase UI copy, brand red accent, enforced by a custom lint pass
  (`npm run lint`).

## 3. Running it locally

```
npm install
```

Copy `.env.example` to `.env` and fill in real values — **get these from whoever currently owns
the Supabase project and Vercel deployment**, not from anywhere in this repo (no real secrets are
committed anywhere):

- `DATABASE_URL` / `DIRECT_URL` — this app's own Postgres connection strings (Supabase dashboard
  → Project Settings → Database → Connection string). Both need `schema=delta_admin` appended.
- `AUTH_SECRET` — random string signing session cookies (`openssl rand -base64 32` if you're
  rotating it — note this logs every current session out).
- At least one of `GROQ_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` for real AI scoring
  (optional — falls back to a heuristic scorer otherwise).
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — read-only client credentials for the live source table.
- `EMAIL_PROVIDER` and its associated credentials, if you need to test outbound mail.

Then:

```
npx prisma generate
npm run dev
```

Log in at `/login` with a real account's email + password (ask the team, or see §7 for the
password scheme used for the original roster). **There is no seed/demo login and no role
switcher** — you need a real account in the real database to see anything past the login page.

### Commands

```
npm run dev          start the dev server (localhost:3000)
npm run lint         oxlint + design-system adherence checker + tsc --noEmit — must pass clean
npm run db:push      push prisma/schema.prisma to the live database (see §4 before running this)
npm run score:all    batch AI-score every application that doesn't have one yet
```

**`npm run db:reset`** exists in `package.json` but should essentially never be run — it force-
resets the connected database, and the connected database is the real production one (see §4).

### A quirk you will hit

After any `prisma generate`/`prisma db push`, an already-running `next dev` process keeps its old
in-memory Prisma client and throws stale errors referencing dropped/changed columns. Kill
whatever's on port 3000 (`lsof -ti:3000 | xargs -r kill`, add `-9` if needed) and restart — don't
wait for hot-reload to fix it, it won't.

## 4. Database & hosting — the single most important section to understand

**There are two different Supabase-hosted pieces, and they are easy to confuse:**

| | This app's own database | The live Zoho-fed source |
|---|---|---|
| What it is | Where Prisma writes everything: users, synced applications, reviews, jury scores, comments, notifications, outbox emails, jobs | The real table the Zoho Creator form writes into automatically, outside this codebase |
| Access | Full read/write, via `DATABASE_URL`/`DIRECT_URL` | **Read-only**, via `SUPABASE_URL`/`SUPABASE_ANON_KEY` (anon key, RLS-scoped) |
| Schema | Dedicated `delta_admin` schema on the same Supabase Postgres project (project ref `ysasmuxvusflvcetravz`, region `ap-south-1`) | A different table entirely |
| How data gets from one to the other | — | Synced in via `src/lib/sources/supabase-source.ts`, keyed by `externalId`, triggered from `/settings` |

**Any `prisma db push` is a live schema change against the real, currently-in-use production
database.** There is no separate staging environment. As of the last working session this
database holds **~125 real applicant records** and **10 real team-member logins** — no seed or
demo data of any kind remains in it.

Before a schema change that could drop a column with real data in it: write a tiny one-off script
that reads the affected rows to a JSON file first, run the push, then restore via the new shape if
needed. Delete the one-off script afterward. This exact playbook was used to convert a one-juror-
per-bench relation into a many-to-many one with zero data loss — see the git log around "Allow
jurors to sit on multiple benches" for a worked example if you need it again.

### Hosting

- **Vercel project**: `the-delta-prize-v3` — production URL `the-delta-prize-v3.vercel.app`.
  `.vercel/project.json` already has the project linked. Deploy with `git push origin main`
  (there's a Vercel Git integration) or `vercel --prod` from the CLI. After pushing, poll
  `vercel ls the-delta-prize-v3` until the newest deployment shows `● Ready` (builds take
  roughly 40 seconds).
- **GitHub repo**: `tanushhh21/the-delta-prize`, branch `main` — the single source of truth for
  deployed code.
- Every variable in `.env.example` needs to be set in the Vercel project's Environment Variables
  for the deployed app to actually work.
- `postinstall` runs `prisma generate` automatically on every Vercel build.

## 5. Auth & roles

Real login at `/login` (email + password). Passwords are one-way `scryptSync` hashes
(`src/lib/auth/password.ts`) — **plaintext passwords must never be committed to git**. If you
need a one-off script to set someone's password, write it, run it once (`npx tsx
scripts/whatever.ts`), and delete it immediately, before staging anything.

Four roles: **ADMIN**, **REVIEWER**, **JURY**, **OBSERVER** (`src/lib/constants.ts`
`USER_ROLES`). The role-scoping logic lives in `src/lib/auth/guard.ts`:

- Reviewers see the **entire** applications list (same as admin/observer) — their assignment
  only determines what they're expected to review, not what they're allowed to browse.
- Jury only sees applications marked `internalDecision: YES` **and** placed on one of their
  bench(es) — a juror can sit on more than one bench simultaneously.
- Only ADMIN can manage settings, transition an application's formal stage, or send email.

### Reviewer auto-assignment is an email allow-list, not a role filter

Most real reviewers actually hold the `ADMIN` role in the database (that's their genuine platform
permission level). `src/lib/applications/assignment.ts`'s `ROTATION_EMAILS` is therefore a fixed
list of specific email addresses — only those people ever get a new application auto-assigned,
round-robin, continuing wherever the rotation last left off. If you ever change who should be in
the rotation, edit that list directly. (History note: this was once tried as a `role ===
'REVIEWER'` filter instead, which silently broke assignment for every new application because no
real reviewer account actually had that role value — caught only after 10 applications went
unassigned. Don't repeat that mistake.)

## 6. Jury round

A **bench** is a small jury panel. `User` ↔ `Bench` is a genuine many-to-many relation — a juror
can sit on more than one bench, and a bench holds multiple jurors. Managed at
`/settings/benches`.

Two different jury-facing views:
- **`/jury`** (admin-only oversight) — every shortlisted application across every bench, with
  filters for name / bench / an average-jury-score bucket, and one score column per juror seat
  on that bench (so an unscored juror shows an empty dash rather than not appearing at all).
- **`/applications`** when signed in as a JURY-role user — that juror's own bench only, trimmed
  columns, no filters (a juror's own list is small enough that filtering isn't useful, and
  showing the internal oversight filters there was a bug that's since been fixed).

## 7. Team & credentials

As of the last working session: 8 ADMIN accounts, 1 REVIEWER (KC — deliberately excluded from
new-application auto-assignment, though their account and any in-progress reviews remain intact),
1 JURY test account (used to verify jury features — don't delete the bench structure it's
attached to without checking first).

The original team roster's passwords follow the scheme `{firstname_lowercase}_{ddmmyyyy date of
joining}` (login username is always the person's email, not their first name) — see
`scripts/seed-logins.ts` if it's still present. Accounts added later had passwords set ad hoc by
whoever onboarded them; ask them directly rather than guessing or resetting a real person's
password without checking first.

**Never put a real password in this file, in a commit, or in any doc.** Get current credentials
directly from a team member with access.

## 8. AI scoring

One 8-criterion rubric (`src/lib/scoring/rubric.ts`), used identically by the AI scorer and every
human/jury scoring form — verified aligned in code, no divergence between what a machine grades
and what a person grades. A weighted composite + disposition (STRONG_ADVANCE / ADVANCE / HOLD /
REJECT) is computed server-side from admin-tunable per-criterion weights (`/settings`), with an
admin-override path that propagates everywhere the score is shown. Section-level reads render as
a red/orange/green horizontal bar with a "why" info button surfacing the model's actual rationale
per criterion — not just a bare percentage.

Scoring provider resolution: explicit `SCORING_PROVIDER` env var, or auto-detected from whichever
API key is set (Groq → Anthropic → Gemini → heuristic fallback, in that order).

## 9. Email

Outbound mail is never sent automatically — every stage-change email is written to an `Outbox`
table first and needs an admin to review and approve/send it from `/outreach`. **The intent going
forward is that all outbound email is sent from one dedicated account** ("Prize Applications",
`applications@thedelta.org.in`) rather than any individual team member's inbox. Gmail SMTP for
that account (`GMAIL_USER`/`GMAIL_APP_PASSWORD`/`EMAIL_PROVIDER=gmail`) was discussed but not
fully wired up as of the last working session — it needs a real Google App Password from that
account's owner (requires 2-Step Verification enabled first) set in Vercel's environment
variables.

## 10. Design system & lint

All UI is built from the shared component barrel at `src/design-system/` — no hand-rolled
buttons/inputs/cards. Conventions: lowercase UI copy, no em dashes in user-facing strings, no
border-radius or circular elements (aside from lucide `CircleAlert` icon glyphs). `npm run lint`
chains `oxlint`, a custom regex-based adherence checker (`scripts/check-adherence.mjs` — catches
raw hex colors / raw px strings / off-brand fonts in `src/`), and `tsc --noEmit`. It must show
"Found 0 warnings and 0 errors" and a clean adherence pass before any change is considered done.

## 11. Directory map

```
src/app/
  (public)/                challenge, apply, apply/thank-you, status — public-facing pages
  login/                    real email+password sign-in
  (app)/                     internal tool, behind AppShell nav + real auth
    dashboard/, applications/, jury/, outreach/, targets/, analytics/, settings/ (incl. settings/benches)
  api/
    applications/export/     CSV export
    notifications/           unread-count + recent-list feed for the notification bell
    ingest/, jobs/tick/, score/

src/components/           ApplicationRow, ApplicationFilters, ApplicationMainContent,
                          StageActionBar, ReviewScoringForm, JuryScoreCard, JuryScoresTable,
                          JuryListFilters, InternalJuryRow, JuryApplicationRow, JurySidePanel,
                          BenchManager, MultiSelect, NotificationBell, CommentThread,
                          PersonalNotes, DecisionStatusButtons, ExportCsvButton, UserRoleManager,
                          AppShell

src/design-system/        shared UI primitives, re-exported from index.ts

src/lib/
  applications/            queries, actions, apply-action, assignment (reviewer rotation),
                            exportColumns, consensus
  auth/                     session, guard, actions, password, session-token
  benches/                  queries, actions — bench CRUD + juror multi-bench assignment
  notifications/            queries, actions — @mention parsing + read/unread
  automation/, analytics/, dashboard/, enrichment/, jobs/, mail/, matching/, scoring/, sources/,
  stages/, targets/, constants.ts, db.ts, settings.ts

prisma/schema.prisma        the real production schema — see §4 before changing it
scripts/                    check-adherence.mjs (part of lint), score-all.ts, and a scratch space
                            for one-off DB scripts — write, run once, delete immediately,
                            especially anything touching passwords or real user data
```

## 12. Open items as of the last working session

- Gmail SMTP for the "Prize Applications" sending account is not fully wired up (see §9) — needs
  a real Google App Password.
- No other explicitly pending feature requests as of the last message in the previous session.

---

For deeper implementation-level notes (exact bug patterns to avoid, the full history of recent
feature work, precise file-by-file responsibilities), see **`CLAUDE.md`** in the repo root.
