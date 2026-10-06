# Pulse — Personal Intelligence & Growth Platform

A personal intelligence platform that brings technology/news discovery, career growth tracking, learning progress, goals, and personal analytics into one intelligent workspace — built as a portfolio-grade demonstration of full-stack engineering: real authentication, real authorization, real search, and a database verified against actual queries at every phase of development.

**Demo login:** `demo@pulse.app` / `PulseDemo123!` (created by the seed script)

> **A note on the database:** this codebase was originally designed and verified end-to-end against PostgreSQL (real generated-column full-text search, native arrays, database-level enums — see the Interview Discussion section and the Development Log for the full rationale and verification record). The version in this repo now runs on **SQLite** by default, for a specific, deliberate reason: local setup should not require Docker, a database server, or OS-level configuration to work on a first try. That conversion is a real engineering decision made under a real constraint, not an oversight — full writeup in [Engineering Challenges](#engineering-challenges), including exactly what was simplified (enums → validated strings, array field → JSON-encoded string, generated tsvector search → plain `contains`) and why each change is safe. Pointing `DATABASE_URL` at a real Postgres instance instead is a legitimate next step, not a full migration — see that section for specifics.

For the phase-by-phase build history — what was built when, what was verified and how, and every real bug found and fixed along the way — see [DEVELOPMENT_LOG.md](./DEVELOPMENT_LOG.md). This README is the project-level reference; that file is the detailed engineering diary behind it.

---

## Table of contents

1. [Problem](#problem)
2. [Solution](#solution)
3. [Features](#features)
4. [Screenshots](#screenshots)
5. [Architecture](#architecture)
6. [Tech stack](#tech-stack)
7. [Database architecture](#database-architecture)
8. [API documentation](#api-documentation)
9. [Authentication](#authentication)
10. [Security](#security)
11. [Performance decisions](#performance-decisions)
12. [Testing](#testing)
13. [Local setup](#local-setup)
14. [Troubleshooting](#troubleshooting)
15. [Environment variables](#environment-variables)
16. [Project structure](#project-structure)
17. [Engineering challenges](#engineering-challenges)
18. [Future improvements](#future-improvements)


---

## Problem

Tracking personal and professional growth is scattered across too many disconnected tools: a bookmarks folder for articles worth reading, a spreadsheet for goals, a notes app for learning logs, a separate app for skill tracking, and no single place that shows how any of it connects — whether the things you're reading relate to the skills you're building, whether your learning consistency is actually translating into goal progress, or what your growth even looked like last month.

## Solution

Pulse consolidates discovery, growth, goals, learning, and analytics into one workspace with a single coherent data model underneath it — a goal's milestones can drive its progress automatically, a learning session logged against a resource shows up in that resource's history *and* the growth heatmap *and* the analytics page's consistency score, and an article saved from Discover carries its category into the analytics breakdown of what you actually read. Nothing here is a static mockup: every number on every page is a real query against a real Postgres database, computed by a service layer that's been checked against live data at every step of development (see the Development Log for specifics).

## Features

**Discovery** — Editorial article browsing with search (see the database note above for the SQLite-vs-Postgres search implementation), category filtering, sorting, pagination, save/read state, and a reading page with scroll-based progress tracking that auto-marks articles read.

**Growth tracking** — Skills with historical progress (radar chart vs. target, per-skill history line chart), a GitHub-style activity heatmap, monthly growth trends, and learning-session logging.

**Goals** — Full CRUD with milestones, priority, deadlines, archiving, and status transitions (not started → in progress → completed/paused). Progress is derived automatically from milestone completion once a goal has any.

**Learning workspace** — Courses/books/articles/tutorials/docs/videos with status, ratings, notes, and per-resource session statistics; a dedicated analytics view (completion rate, average rating, hours by category).

**Goals + Growth + Knowledge analytics** — A consolidated `/analytics` page with a shared date-range selector, explicitly separating range-scoped metrics (learning minutes, articles read) from snapshot metrics (active goal count, completion rate) rather than conflating the two under one date picker.

**Search + saved knowledge** — One global search bar across articles, skills, learning resources, and goals; a saved-knowledge library with folders, favorites, and notes built on top of the article-save relationship.

**Auth** — Signup, login, logout, forgot/reset password, server-side revocable sessions (not stateless JWTs), rate limiting on every auth endpoint.

**Cross-cutting** — Dark mode, mobile navigation, keyboard-accessible dialogs, skip-to-content link, `prefers-reduced-motion` support, loading skeletons on every data-heavy route, and code-split chart bundles.

## Screenshots

Not included — this sandbox has no browser to capture them from (see [Engineering Challenges](#engineering-challenges)). After running locally (`npm run dev`), the screens worth capturing for a portfolio/resume writeup are: the dashboard, the discovery feed with the featured-article hero, an article's reading page, the growth page's radar chart + heatmap, a goal card expanded with milestones, and the analytics page's three sections — in both light and dark mode.

## Architecture

```
Browser
  │
  ▼
Next.js 14 App Router
  ├── Server Components (pages) ──► service layer ──► Prisma ──► PostgreSQL
  │     requireUser() / getSessionUser() gate every protected route,
  │     memoized per-request via React's cache()
  │
  ├── Route Handlers (/api/**) ──► same service layer ──► Prisma ──► PostgreSQL
  │     zod-validated input, consistent { data } / { error } response shape
  │
  └── Client Components (interactive UI: filters, dialogs, charts)
        fetch the Route Handlers above for anything the initial
        server render didn't already have
```

The service layer (`src/server/services/`) is the single source of truth for each domain — both the page that server-renders a section and the API route a client component calls for a refetch go through the exact same function, so they can't drift out of sync with each other. This pattern is used consistently: `dashboard.ts`, `growth.ts`, `goals.ts`, `articles.ts`, `analytics.ts`, `library.ts`, `search.ts`.

## Tech stack

**Frontend:** Next.js 14 (App Router), React 18, TypeScript (strict mode), Tailwind CSS, Radix UI primitives, Framer-Motion-free deliberate restraint (see Engineering Challenges), Recharts, React Hook Form + Zod, Lucide icons.

**Backend:** Next.js Route Handlers, Prisma ORM, SQLite (zero-setup local dev; the schema was designed for and originally verified against PostgreSQL — see the note at the top of this README), Zod validation shared between client forms and server routes.

**Auth:** bcrypt password hashing, opaque server-side session tokens (SHA-256 hashed at rest), no third-party auth provider.

**Infra:** `.env`-based configuration, no Docker/database server/paid services required to run locally.

**Testing:** Vitest, 97 tests covering auth logic, validation schemas, and extracted pure business logic (streaks, date bucketing, goal-progress math).

## Database architecture

16 models in `prisma/schema.prisma`, currently running on SQLite for zero-setup local dev:

| Group | Models |
|---|---|
| Identity | `User`, `Session` (server-revocable), `PasswordResetToken`, `Profile`, `UserPreference` |
| Growth | `Skill`, `SkillProgress` (append-only history) |
| Goals | `Goal`, `GoalMilestone` |
| Learning | `LearningResource`, `LearningSession` |
| Discovery | `Article`, `Tag`, `SavedArticle` |
| Engagement | `Activity`, `Notification` |

Design choices worth calling out:
- Every user-owned table cascades on `User` delete; shared content (`Article`, `Tag`) does not — verified directly against a live database at every phase (originally Postgres, re-verified against SQLite after the conversion described in Engineering Challenges).
- `Skill` and `LearningResource` keep append-only history tables rather than overwriting a single "current value," so growth charts have real time-series data rather than one snapshot.
- Composite indexes (`goals(userId, status)`, `activities(userId, occurredAt)`) match the actual query patterns the dashboard and filtered list views use.
- **On this SQLite build specifically:** enum-like fields (`Goal.status`, `Article.category`, etc.) are plain `String` columns rather than database-level enums, since SQLite has no native enum type — validity is enforced by the same Zod schemas that were already the actual source of truth throughout this codebase. `UserPreference.interests` is a JSON-encoded string rather than a native array, for the same reason. Article search uses a simple case-insensitive `contains` rather than the generated, weighted `tsvector` + GIN index the Postgres version used. Every one of these is a deliberate, documented simplification — not a silent downgrade — detailed in Engineering Challenges.

## API documentation

All routes are under `/api`, return `{ data }` on success or `{ error: { message, fieldErrors? } }` on failure, and (except the five auth routes marked below) require a valid session.

| Method(s) | Route | Purpose |
|---|---|---|
| POST | `/api/auth/signup` | Create an account, start a session |
| POST | `/api/auth/login` | Authenticate, start a session |
| POST | `/api/auth/logout` | End the current session |
| GET | `/api/auth/me` | Current session's user, or `null` |
| POST | `/api/auth/forgot-password` | Issue a reset token (always returns the same message, regardless of whether the email exists) |
| POST | `/api/auth/reset-password` | Consume a reset token, invalidate all sessions |
| GET | `/api/dashboard` | Dashboard aggregate (Today's Pulse, growth, goals, skills, recommendations, activity) |
| GET | `/api/analytics` | Growth/Knowledge/Productivity analytics, date-range scoped |
| GET, POST | `/api/articles` | List (search/category/sort/paginate) or nothing — creation is seed-only |
| GET | `/api/articles/:id` | Detail + related articles (accepts id or slug) |
| POST, DELETE | `/api/articles/:id/save` | Save / unsave |
| POST | `/api/articles/:id/read` | Mark read |
| GET, POST | `/api/goals` | List (filter/sort) / create |
| PATCH, DELETE | `/api/goals/:id` | Edit, change status, archive, or delete |
| POST | `/api/goals/:id/milestones` | Add a milestone |
| PATCH, DELETE | `/api/goals/:id/milestones/:milestoneId` | Toggle/edit or remove a milestone |
| GET | `/api/growth` | Skills + learning resources + heatmap + monthly growth |
| GET, POST | `/api/skills` | List / create |
| PATCH, DELETE | `/api/skills/:id` | Update (appends history on level change) or delete |
| GET, POST | `/api/learning` | List (filter/sort) / add a resource |
| PATCH, DELETE | `/api/learning/:id` | Update or remove a resource |
| POST | `/api/learning-sessions` | Log a study session |
| GET | `/api/learning/analytics` | Completion rate, ratings, hours by category |
| GET | `/api/library` | Saved articles (folder/favorite/search filters) |
| PATCH | `/api/library/:articleId` | Update folder/notes/favorite |
| GET | `/api/library/folders` | Distinct folder names |
| GET | `/api/search` | Cross-entity search (articles, skills, resources, goals) |

## Authentication

Server-side, DB-backed, opaque tokens — not JWTs. A random 256-bit token goes in an `httpOnly`/`sameSite=lax` cookie; only its SHA-256 hash is ever stored. This means logout is instant (delete the row, the cookie stops working immediately) and a password reset can force-logout every device with one query — neither is true of a stateless JWT without bolting on a separate revocation list. Passwords are hashed with bcrypt at cost 12; session/reset tokens use SHA-256 instead, deliberately — they carry 256 bits of entropy and are never subject to offline dictionary attacks, so bcrypt's slowness buys nothing there.

Authorization is enforced in two layers: `src/middleware.ts` does a cheap cookie-presence redirect at the edge (can't hold a Postgres connection there), and `requireUser()` — called from the protected layout and re-checked in `getSessionUser()`, memoized per-request via React's `cache()` — is the authoritative, database-backed check. Every scoped mutation additionally verifies the record belongs to the requesting user, not just that someone is logged in.

Full detail, including the login/signup enumeration-resistance choices and the rate-limiter design: see [DEVELOPMENT_LOG.md § Authentication](./DEVELOPMENT_LOG.md#authentication-phase-2).

## Security

- Every mutating API route authenticates via `getSessionUser()` and every scoped mutation verifies actual row ownership (audited systematically in Phase 11 — see the log for the one gap that audit found and fixed).
- `next.config.js` sets `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and a restrictive `Permissions-Policy` on every route.
- All input validated with Zod at the API boundary, shared with the client forms so validation logic can't drift between frontend and backend.
- SQL injection is structurally prevented by Prisma's parameterized queries; the two places raw SQL is used (article full-text search, cross-entity search) use tagged-template `$queryRaw`, which parameterizes interpolated values automatically.
- No secrets in frontend code; `.env` is gitignored with `.env.example` as the template.
- Rate limiting on every auth endpoint (in-memory, single-process — see [Future Improvements](#future-improvements) for the Redis upgrade path this is documented as a placeholder for).

## Performance decisions

- **Server Components by default** — pages fetch data directly via the service layer with no client-side loading waterfall for the initial render.
- **Request-scoped session memoization** — `getSessionUser()` is wrapped in React's `cache()`, collapsing what was two Postgres round trips per page load (one in the layout, one in the page) into one.
- **Code-split chart bundles** — all six `recharts`-using components load via `next/dynamic`, so pages with no charts (`/goals`, `/library`) never pay that bundle cost.
- **`loading.tsx` on every data-heavy route**, giving instant navigation feedback via the App Router's automatic Suspense boundary.
- **Debounced client-side search** (300ms) on the discovery feed, saved-knowledge library, and global search, rather than firing a request per keystroke.
- **Real pagination** on the article list (not "load everything and paginate client-side").
- Deliberately **not** cached: dashboard, goals, and growth data — pages that need to reflect a mutation immediately. Caching those without careful invalidation would trade a query-cost win for showing stale data right after an edit.

## Testing

97 tests (Vitest), all pure logic with zero database dependency — password hashing behavior, opaque token entropy/uniqueness, and validation schemas for every feature (auth, goals, skills/learning, library, search, articles), plus three extracted pure-calculation modules (`date-buckets`, `streak`, `goal-progress`) that were previously duplicated inline across three separate services.

What this suite does *not* include: route-handler integration tests against a live database. That would need the generated Prisma client, which this development sandbox's network restrictions prevented (see Engineering Challenges). In its place, every phase's actual database behavior — cascades, unique constraints, aggregation correctness, ownership scoping — was verified with raw SQL directly against a live local Postgres instance; the full record of what was checked and what passed is in the Development Log, phase by phase. On a machine with normal network access, real `vitest` integration tests against a test database would be the natural next layer on top of what's here, not a replacement for it.

## Local setup

Requirements: Node 18+. Nothing else — no Docker, no database server, no OS-level setup.

**macOS / Linux:**
```bash
git clone <your-repo-url>
cd pulse
cp .env.example .env          # SQLite path, works as-is, no edits needed
npm install                   # also runs `prisma generate`
npm run db:migrate            # creates prisma/dev.db and applies the schema
npm run db:seed               # loads realistic demo data
npm run dev                   # http://localhost:3000
```

**Windows (cmd.exe):**
```cmd
git clone <your-repo-url>
cd pulse
copy .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

**Windows (PowerShell):**
```powershell
git clone <your-repo-url>
cd pulse
Copy-Item .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Then open http://localhost:3000 and log in with `demo@pulse.app` / `PulseDemo123!`, or sign up for a fresh account.

| Command | What it does |
|---|---|
| `npm run db:reset` | Delete `prisma/dev.db`, re-migrate, re-seed — the fastest way back to a clean state |
| `npm run db:studio` | Browse data visually via Prisma Studio |
| `npm run dev` | Start the dev server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test` | Run the vitest suite |

## Troubleshooting

**`npm install` fails on the `prisma generate` postinstall step.** This needs a normal internet connection the first time (it downloads a small query-engine binary matched to your OS). Retrying usually fixes a transient network blip. If it keeps failing behind a proxy/firewall, see Prisma's docs on `PRISMA_ENGINES_MIRROR`.

**Login/signup returns a generic "Something went wrong" error.** Every API route now catches unexpected errors and returns a safe generic message rather than leaking internals — check your terminal (where `npm run dev` is running) for the actual error, which is still logged there in full.

**"Table does not exist" or a stale-schema-feeling error after pulling new changes.** Run `npm run db:reset` — it deletes the local SQLite file and rebuilds it from the current schema and seed data. Safe to run anytime in development; it only affects your local `prisma/dev.db`, never anything shared.

**Port 3000 is already in use.** Either stop whatever else is using it, or run `npm run dev -- -p 3001` (or any free port) and open that instead.

**Changes to `prisma/schema.prisma` don't seem to take effect.** Run `npm run db:migrate` again to generate and apply a new migration, and make sure your editor/terminal picked up the regenerated Prisma Client (restarting `npm run dev` after a migration is usually enough).

**You still have a `.env` pointing at a Postgres URL from an earlier version of this project.** Delete it and re-copy `.env.example` — the SQLite `DATABASE_URL` format (`file:./dev.db`) is completely different from a Postgres connection string, and the two aren't interchangeable.

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | SQLite file path (resolves to `prisma/dev.db`) | `file:./dev.db` |
| `AUTH_SECRET` | Reserved for future signed-token use; generate with `openssl rand -base64 32` | placeholder — replace before any real deployment |
| `SESSION_COOKIE_NAME` | Name of the session cookie | `pulse_session` |
| `NODE_ENV` | Standard Node environment flag | `development` |

## Project structure

```
src/
├── app/
│   ├── (auth)/          # login, signup, forgot/reset password — public
│   ├── (app)/           # dashboard, news, growth, goals, learning,
│   │                    #   library, analytics — protected, shared layout
│   └── api/             # Route Handlers, one folder per resource
├── components/
│   ├── ui/              # shared primitives (Button, Card, Dialog, ...)
│   └── <feature>/       # feature-specific components (goals/, growth/, ...)
├── server/
│   ├── services/        # one file per domain — the single source of truth
│   └── validation/      # Zod schemas, shared between client forms and API routes
├── lib/                 # cross-cutting pure logic (auth, streaks, date buckets)
└── hooks/               # shared React hooks (debounce)
prisma/
├── schema.prisma
├── migrations/          # hand-verified against live Postgres each phase
└── seed.ts
```

## Engineering challenges

**This entire project was originally built and verified in a network-restricted sandbox that could never reach `binaries.prisma.sh`.** `prisma generate` never produced a working query engine there — confirmed via a direct request returning `403 host_not_allowed`. Every phase's database logic was instead verified by hand-authoring the SQL migration, applying it directly to a real local Postgres instance, and writing raw-SQL scripts that exercised the exact relational logic each service performs — cascades, unique constraints, aggregation math, ownership scoping — checked against live data rather than assumed correct. That verification record, phase by phase, is in the Development Log.

**The Postgres → SQLite conversion, and why it happened.** After the 14-phase build, real-world local setup on Windows hit a wall of environment issues stacked on top of each other: Docker Desktop's engine not starting, a port conflict with a pre-existing local Postgres service, then a WSL2 dependency that wasn't installed, then a `Catastrophic failure` from the automated WSL installer, then a stale Docker volume with mismatched credentials. Each was individually fixable (and was fixed, in sequence) — but the cumulative friction meant "clone and run" wasn't actually true for this environment, which defeats the point of a portfolio project someone else might want to try. The fix was to convert the local-dev database from Postgres to SQLite, removing every external dependency (Docker, WSL, a running database server) in favor of a single file. This is a real engineering tradeoff, made and documented the same way every other decision in this project was:

- **What changed:** the 8 Prisma enums became plain `String` columns (SQLite has no enum type — validity was already enforced by Zod at the application boundary in every service, so this is a schema-level change with zero application-logic impact, confirmed by grepping the entire codebase for any place that imported an enum *value* rather than just a TypeScript type — there were none, entirely because the sandbox's own Prisma-engine limitation had already forced every service to use string literals instead of generated enum imports throughout the original build). `UserPreference.interests` moved from a native array to a JSON-encoded string, parsed defensively at its one read site. The three raw-SQL Postgres queries (article full-text search, and two tag-lookup joins through the implicit `_ArticleToTag` table using `= ANY($1)`, a Postgres-only array operator) were replaced with plain Prisma relation queries and a simple `contains` filter — arguably better code, since it no longer depends on any database's specific SQL dialect at all.
- **What was verified, not assumed:** the full SQLite migration was applied to a real local SQLite database and checked for the same things verified throughout this project's history — cascade deletes, unique constraints, the tag-relation join, JSON round-tripping for interests, and a case-insensitive search match — all passing.
- **What was deliberately not attempted:** clawing back Postgres-only full-text search (weighted `tsvector` ranking) on top of SQLite. That's a real capability gap, not something papered over — stated here plainly rather than pretending `contains` is equivalent to ranked search.
- **The honest tradeoff:** less powerful search ranking and no database-level enum enforcement, in exchange for an app that runs on a fresh clone with just `npm install` and two Prisma commands, no matter what's already installed on the machine. For a portfolio project meant to be run by other people, that tradeoff is correct. For a real production deployment, pointing `DATABASE_URL` back at a real Postgres instance (Neon, Supabase, RDS) and reintroducing the enum types and a `tsvector` column would be the natural next step — the service layer's query patterns don't need to change to support that, only the schema and the three search-related query bodies.

**Two real, live bugs were found during the original 14-phase development, not hypothetically:**
- `z.coerce.boolean()` coerces via JavaScript's `Boolean()`, and `Boolean("false")` is `true`. This silently broke the Goals page's "Show archived" filter and the Library's "favorites only" filter from the phase each was built until a later testing pass caught it. Fixed with a proper string-literal parser and a regression test that pins the old broken behavior next to the fix.
- The protected layout and every page beneath it each independently called `requireUser()`, meaning two session-validation queries to the database on every single page load. Fixed with React's `cache()`.

**Scope decisions, made explicitly rather than silently:** "habits" and "achievements" from the original feature list aren't separate database models — they're represented through existing `Activity` entries and completed goals/resources, to avoid schema growth for concepts that don't yet have a genuinely different shape from what's already tracked. Saved-knowledge "notes" similarly live on the existing `SavedArticle.notes` field rather than a new standalone Note entity.

**What could not be done in this environment, stated directly rather than glossed over:** actual visual/pixel-level QA (no browser to screenshot), and full `next build` completion in the original development sandbox (Next's page-data-collection step constructs the Prisma client at import time, which requires the generated engine unavailable there). Both are one-time, environment-only limitations — the code itself is unaffected on a machine with normal setup, which is exactly what running this locally now confirms.

## Future improvements

- A real transactional email provider for password reset (currently logs the link server-side and echoes it in dev mode only)
- Redis-backed rate limiting to replace the current single-process in-memory limiter, needed the moment this runs on more than one server instance
- Integration tests against a real Postgres test database via the generated Prisma client, layered on top of the current pure-logic suite
- Image handling for article hero images (the schema has `imageUrl`; no UI renders it yet)
- A notifications UI (the `Notification` model exists and is seeded; nothing surfaces it yet)
- Habit tracking and achievement badges as first-class models, if the underlying behavior ever needs more structure than `Activity` entries provide
- Real-time updates (e.g. via websockets or polling) so a goal completed in one tab reflects immediately in another

