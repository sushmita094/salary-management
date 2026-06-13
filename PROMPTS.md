# Prompts Log

A running log of prompts used with AI tools during development, kept as a submission artifact.

---

## 2026-06-12

> update claude.md, link assessment.md and requirements.md inside it.
> always save prompts to prompts.md as you go

Created [CLAUDE.md](CLAUDE.md) describing the project and linking
[docs/requirements.md](docs/requirements.md) and [docs/assessment.md](docs/assessment.md).
Started this prompts log.

> Edits to the requirements.md:
> Add auth to the scope. However no need for roles and permissions.
> Add Bulk Excel import/export to the scope.

Moved Bulk Excel import/export and Authentication into the in-scope features of
[docs/requirements.md](docs/requirements.md) (auth as a sign-in gate only, no roles/permissions).
Removed the corresponding out-of-scope rows, reframed the remaining row as "Roles, permissions &
access tiers," and updated the Key Assumptions to match.

> Let's create a tech stack doc, inside docs
> Refer to assessment.md and the jd: https://cutshort.io/job/Software-Craftsperson-Node-Typescript-ReactJS-II-Incubyte-9YSG3tmF

Created [docs/tech-stack.md](docs/tech-stack.md) — TypeScript end to end (Node.js + Express
backend, React + Vite frontend), SQLite via Prisma with raw SQL for median/aggregates, Vitest /
Supertest / RTL / Playwright test pyramid, and Zod for shared validation. Choices aligned to the
JD's Node/TypeScript/React + TDD/XP emphasis and the brief's relational-DB / 10k-seed constraints,
with reasoning and rejected alternatives documented.

> Changes to tech-stack:
> For backend we will use express not fastify.
> Components will be made using tailwind css.

Locked Express as the backend framework (dropped the Fastify alternative) and switched the frontend
styling choice from a component library (Mantine/MUI) to **Tailwind CSS**, with data-dense
components built in-house on Tailwind (optional headless primitives for accessible interactions,
and a dedicated charting library for the analytics dashboard).

> add official documentation links to each of the tech stacks we are using.
> link tech-stack.md to claude.md, so that we don't deviate from our stack

Added an "Official Documentation" section to [docs/tech-stack.md](docs/tech-stack.md) linking every
tool's authoritative docs. Linked the tech-stack doc from [CLAUDE.md](CLAUDE.md) Key Documents and
added a "Stick to the stack" working agreement (no new libraries without updating the doc first;
follow the official docs over memory). Also corrected the stale scope note in CLAUDE.md — auth is
now in scope, so the exclusion list now reads payroll / FX / roles-permissions.

> Write a plan for project setup - inside docs/plans/ folder
> Everything exists in single monorepo
> All our apps will be in apps folder
> Let's use latest stable versions of all techs

Created [docs/plans/01-project-setup.md](docs/plans/01-project-setup.md) — a phased plan to scaffold
a single pnpm-workspaces monorepo: runnable apps under `apps/` (`api` = Express 5 + Prisma/SQLite,
`web` = React 19 + Vite + Tailwind v4) and shared libraries under `packages/` (`shared` Zod
schemas/types, plus shared tsconfig + ESLint config). Specifies latest-stable versions pinned via
lockfile, six ordered/committable setup phases (root skeleton → shared config → shared package → api
→ web → CI → DX/docs), root orchestration scripts, and risks (better-sqlite3 native build, Tailwind
v4 CSS-first, ESLint 9 flat config, Express 5). Honoured the "stick to the stack" agreement by noting
the monorepo tooling should be recorded in tech-stack.md.

> also add creation of sub folders in src.
> all routes, services, components, will reside in separate folders

Expanded [docs/plans/01-project-setup.md](docs/plans/01-project-setup.md) with per-app `src/`
sub-folder structure and a "Source-folder conventions" section: `apps/api/src` split into a layered
`routes → controllers → services → repositories → db` (+ middleware/config/utils) one-directional
dependency flow, `apps/web/src` split by UI concern (`components`, `features`, `pages`, `hooks`,
`api`, `lib`, `types`, `styles`), and `packages/shared/src` into `schemas`/`types`. Folded folder
creation (each with a placeholder so it commits) into the api and web scaffold phases.

> start implementing the plan phase wise, and commit each phase as you go.

Implemented the project-setup plan as six committed phases. **Phase 0:** root pnpm-workspaces
skeleton (orchestration scripts, `.nvmrc`, `.gitignore`, Prettier). **Phase 1:** shared
`@acme/tsconfig` (strict bases) and `@acme/eslint-config` (ESLint 10 flat config). **Phase 2:**
`@acme/shared` Zod Employee schema + inferred types, source-exported, with Vitest coverage.
**Phase 3:** `apps/api` — layered Express 5 app (`/health` + Supertest test) and Prisma 7 on SQLite
via the `@prisma/adapter-better-sqlite3` driver adapter + `prisma.config.ts`; initial migration
committed. **Phase 4:** `apps/web` — React 19 + Vite + Tailwind v4 + TanStack Query SPA proving the
api↔web path through the dev proxy and shared types, with RTL + Playwright tests. **Phase 5:**
GitHub Actions CI (lint/typecheck/test/build + Playwright). **Phase 6:** README and doc updates.

Decisions surfaced during the build: installed **pnpm** (corepack absent) and switched the runtime
to **Node 22 LTS** because the latest **Prisma 7** does not support the machine's Node 25; confirmed
Prisma 7's new driver-adapter architecture with the user (chose latest over pinning Prisma 6).
Verified each phase with typecheck/lint/test and an end-to-end `/api/health` proxy check.

> write a backend implementation plan in docs/plans folder, phase wise.
> it should be complete backend development. dont code yet. just plan.

Wrote [docs/plans/02-backend-implementation.md](docs/plans/02-backend-implementation.md) — a
phase-wise plan for the complete backend, building on the scaffold (layered Express 5 + Prisma 7 /
better-sqlite3, minimal Employee model, stub seed, shared Zod types). Cross-cutting decisions
(response/error envelope, boundary validation, the 10k "compute in SQL" rule, layering, per-layer
TDD) settled once up front, then eight independently committable phases: (1) domain model + shared
contracts, (2) idempotent 10k Faker seed, (3) directory list with paginate/search/filter/sort,
(4) detail + CRUD, (5) analytics incl. in-SQL median/distribution reported per-currency, (6) Excel/
CSV import (per-row validation, no silent corruption) + filter-round-tripping export, (7) single-
user auth gate (no roles), (8) hardening (helmet/CORS/rate-limit, env validation, API docs). Plus a
target endpoint surface, new-dependency note (update tech-stack first), risks, and a whole-plan
Definition of Done. No code written — planning only.

> in backend plan, add implementation of swagger/open api as well. it should be
> hosted on a link. i should be able to test every api through it.

Extended [docs/plans/02-backend-implementation.md](docs/plans/02-backend-implementation.md) with
interactive, hosted API docs. Added a cross-cutting practice (§2.6): the OpenAPI 3.1 spec is
**generated from the shared Zod schemas** (no drift from the request-validation contract) via
`@asteasolutions/zod-to-openapi`, with each phase registering its routes as it lands. Added a
dedicated **Phase 9** — serve `GET /openapi.json` (raw spec) and `GET /docs` (Swagger UI via
`swagger-ui-express`) from the Express app, so the docs live at `<deployed-origin>/docs`. Made
"Try it out" genuinely work for **every** endpoint: Phase 7 auth now also accepts a `Bearer` token
(alongside the httpOnly cookie) and the spec declares the scheme so Swagger's **Authorize** button
can exercise protected routes (incl. `POST /import` upload); CORS/credentials kept aligned. Added a
CI check that every registered route appears in the spec. Updated the endpoint table (`/docs`,
`/openapi.json`), new-deps note, risks (httpOnly-cookie vs Swagger, spec drift), and the DoD.

> here onwards dont commit anything, and keep updating prompts.md
> lets implement backend plan phase 2

Implemented **Phase 2 — the 10,000-employee seed** of
[docs/plans/02-backend-implementation.md](docs/plans/02-backend-implementation.md), test-first.
Installed `@faker-js/faker` (already recorded in tech-stack.md). Put the pure, deterministic
generation logic in [apps/api/src/utils/seed-data.ts](apps/api/src/utils/seed-data.ts) (so Vitest's
`src/**` glob picks up its unit tests) and kept the DB orchestration in
[apps/api/prisma/seed.ts](apps/api/prisma/seed.ts). The generator: a fixed Faker seed for
reproducibility; 12 countries each mapped to its ISO 4217 local currency and a mid-level salary
baseline (¥7M / ₹1.8M / $120k magnitudes on purpose, since FX is out of scope); 10 departments with
constrained job titles; 8 weighted seniority levels (pyramid-shaped headcount); and a **log-normal
salary per (country × level)** with a ~4% wider-spread tail for realistic outliers. Emails carry a
row-index suffix to guarantee uniqueness against the `email @unique` constraint. The seed is
**idempotent** (wipe-and-reseed) and batches `createMany` (1,000/batch) — it inserts 10,000 rows in
~2.5s. Wrote 8 unit tests (count, determinism, unique emails, positive/finite salary,
currency-matches-country, known enums, multi-country/level spread, senior>junior pay); re-ran the
seed to confirm it stays at exactly 10k, and spot-checked the DB (salary rises monotonically by
level, 10 departments / 37 titles, correct per-currency amounts). Added a seed note to the README.
`pnpm --filter api` typecheck / lint / test all green (9 tests). Not committed, per instruction.

> there are errors in seed-data.test.ts

Fixed three TypeScript errors in
[apps/api/src/utils/seed-data.test.ts](apps/api/src/utils/seed-data.test.ts) that only the IDE
surfaced. Root cause: `COUNTRIES`/`LEVELS` are declared `as const`, so the `Map`/`Set` built from
their fields had **literal-union** key/element types — calling `.get(e.country)` / `.has(e.level)`
with a plain `string` was a type error. Widened those lookups to `new Map<string, string>` /
`new Set<string>`. CI hadn't caught it because [apps/api/tsconfig.json](apps/api/tsconfig.json)
excludes `**/*.test.ts`, so `pnpm typecheck` never checks test files (flagged this gap to close in a
hardening pass). Verified with a temp tsconfig that includes the test (clean) and re-ran the 8 tests.

> dont forget to update prompts.md
> lets implement phase 3 backend plan

Implemented **Phase 3 — Employee directory (`GET /employees`: paginate / search / filter / sort)**
of [docs/plans/02-backend-implementation.md](docs/plans/02-backend-implementation.md), test-first.
Because this is the first feature endpoint, it also lands the cross-cutting foundations the plan
settles once (§2.1/§2.2/§2.5): typed **domain errors**
([apps/api/src/utils/errors.ts](apps/api/src/utils/errors.ts) — `AppError` base + `ValidationError`,
`NotFoundError`, `ConflictError`, `UnauthorizedError`), a real **central error handler** mapping
them to the `{ error: { code, message, details? } }` envelope, a reusable Zod **`validate`
middleware** (params/query/body → parsed values on `res.locals`, throwing `ValidationError` on bad
input), and an integration **test harness** (a per-file temp SQLite DB via `setupFiles`, migrated by
replaying the committed migration SQL). The feature itself follows the layered stack: pure
`buildWhere`/`buildOrderBy` helpers + `findEmployees`/`countEmployees` in the repository (single
parametrised Prisma query; offset pagination; stable `id` sort tiebreak), a `listEmployees` service
that computes `totalPages` and clamps the page, and a thin controller/route wired at
`/employees`. Tests: unit for the query→args builders and the service's pagination math/clamp
(mocked repo), integration for default page / search hit+miss / each filter / sort asc+desc / page
bounds / empty result / validation 400s, plus a ~3k-row fixture asserting correct slicing across
deep pages. Not committed, per instruction.

> errors in setup-env.ts

Fixed the IDE errors (`process` / `node:*` unresolved) in
[apps/api/tests/setup-env.ts](apps/api/tests/setup-env.ts) — and every other test file — by closing
the gap flagged earlier: [apps/api/tsconfig.json](apps/api/tsconfig.json) excluded `tests` and
`**/*.test.ts`, so test files fell into an inferred project with no `@types/node`. Mirrored the web
app's convention: `tsconfig.json` is now the editor/typecheck config (`noEmit: true`, `include:
["src", "tests"]`), and a new [apps/api/tsconfig.build.json](apps/api/tsconfig.build.json) is the
emit config (`src` only, `rootDir`/`outDir`, excludes tests) wired to the `build` script. `pnpm
typecheck` now also type-checks the tests; `build` still emits only `src` to `dist` (no `*.test.js`
leaks). typecheck / build / lint / test (30) all green. Not committed, per instruction.

> lets implement phase 4 backend plan

Implemented **Phase 4 — Employee detail & CRUD** of
[docs/plans/02-backend-implementation.md](docs/plans/02-backend-implementation.md), test-first,
through the layered stack. Added an `id`-param schema to `@acme/shared`
([packages/shared/src/schemas/params.ts](packages/shared/src/schemas/params.ts) — uuid, so a
malformed id is a 400 before it hits the DB) plus its `EmployeeParams` type, and rebuilt the shared
dist the api imports at runtime. Repository gained `findEmployeeById` / `createEmployee` /
`updateEmployee` / `deleteEmployee`. A small **Prisma→domain error mapper**
([apps/api/src/utils/prisma-errors.ts](apps/api/src/utils/prisma-errors.ts)) translates known write
failures at the service boundary so raw Prisma errors never leak — `P2002` (unique) → 409
`ConflictError`, `P2025` (missing) → 404 `NotFoundError` — via `instanceof
Prisma.PrismaClientKnownRequestError`. The service exposes `getEmployee` (404 if absent),
`createEmployee`, `updateEmployee` (partial), `deleteEmployee`; thin controllers + routes wire
`GET /employees/:id`, `POST /employees` (201), `PUT /employees/:id` (partial), `DELETE
/employees/:id` (204), each behind the `validate` middleware. Tests: unit for the error mapper
(P2002 / P2025 / passthrough × 2), integration for every verb incl. 404 (unknown id) / 400
(malformed id + invalid body with field details) / 409 (duplicate email on create *and*
email-collision on update) / 204 + DB-gone assertion. Verified the full lifecycle over real HTTP
against a throwaway DB (201 → 409 → 200 → 200 → 204 → 404). `pnpm --filter api` typecheck / lint /
test (now **46**) and shared tests (20) all green. Not committed, per instruction.

> lets implement phase 5 backend plan

Implemented **Phase 5 — Compensation analytics** of
[docs/plans/02-backend-implementation.md](docs/plans/02-backend-implementation.md), test-first.
Three read-only endpoints, all computed **in SQL** (never loading rows into Node) and reported
**per currency** (FX is out of scope, so figures are never summed across currencies):
`GET /analytics/summary` (headcount overall + total/avg/median per currency),
`GET /analytics/by/:dimension` (`department|country|jobTitle|level` → per-segment headcount/avg/
median/min/max), and `GET /analytics/distribution` (equal-width pay-band histogram per currency,
optional currency/segment scoping + `bucketCount`). The hard part — **median in SQLite**, which has
no `PERCENTILE` — is done with window functions in
[apps/api/src/repositories/analytics.repository.ts](apps/api/src/repositories/analytics.repository.ts):
rank rows within each partition (`ROW_NUMBER`/`COUNT(*) OVER`) and average the value(s) at position
`(cnt+1)/2`,`(cnt+2)/2` (integer division), which collapses to the middle row(s) for odd/even
counts; aggregates and bucketing use `GROUP BY` + a `CASE`/`width_bucket`-style bucket with the top
value clamped into the final band. Shared Zod request + response schemas live in
[packages/shared/src/schemas/analytics.ts](packages/shared/src/schemas/analytics.ts) (rebuilt into
dist); the dynamic `:dimension` column is whitelisted before interpolation, and the band-boundary
reconstruction is a pure, unit-tested helper
([apps/api/src/utils/distribution.ts](apps/api/src/utils/distribution.ts)). Tests: unit for the
band math (equal-width, empty-bucket fill, float-pinned max, min==max collapse); integration against
a **hand-computed two-currency fixture** asserting exact avg/median/totals/bands and per-currency
separation, plus a 3k-row scale suite of fixture-independent invariants (headcounts reconcile,
median∈[min,max], band counts account for everyone). Smoke-tested on the real 10k seed: summary in
~14ms, realistic right-skewed medians and histograms. `pnpm --filter api` typecheck / lint / test
(now **59**) and shared tests all green. Not committed, per instruction.

> lets implement phase 6 backend plan

Implemented **Phase 6 — Bulk Excel/CSV import & export** of
[docs/plans/02-backend-implementation.md](docs/plans/02-backend-implementation.md), test-first.
Per the working agreement, updated [docs/tech-stack.md](docs/tech-stack.md) first: **SheetJS
(`xlsx`)** parses *and* writes both Excel and CSV (one library for the round-trip) and **`multer`**
(memory storage) handles the multipart upload — with a documented trade-off that SheetJS buffers
rather than truly streams (fine at ~10k rows; `csv-parse` noted as the streaming fast-follow). Added
shared contracts in [packages/shared/src/schemas/import.ts](packages/shared/src/schemas/import.ts):
the canonical column list, an `importRowSchema` (coerces CSV strings, trims, validates email/
currency), an `importResultSchema`, and an `exportQuerySchema` (the directory's filters/sort minus
pagination, plus `format`). A thin SheetJS util
([apps/api/src/utils/spreadsheet.ts](apps/api/src/utils/spreadsheet.ts)) exposes pure
`parseRows`/`missingColumns`/`toCsv`/`toXlsx`. **Import** ([import.service.ts]) treats a header
mismatch as a whole-file 400, validates each row independently (bad rows reported via
`rowErrors[{ row, errors }]`, never fatal), dedupes valid rows by email (last wins), and upserts them
in **one transaction** ([upsertEmployeesByEmail] — existing emails updated, the rest one
`createMany`, atomic so a bad file can't half-apply). **Export** reuses the directory query layer
(unpaginated) and streams CSV/XLSX with a download filename, columns matching the import format.
Wired `POST /import` (multer `upload.single("file")`) and `GET /export`. Tests: unit for the
spreadsheet helpers + `importRowSchema` (good/bad/coercion); integration for valid import, mixed
valid/invalid (partial success + no corruption), email upsert, header mismatch (400), missing file
(400), a 1,000-row file, filtered CSV export, an export→re-import **round-trip**, and xlsx output.
Smoke-tested over real HTTP (1 inserted / 1 failed with per-row messages; CSV + 16KB xlsx with
correct headers). Documented the format in the README. `pnpm --filter api` typecheck / lint / test
(now **73**) and shared tests (**26**) all green. Not committed, per instruction.

> lets implement phase 7 of backend plan

Implemented **Phase 7 — Authentication gate** of
[docs/plans/02-backend-implementation.md](docs/plans/02-backend-implementation.md), test-first.
Updated [docs/tech-stack.md](docs/tech-stack.md) first with the chosen libs and reasoning:
**bcryptjs** (pure-JS hashing, no extra native build), **jsonwebtoken** (stateless signed JWT), and
**cookie-parser**. Added a single `User` model (email + `passwordHash`) and a migration; the seed now
upserts one HR-Manager account from env (`AUTH_EMAIL`/`AUTH_PASSWORD`), password only ever stored
hashed. Shared auth contracts in
[packages/shared/src/schemas/auth.ts](packages/shared/src/schemas/auth.ts) (`loginSchema`,
`authUserSchema`, `loginResponseSchema`). The auth service
([apps/api/src/services/auth.service.ts](apps/api/src/services/auth.service.ts)) exposes testable
`hashPassword`/`verifyPassword`/`issueToken`/`verifyToken` plus `login` (same 401 for bad email *or*
password — no user enumeration). `POST /auth/login` sets the JWT in an **httpOnly, sameSite cookie**
*and* echoes it; `POST /auth/logout` clears it; `GET /auth/me` rehydrates. A `requireAuth` middleware
([middleware/require-auth.ts]) verifies the token **statelessly** from the cookie *or* a `Bearer`
header (so Swagger's Authorize works against the httpOnly cookie) and gates `/employees`,
`/analytics`, `/import`, `/export`; `/health` and `/auth/login` stay public. Config gained
`jwtSecret`/`jwtTtlSeconds`/admin creds (dev defaults; Phase 8 will fail-fast in prod). Tests: unit
for hashing + token round-trip/tamper; integration for login happy/sad/validation, the gate
returning 401 without/with a bad token and 200 via **both** cookie and Bearer, plus `/me` and
`/logout`. All prior protected-route suites were updated to authenticate via a new `authedRequest`
test helper. Verified over real HTTP (401 unauthenticated, 401 wrong password, login → 223-char JWT +
cookie, 200 via Bearer and cookie). Documented env vars + login in `.env.example` and the README.
`pnpm --filter api` typecheck / lint / test (now **87**) and shared tests (**26**) all green. Not
committed, per instruction.
