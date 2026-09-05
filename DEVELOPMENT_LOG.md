# Pulse — Development Log

> This is the phase-by-phase build journal: what was built in each of the
> 14 development phases, what was verified and how, and every real bug
> found and fixed along the way. For the project overview, architecture,
> API reference, and interview-discussion write-up, see the top-level
> [README.md](./README.md) — this file is the detailed supporting record
> behind it.

# Pulse — Personal Intelligence & Growth Platform

> Status: **Phase 13 of 14 — Final visual polish.**
> This README grows with each phase (see the "Next" section at the bottom for the roadmap).

Pulse is a personal intelligence platform combining technology/news discovery,
career growth tracking, learning progress, goals, and personal analytics into
one dashboard.

## Local setup

Requirements: Node 18+, Docker Desktop (or Docker Engine + Compose).

```bash
git clone <your-repo-url>
cd pulse
cp .env.example .env          # defaults already match docker-compose.yml
npm install                   # also runs `prisma generate`
npm run db:up                 # starts PostgreSQL in Docker
npm run db:migrate            # applies migrations
npm run db:seed               # loads realistic demo data
npm run dev                   # http://localhost:3000
```

Demo login (created by the seed script): `demo@pulse.app` / `PulseDemo123!`

### Everyday commands

| Command | What it does |
|---|---|
| `npm run db:up` | Start PostgreSQL (Docker, detached) |
| `npm run db:down` | Stop PostgreSQL |
| `npm run db:reset` | Wipe the DB volume, restart, re-migrate, and re-seed — the fastest way back to a clean state |
| `npm run db:studio` | Open Prisma Studio to browse data visually |
| `npm run db:migrate` | Apply/create a migration in development |
| `npm run dev` | Start the Next.js dev server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test` | Run the test suite (19 tests: password hashing, session tokens, validation) |

### Why Docker + real Postgres (not SQLite)

The schema uses Postgres-specific features on purpose — native arrays
(`interests String[]` on `UserPreference`), `JSONB` (`Activity.metadata`),
and enum types — so the local environment matches a real hosted Postgres
instance behavior-for-behavior. `DATABASE_URL` is the only thing that
changes when moving from Docker to a managed provider (RDS, Supabase,
Neon, Railway, etc.) later.

## Database schema (Phase 1)

15 models, defined in `prisma/schema.prisma`:

- **Identity**: `User`, `Session` (server-side, revocable), `Profile`, `UserPreference`
- **Growth**: `Skill`, `SkillProgress` (time-series history per skill)
- **Goals**: `Goal`, `GoalMilestone`
- **Learning**: `LearningResource`, `LearningSession` (time-logged study sessions)
- **Discovery**: `Article`, `Tag` (many-to-many), `SavedArticle` (per-user save/folder/favorite state)
- **Engagement**: `Activity` (timeline feed), `Notification`

Design notes:
- Every user-owned table cascades on `User` delete — verified directly against
  Postgres (deleting a user correctly cascades through goals → milestones,
  skills → skill history, saved articles, activities, sessions, etc.), while
  shared content like `Article`/`Tag` is untouched by a user's deletion.
- `Skill` and `LearningResource` keep append-only history tables
  (`SkillProgress`, `LearningSession`) rather than overwriting a single
  "current value," so the growth charts in later phases have real time-series
  data to plot.
- Composite indexes (`goals(userId, status)`, `activities(userId, occurredAt)`,
  etc.) match the query patterns the dashboard and filtered list views will
  actually use.

## What's verified so far

- `docker-compose.yml` + `.env.example` produce a working `DATABASE_URL`.
- `prisma/schema.prisma` is complete for the full product scope in the spec
  (identity, growth, goals, learning, discovery, activity/notifications).
- The initial migration (`prisma/migrations/20260828000000_init/`) and the
  Phase 2 migration (`.../20260828010000_add_password_reset_tokens/`) were
  both applied against a live PostgreSQL 16 instance with zero errors — all
  16 tables, enums, foreign keys, and indexes created successfully.
- Relational integrity was verified directly against Postgres: unique
  constraints reject duplicates correctly, cascade deletes remove all
  dependent rows (including two levels deep, e.g. goal → milestone), and
  shared content (articles/tags) correctly survives a user's deletion.
- `prisma/seed.ts` is written and ready — it mirrors exactly the data shapes
  that were just verified against the live database.
- **A note on "the app builds" claims in this README's history:** this
  sandbox cannot reach `binaries.prisma.sh` (network is domain-allowlisted;
  confirmed via a direct request returning `403 host_not_allowed`), so
  `prisma generate` never produces a working query engine here. Every
  phase's code has been verified as thoroughly as that constraint allows —
  `npx tsc --noEmit` and `npx next lint` both run clean across the entire
  `src/` tree with zero errors — but a full `next build` cannot complete in
  this sandbox specifically, because Next's "Collecting page data" step
  imports every route module, which imports the Prisma client singleton,
  which throws when constructed without a generated engine (this is
  Prisma's own recommended singleton pattern in `src/lib/prisma.ts` — not
  a bug, just something that needs the real engine to run at all). On a
  machine with normal network access, `npm install` runs `prisma generate`
  successfully via postinstall and this resolves itself completely. The
  business logic itself has been independently verified throughout via raw
  SQL against a live local Postgres instance (see each phase section below
  for specifics) — that verification does not depend on the Prisma client
  being generated.
- The vitest suite passes (19/19 tests covering password hashing, opaque
  token generation, and validation schemas) — pure logic with no database
  dependency, so it runs fully in any environment.
- The full auth flow — signup, login, session creation/lookup/logout,
  password-reset token issuance/use/expiry, cascade-on-user-delete, and
  invalidating every session on password reset — was verified end-to-end
  against the live Postgres instance.
- The dashboard aggregation logic — active-goal filtering, date-range
  totals, streak calculation, and interest-based recommendations — was
  verified against a seeded dataset with deliberately edge-casey dates.
- Real Postgres full-text search (weighted `tsvector` + GIN index) was
  verified directly: title matches correctly outrank body-only mentions,
  and search + category filters compose correctly.
- Article discovery/detail logic — pagination counts, category filtering,
  sort ordering, combined search+category filtering, save/unsave
  idempotency, mark-as-read, and related-article exclusion — was verified
  against a seeded article set with 7 passing checks.
- Growth tracker logic — skill history accumulation on create/update,
  resource-completion side effects (progress forced to 100, exactly one
  activity logged even if edited again), the consecutive-day streak
  calculation, all-time totals correctly including sessions outside the
  182-day heatmap window, and per-user ownership enforcement — verified
  with 6 passing checks against live Postgres.
- Goals logic — milestone-driven progress recomputation (including correct
  rounding), the deliberate choice that 100% milestone completion does NOT
  auto-complete the goal, explicit completion setting/clearing
  `completedAt` and logging exactly one activity, archive filtering, and
  cascade delete of milestones — verified with 8 passing checks against
  live Postgres.
- Learning workspace logic — per-resource session-stats aggregation,
  status/type filtering, completion rate correctly excluding
  not-yet-started resources from its denominator, average rating
  correctly excluding unrated resources, the hours-by-category join, the
  7-day vs. 30-day session windows, and that deleting a resource
  nullifies (rather than deletes) its historical sessions — verified with
  7 passing checks against live Postgres.
- Analytics logic — skill-points-gained correctly scoped to only the
  in-range history points (not the resource's full lifetime), the
  consistency-percent calculation, the categories-consumed aggregation
  (article category joined through the save/read relationship), and the
  completion-rate snapshot correctly excluding archived goals from both
  numerator and denominator — verified with 4 passing checks against live
  Postgres.
- Cross-entity search and saved-knowledge library — search correctly
  matches only relevant rows per entity (articles, skills, resources,
  goals) while excluding unrelated ones, results are correctly scoped
  per-user rather than leaking across accounts, and folder filtering,
  favorite toggling, notes persistence, distinct-folder listing, and
  tag resolution via the article join table all behave correctly —
  verified with 7 passing checks against live Postgres.
- `tsconfig.json` correctly excludes `prisma/**` from the app's own
  type-check surface (a seed script run via `tsx` shouldn't be coupled to
  the Next.js build's TypeScript project), which was fixed in Phase 10 —
  `npx tsc --noEmit` now passes with zero errors project-wide, for the
  first time with nothing filtered out or explained away.
- The vitest suite grew from 19 to 97 tests in Phase 11 — password/token
  logic, validation schemas across every feature (auth, goals, skills,
  learning, library, search, articles), and newly-extracted pure
  calculation modules (date bucketing, streak calculation, goal-progress
  rounding). A real bug was found in the process — see the Phase 11
  section below — and is now pinned by a regression test.
- Phase 12 fixed a genuine duplicate-query bug (session validation running
  twice per page load, once in the layout and once in every page under
  it) via React's `cache()`, code-split all six recharts-using components
  out of their pages' main bundles, and added `loading.tsx` skeletons to
  all seven data-heavy routes. `tsc` and `next lint` both remain at zero
  errors after these changes and all 97 tests still pass; the runtime
  query-count improvement itself could not be directly observed here, for
  the same Prisma-engine reason documented in Phase 10.

## Authentication (Phase 2)

**Session strategy: server-side, DB-backed, opaque tokens — not JWTs.**
On login/signup, a random 256-bit token is generated and set as an
`httpOnly`, `sameSite=lax` cookie. Only a SHA-256 hash of that token is
stored in the `sessions` table; the raw token never touches the database.
Every request that needs the current user looks the hash up in Postgres,
which means:

- **Logout is instant.** Deleting the `sessions` row invalidates the cookie
  immediately — there's no window where a stateless JWT would still verify
  until its own expiry.
- **A password reset can force-logout every device** in one query
  (`destroyAllSessionsForUser`), which a JWT-only design can't do without a
  separate revocation list anyway — at which point you've rebuilt this.
- Password reset tokens use the identical opaque-token-hash pattern, scoped
  to one hour and single-use (`usedAt` is set on use; the token is rejected
  on any subsequent attempt).

**Password hashing** uses bcrypt at cost factor 12 — slow enough to make
offline brute-forcing of a leaked hash expensive, fast enough (~150–250ms)
not to bottleneck signup/login. Session and reset tokens intentionally use
a *fast* hash (SHA-256) instead: they carry 256 bits of entropy and are
never subject to dictionary attacks, so bcrypt's deliberate slowness would
only add latency with no security benefit.

**Authorization / protected routes** are enforced in two layers:
1. `src/middleware.ts` runs on the Edge runtime and does a cheap
   cookie-presence redirect before a protected page even renders. Edge
   functions can't hold a long-lived Postgres connection, so this layer is
   an optimization, not the source of truth.
2. `requireUser()` (`src/lib/auth/require-user.ts`), called from the
   `(app)` route group's layout, is the authoritative check — it queries
   Postgres, confirms the session hasn't expired or been revoked, and
   redirects to `/login` if not. This is what actually decides access.

**Enumeration resistance:** login returns an identical error for "no such
user" and "wrong password." Forgot-password always returns the same
success message regardless of whether the email is registered.

**Rate limiting** is a simple in-memory fixed-window limiter
(`src/lib/rate-limit.ts`), intentionally scoped to a single Node process —
documented in the file itself as the first thing to swap for Redis `INCR`
once there's more than one server instance.

**No email provider is wired up** (the spec requires zero paid services for
local dev). The forgot-password endpoint logs the reset link server-side
and, only when `NODE_ENV=development`, echoes it back in the API response
so the flow is fully testable without an inbox.

## Dashboard (Phase 3)

`src/server/services/dashboard.ts` is the single source of truth for
dashboard data — both `GET /api/dashboard?range=` and the server-rendered
`/dashboard` page call the same `getDashboardData()` function, so the API
and the page can never drift out of sync with each other.

What it computes, all scoped to the signed-in user:
- **Today's Pulse** — current streak (consecutive days with any learning
  session or activity, capped at a 90-day lookback), count of active goals,
  minutes learned today, and today's top recommended story.
- **Growth overview** — totals (learning hours, goals completed, distinct
  skills with a recorded improvement, articles read) over a selectable
  7/30/90/365-day window, plus a time series for the chart. Bucketing is
  adaptive: daily points for 7–30 days, weekly for 90, monthly for a year,
  so the chart stays legible instead of cramming 365 daily points onto one
  axis.
- **Goals** — active (not archived, not completed) goals with milestone
  completion counts and a human-readable deadline countdown.
- **Skills** — current level plus a trend arrow derived from the two most
  recent `SkillProgress` entries.
- **Recommended reading** — articles matching the user's stated interests,
  excluding ones already saved; falls back to the latest articles generally
  if interests haven't been set yet or nothing matches, so a brand-new
  account never sees an empty "recommended for you" section for no reason.
- **Recent activity** — the last 10 activity-feed entries.

The range selector on the growth chart (`GrowthOverview`, a client
component) re-fetches `/api/dashboard?range=` on change rather than
recomputing client-side, so the totals and series always reflect a real
server-side query — including for ranges the initial server-render didn't
already have on hand.

Every card (`GoalsCard`, `SkillsCard`, `RecommendedReadingCard`,
`RecentActivityCard`) renders a purpose-built empty state — "No goals yet,"
"Start tracking your growth," etc. — rather than an empty box, matching the
spec's empty-state requirement; these are easiest to see by signing up for
a fresh account (which starts with no data) rather than the seeded demo
account.

**Verified against real data:** the aggregation logic was checked against a
seeded dataset with deliberately edge-casey dates — a learning session just
outside the 30-day window (correctly excluded from the range total), an
activity gap that should break the streak (correctly stops it at 3 days
instead of counting through the gap), a goal completed inside vs. outside
the range, and an article in a category outside the user's stated interests
(correctly excluded from recommendations). All seven checks passed against
live Postgres.

## News / discovery (Phase 4)

**Search is real Postgres full-text search, not `ILIKE '%term%'`.** The
Phase 4 migration adds a `search_vector` column to `articles`, generated
automatically by Postgres (`GENERATED ALWAYS AS ... STORED`) from the
title, subtitle, and body — weighted `A`/`B`/`C` respectively, so a title
match always ranks above an incidental body mention — with a GIN index so
lookups stay fast as the table grows. `listArticles()`
(`src/server/services/articles.ts`) queries it via `$queryRaw` with
`plainto_tsquery` and `ts_rank`, rather than the Prisma query builder,
specifically for this path; category filtering, sorting, and pagination
outside of a search term still go through the normal type-safe Prisma API.

**Two branches instead of dynamic SQL composition.** The search query has
a "with category filter" and "without" version as separate tagged
templates, rather than building the `WHERE` clause dynamically with
`Prisma.sql`/`Prisma.empty`. This keeps injection-safety trivial to reason
about (every value is a plain tagged-template interpolation, parameterized
automatically) at the small cost of two similar-looking query strings.

**Article detail resolves by id or slug** (`GET /api/articles/[id]`) —
the REST resource is conventionally keyed by id, but article pages link by
slug for readable URLs; the route checks for an id match first and falls
back to treating the param as a slug.

**Reading progress doubles as the read receipt.** `ReadingProgress` tracks
scroll position and calls `POST /api/articles/:id/read` once the reader
passes 80% of the page — no separate "mark as read" button needed, and it
fires at most once per page load.

**Verified against real data:** full-text ranking (title-match articles
outrank body-only mentions, non-matching articles are correctly excluded
entirely), pagination counts, category filtering, sort ordering, combined
search+category filtering, save/unsave idempotency (re-saving doesn't
duplicate the row), mark-as-read, and related-article exclusion — 7 checks,
all passing against live Postgres.

## Growth tracker (Phase 5)

`src/server/services/growth.ts` consolidates skills, learning resources,
the activity heatmap, and monthly growth into one `getGrowthData()` call
backing `GET /api/growth` and the `/growth` page — the same
single-source-of-truth pattern as the dashboard service.

**Skill history is append-only.** Adding a skill writes an initial
`SkillProgress` row at the starting level; updating `currentLevel` appends
another rather than overwriting anything, so the skill-detail line chart
and the radar-vs-target comparison are always plotting real historical
data, not a single current snapshot. A level update and its history/activity
rows are written in one `$transaction`, so a failure can't leave the level
changed without the corresponding history entry, or vice versa.

**State-transition side effects are explicit, not implicit.** Marking a
learning resource `COMPLETED` forces `progress` to 100 and logs exactly one
`RESOURCE_COMPLETED` activity — checked specifically for "exactly one,"
since a naive implementation might log a duplicate activity if the resource
is edited again while already completed.

**The activity heatmap is zero-filled and ownership-scoped.** It always
covers a fixed 182-day window (about 26 weeks, GitHub-contribution-graph
style) with an explicit `0` for days with no sessions, so the grid never
has silent gaps. The current-streak calculation counts consecutive
non-zero days ending today and correctly stops at the first zero day
rather than continuing past a gap.

**Scope note:** the master spec's "achievements" and "habits" aren't
separate models here — they're represented through existing `Activity`
entries and completed `LearningResource`/`Skill` milestones rather than new
tables, to avoid schema sprawl for concepts that don't yet have a
concretely different shape from what's already tracked.

**Verified against real data:** skill-history accumulation on create vs.
update, the resource-completion side effect (including that it fires
exactly once, not again on a later no-op edit), the streak calculation
correctly stopping at a gap, all-time totals correctly including sessions
outside the 182-day heatmap window, and per-user ownership checks — 6
checks, all passing against live Postgres.

## Goals (Phase 6)

A dedicated `/goals` page with real filtering (status, archived) and
sorting (deadline, priority, newest), backed by `GET /api/goals`, full
create/update/delete, and nested milestone endpoints
(`POST/PATCH/DELETE /api/goals/:id/milestones[/:milestoneId]`).

**One flexible PATCH, not one endpoint per verb.** Edit, mark-complete,
pause/resume, and archive/unarchive are all just field transitions on the
same `Goal` resource (`status`, `archived`), so they share a single
`PATCH /api/goals/:id` rather than needing `/complete`, `/archive`, etc.
as separate routes. Two transitions carry side effects: newly reaching
`COMPLETED` sets `completedAt` and forces `progress` to 100 and logs a
`GOAL_COMPLETED` activity; moving *off* `COMPLETED` clears `completedAt`
again so the record doesn't misrepresent when — or whether — the goal was
actually finished.

**Progress is derived from milestones, not hand-set, once milestones
exist.** Adding, completing, or deleting a milestone recomputes the
parent goal's `progress` from the completion ratio. Deliberately, reaching
100% this way does **not** auto-transition the goal's `status` to
`COMPLETED` — that stays an explicit user action, since silently marking
something "done" without confirmation would be a bad surprise the one time
a milestone gets checked off by mistake.

**Client-side filtering avoids a stale-props trap.** The goals board is a
client component (status/sort/archived filters need to live somewhere),
but its mutating children call back into the board's own filtered
`fetchGoals()` rather than `router.refresh()` — router-refresh would
re-run the server page with its *default* query and silently discard
whatever filter the user currently has active. Small thing, but the kind
of bug that only shows up once someone actually applies a non-default
filter and then edits something.

**Verified against real data:** milestone-driven progress recomputation
(with correct rounding), the "100% milestones ≠ auto-complete" behavior,
explicit completion correctly setting/clearing `completedAt` and logging
exactly one activity, archive filtering correctly separating active from
archived goals, cascade delete of milestones, and per-user ownership
enforcement — 8 checks, all passing against live Postgres.

## Learning workspace (Phase 7)

A dedicated `/learning` page separates the "manage my resources" workflow
from the growth page's more compressed skill/heatmap view, adding: full
listing with status/type filters and sorting (`GET /api/learning`),
deleting a resource, and `GET /api/learning/analytics` for
completion-rate/rating/hours-by-category rollups.

**Session stats are joined onto each resource, not stored redundantly.**
`totalMinutes`, `sessionCount`, and `lastSessionAt` per resource come from
a `groupBy` over `LearningSession` joined in application code — there's no
denormalized "total time" column on `LearningResource` to keep in sync,
so it's structurally impossible for that number to drift from the actual
session history.

**Completion rate has a deliberately narrow denominator.** It's completed
÷ (started, i.e. not `WANT_TO_LEARN`) — resources still sitting in a
wishlist shouldn't count against you for not being finished yet. Average
rating similarly only considers resources that have actually been rated,
rather than treating an unrated resource as a zero.

**Logging a session against a `WANT_TO_LEARN` resource auto-advances its
status to `LEARNING`.** Small thing, but it means the status field always
reflects reality without a separate manual step the user would predictably
forget.

**Verified against real data:** per-resource session-stat aggregation,
status/type filtering, the completion-rate denominator correctly excluding
not-yet-started resources, average rating correctly excluding unrated
ones, the hours-by-category join (sessions → resource → category), the
7-day vs. 30-day session windows, and that deleting a resource nullifies
rather than deletes its historical sessions (so past learning time isn't
erased just because the resource itself was removed) — 7 checks, all
passing against live Postgres.

## Analytics (Phase 8)

A dedicated `/analytics` page (`src/server/services/analytics.ts`,
`GET /api/analytics?range=`) consolidating the three sections the spec
calls for — Growth, Knowledge, Productivity — with a shared 7/30/90/365-day
range selector, rather than each metric living only inside the feature
page it originated from.

**Snapshot metrics vs. range-scoped metrics are kept honest, not blended.**
Active-goal count and completion rate are deliberately *not* scoped to the
selected date range — "how many goals are currently active" and "what
fraction of my goals are done" are snapshots of right-now, and forcing
them through a 7-day/1-year toggle would just make the number jump around
meaninglessly as the range changes. Learning sessions, articles read,
skill points gained, and the minutes-over-time chart, on the other hand,
are genuinely range-scoped and change with the selector. Mixing these two
kinds of numbers under one date picker without distinguishing them is a
common dashboard mistake this page deliberately avoids.

**Skill-points-gained only counts progress recorded inside the window.**
It's the delta between a skill's first and last `SkillProgress` entry
*within the selected range* — not the skill's all-time growth — so
selecting "7 days" doesn't retroactively credit a skill for a jump that
happened three months ago.

**Completion rate excludes archived goals from both sides of the
fraction**, matching the Goals page's own semantics: an archived goal
isn't "not done," it's off the board entirely, so it shouldn't drag the
rate down or artificially inflate the denominator.

**Verified against real data:** skill-points-gained correctly using only
in-range history points (not the skill's full lifetime), the
consistency-percent calculation, the categories-consumed aggregation
(joining read status through to each article's category), and the
completion-rate snapshot correctly excluding archived goals from both
numerator and denominator — 4 checks, all passing against live Postgres.

## Search + saved knowledge (Phase 9)

A global search bar in the top nav (`GlobalSearch`) queries
`GET /api/search?q=` and shows grouped, debounced results across articles,
learning resources, skills, and goals — one input instead of remembering
which page has the thing you're looking for.

**Two different search strategies, deliberately.** Articles reuse the
Phase 4 full-text index (`search_vector` + `ts_rank`); resources, skills,
and goals use a plain case-insensitive `contains`. This isn't inconsistency
for its own sake — articles are a shared, potentially large table where
ranking quality matters, while a single user's skills or goals number in
the dozens at most, so a `tsvector` column there would be indexing
overhead with no real payoff. Verified that user-scoped entities stay
scoped: a skill named "Rust" for one account never surfaces in another
account's results, even searching the identical term.

**Saved knowledge is scoped to what's already modeled, not a new "Note"
entity.** `SavedArticle` already had `folder`, `notes`, and `isFavorite`
fields since Phase 1 — the `/library` page surfaces and makes those
writable (folder assignment, favoriting, note-taking) rather than
introducing a parallel standalone-notes system. This is the same call as
"habits/achievements" back in Phase 5: the spec's "save notes" is already
covered by the notes field attached to each saved item, and a separate
model for freeform notes with no other distinguishing behavior would be
schema growth without a real feature behind it.

**Tags are reused, not duplicated.** Article tags (`Tag`/`_ArticleToTag`
from Phase 1) are surfaced directly on each library card rather than
building a second saved-item-specific tagging system — one tag vocabulary
for the whole app.

**Verified against real data:** search correctly matches only the relevant
row per entity while excluding unrelated ones, and stays scoped per user
rather than leaking across accounts; folder filtering, favorite toggling,
notes persistence, distinct-folder listing, and tag resolution through the
article join table all behave correctly — 7 checks, all passing against
live Postgres.

## Responsive design + accessibility (Phase 10)

This phase found and fixed two real gaps that had been sitting unfixed
since earlier phases, plus a build-pipeline issue worth being direct
about.

**Mobile navigation had no fallback at all.** Since Phase 3, the nav links
were `hidden lg:flex` — meaning anyone below the `lg` breakpoint (most
phones and small tablets) had literally no way to reach Growth, Goals,
Learning, Library, or Analytics except by typing the URL directly. Fixed
with `MobileNav`, an accessible slide-out panel (Radix Dialog under the
hood, so focus-trapping, Escape-to-close, and return-focus-on-close are
all handled correctly for free) exposed via a hamburger trigger below `lg`.

**Dark mode had CSS variables but no way to turn it on.** The `.dark`
class and every color token have existed since Phase 1's `globals.css`,
and a complete `ThemeProvider`/`ThemeToggle` pair existed in the
codebase — but neither was ever imported into a layout, so toggling theme
did nothing. Fixed by wrapping the root layout in `ThemeProvider` and
rendering `ThemeToggle` in the app header, plus a blocking inline script
in `<head>` that reads the stored preference and sets the class *before*
hydration — without it, the theme would only apply inside a `useEffect`
that runs after first paint, producing a visible flash of the wrong theme
on every load for anyone with dark mode selected.

**Accessibility fixes**: icon-only interactive elements that lacked an
accessible name (a milestone's delete button, an external-link icon on
resource cards) now have `aria-label`s; the custom milestone-completion
control now exposes `role="checkbox"`/`aria-checked` instead of being an
unlabeled `<button>` a screen reader would announce as nothing meaningful;
a skip-to-content link was added ahead of the header; and
`prefers-reduced-motion: reduce` now collapses animation/transition
durations globally rather than the app ignoring that OS-level preference
entirely. Dialogs were already in good shape — Radix's `Dialog` primitive
handles focus trapping, `aria-modal`, and Escape-to-close by default, and
every dialog in the app already had a proper `DialogTitle`.

**A build-pipeline bug, found and fixed as a side effect of finally
getting a completely clean type-check.** `tsconfig.json`'s broad
`"**/*.ts"` include was pulling `prisma/seed.ts` — a standalone script run
via `tsx`, not part of the Next.js app — into the app's own TypeScript
project. Excluding `prisma/**` fixed that coupling. Doing so also
revealed, one stage later in this sandbox's build pipeline, the actual
underlying limitation that's been present since Phase 1: `next build`'s
page-data-collection step imports every route module, which imports the
Prisma client singleton, which throws when constructed without a
generated query engine — meaning `next build` was never going to fully
complete in this network-restricted sandbox regardless. This isn't a code
defect (`src/lib/prisma.ts` uses Prisma's own recommended singleton
pattern) and resolves itself completely wherever `prisma generate` can
actually run. `npx tsc --noEmit` and `npx next lint` both now pass with
zero errors across the entire `src/` tree, which — combined with the raw
SQL verification against live Postgres documented throughout this
README — is the strongest confidence available without that network
access.

**What genuinely could not be verified here:** actual pixel-level visual
rendering — spacing, contrast, whether the mobile drawer looks right at a
375px viewport, whether dark mode's palette feels intentional rather than
just inverted. This sandbox has no browser to screenshot. Worth an actual
visual pass once running locally, per the master spec's own "inspect every
major screen" checklist.

## Testing + security (Phase 11)

**Authorization audit — every mutating route, checked systematically.**
Grepped every file under `src/app/api` for auth calls: all 21 non-auth
routes call `getSessionUser()`, and every scoped mutation (goals, skills,
learning resources, milestones, saved-library items) verifies the record
actually belongs to the requesting user before touching it — not just "is
someone logged in," but "does this specific row belong to them." Goals'
milestone routes chain both checks correctly: goal ownership, *then*
confirming the milestone belongs to that specific goal.

**A real gap found in that audit:** `GET /api/skills` didn't exist — only
`POST` did, despite `GET /api/skills` being explicitly named in the master
spec's API list. Added `listSkills()` and the route.

**Security headers added**, previously entirely absent:
`X-Frame-Options: DENY` (clickjacking), `X-Content-Type-Options: nosniff`
(MIME-sniffing), `Referrer-Policy: strict-origin-when-cross-origin`, and a
`Permissions-Policy` opting out of camera/mic/geolocation the app never
uses — configured once in `next.config.js` so every route gets them.

**A real, live bug found while writing validation tests — not a
hypothetical.** `z.coerce.boolean()` coerces via JavaScript's `Boolean()`,
and `Boolean("false")` is `true` (any non-empty string is truthy). Two
schemas used it for query params: the Goals page's "show archived" filter
and the Library page's "favorites only" filter. Both client components
serialize their boolean state the natural way —
`new URLSearchParams({ archived: String(showArchived) })` — which sends
the literal string `"false"` when the toggle is off. That string was
being silently coerced back to `true` server-side, meaning **the "Show
archived" toggle had been non-functional since Phase 6**: turning it off
still requested archived goals. Fixed with a proper
`booleanQueryParam()` helper (`src/server/validation/shared.ts`) that
parses the literal strings `"true"`/`"false"` instead of coercing, with a
regression test that explicitly demonstrates the old broken behavior
alongside the fixed one — so this can't quietly come back.

**Real refactor, not test padding.** Streak calculation and date-bucketing
logic had been independently duplicated across `dashboard.ts` and
`analytics.ts` (and goal-progress rounding duplicated between `goals.ts`'s
inline logic), each copy free to quietly drift from the others over time.
Extracted three shared pure modules — `src/lib/date-buckets.ts`,
`src/lib/streak.ts`, `src/lib/goal-progress.ts` — refactored every
consuming service to use them, and wrote thorough tests against the
shared versions instead of testing the same logic three times in three
places.

**Test suite grew from 19 to 97 tests**, all still running with zero
database dependency (pure logic and validation schemas): password
hashing, opaque tokens, the boolean-query-param fix and its regression
case, date bucketing (monotonicity, no gaps between buckets), streak
calculation (gap-stopping, longest-streak-not-necessarily-recent), goal
progress rounding, and validation edge cases across auth, goals,
skills/learning, library, search, and article schemas.

**What this phase does not add:** integration tests that exercise the
route handlers end-to-end against a real database. That would require the
generated Prisma client, which (as documented in Phase 10) this sandbox
cannot produce. Every mutation's actual database behavior has instead been
verified via raw SQL against live Postgres, phase by phase, throughout
this README — which is real verification of the same logic, just not in
`vitest run` form. On a machine with normal network access, the natural
next step would be `vitest` integration tests using a real test database
via the generated client, layered on top of what's here rather than
replacing it.

## Performance optimization (Phase 12)

**A real, measurable bug found by reading the layout tree, not by profiling.**
`(app)/layout.tsx` calls `requireUser()` to protect every route under it —
and every single page under that layout *also* calls `requireUser()`
again, to get the current user for its own data fetching. Before this
phase, that meant **two separate session-validation round trips to
Postgres on every page load** (`SELECT` on `sessions` JOIN `users`, twice,
for information that doesn't change partway through rendering one page).
Fixed by wrapping `getSessionUser()` in React's `cache()`
(`src/lib/auth/session.ts`) — the officially documented pattern for
exactly this problem in the Next.js App Router: memoize a data fetch per
request/render pass so nested Server Components (a layout and the page
inside it) share one result instead of independently re-fetching it. No
stale-session risk: the memoization is scoped to a single render, not
across requests.

**Recharts is now code-split, not bundled into every route.** Six
components import `recharts` (~90kb+ with its D3 dependencies): the
dashboard's growth chart, three cards on the growth page, the learning
analytics card, and the whole analytics dashboard. Previously, all six
shipped as part of their page's main JS bundle unconditionally — meaning,
for example, `/goals` and `/library`, which show no charts at all, were
never affected, but `/dashboard`, `/growth`, `/learning`, and `/analytics`
each paid the full recharts cost even before any chart rendered. Wrapped
each in `next/dynamic()` (without `ssr: false`, since these don't need
client-only browser APIs to produce their initial markup — just
code-splitting) so recharts loads as its own chunk per page, with a
lightweight `ChartCardSkeleton` shown while it streams in.

**Every data-heavy route now has a `loading.tsx`.** The App Router
automatically wraps a route segment in a `<Suspense>` boundary when a
sibling `loading.tsx` exists, showing it immediately on navigation while
the page's data fetching runs server-side. Added skeleton loading states
for `/dashboard`, `/news`, `/growth`, `/goals`, `/learning`, `/library`,
and `/analytics` — previously none of the seven existed, so navigating to
any of them showed nothing at all until the full page (data fetch
included) was ready.

**What this phase did not add:** blanket data caching (`unstable_cache` /
`revalidate`) for the dashboard, goals, or growth data. Those are exactly
the pages that need to reflect a mutation immediately — caching them
without careful invalidation would trade a performance win for showing
stale data right after the user edits something, which is a worse
tradeoff than the query cost being cached would save. Discovery's article
list (largely non-personalized, changes only when new articles are
seeded) would be the more defensible caching candidate in a future pass,
scoped narrowly rather than applied broadly.

**A verification limitation worth being direct about, same category as
Phase 10's:** the actual runtime effect of the `cache()` fix — one
Postgres query instead of two, observed via query logs during a real page
load — could not be demonstrated here, because that requires `next dev`
or `next start` actually serving pages, which needs the generated Prisma
client this sandbox cannot produce. What *is* verified: `npx tsc --noEmit`
and `npx next lint` both pass with zero errors after the change, all 97
tests still pass, and the pattern itself is Next.js's own documented
solution for this exact problem — not a novel or experimental approach.

## Final visual polish (Phase 13)

Same limitation as Phase 10, stated up front: this sandbox has no browser
to render or screenshot the app, so this could not be the pixel-level
"inspect every screen at every breakpoint" pass the master spec describes.
What it could be is a systematic **code-level** consistency audit —
grepping for the kinds of drift that visual inspection would also catch,
just from the markup and class names instead of a screenshot.

**What the audit checked, and found clean:**
- **Hardcoded colors that would break dark mode** — searched every
  component for raw `text-white`/`bg-black`/hex colors bypassing the
  design-token system (`hsl(var(--...))`). Zero found; every color in the
  app routes through the token system established in Phase 1, so dark
  mode (wired up in Phase 10) applies uniformly everywhere with nothing
  hardcoded to fight it.
- **Heading and subtitle consistency** — every top-level page header uses
  the identical `text-2xl font-semibold tracking-tight` / description uses
  `text-sm text-foreground/50`, with the sole intentional exception being
  the article reading page, which uses a larger editorial heading scale
  appropriate to a long-form page rather than a dashboard section.
- **Dead or orphaned components** — checked every file under
  `src/components` for at least one real import elsewhere in the app.
  None found unused.
- **Icon and button-variant usage** — sizes fall into a small, deliberate
  tier (`h-3`/`h-3.5`/`h-4`/`h-5`) rather than random per-component
  choices, and `Button`/`Badge` variant usage matches what each component
  actually declares (confirmed against the `cva` definitions directly,
  not just visually).

**What the audit found and fixed:** an identical `Stat` tile component —
same JSX, same classes, byte-for-byte — defined independently three times
across `growth-overview.tsx`, `analytics-dashboard.tsx`, and
`learning-analytics-card.tsx`. Exactly the kind of copy-paste that starts
identical and is one future edit away from three cards quietly rendering
stats slightly differently. Consolidated into a single
`src/components/ui/stat-tile.tsx`, imported by all three.

**What still needs a real look once running locally:** actual visual
rendering — does the mobile drawer feel right at a real 375px width, does
dark mode's palette read as intentional rather than just inverted, is
there awkward whitespace or crowding anywhere a screenshot would catch
but a class-name grep can't. That's the genuine gap a code-only audit
can't close, restated plainly rather than glossed over.

## Next: Phase 14 — README + documentation

The final phase: a complete pass over this README's structure against the
spec's requested table of contents (interview-discussion Q&A on scaling,
tradeoffs, and what changes at 100K/1M users), plus verifying every command
and setup step in "Local setup" is accurate end-to-end.
