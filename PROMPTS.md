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

> lets implement phase 8 of backend plan

Implemented **Phase 8 — Hardening & API polish** of
[docs/plans/02-backend-implementation.md](docs/plans/02-backend-implementation.md), test-first.
Updated [docs/tech-stack.md](docs/tech-stack.md) first with a "Security & hardening" section and the
new deps + reasoning: **helmet** (security headers), **cors** (scoped to the web origin, credentials
on for the auth cookie), **express-rate-limit** (brute-force guard on `POST /auth/login`); request
logging is a small in-house JSON middleware (no extra dep). Rewrote
[apps/api/src/config/env.ts](apps/api/src/config/env.ts) to parse `process.env` through a **Zod
schema** via a pure, testable `loadConfig(env)` that **fails fast** in production when `JWT_SECRET`
is missing/left at the dev default or `DATABASE_URL` is missing (dev/test keep working defaults).
Added a `TooManyRequestsError` (429) and a `loginRateLimiter` whose handler routes through the
central error envelope; a `requestLogger` middleware (method/path/status/duration, no bodies/cookies/
PII, skipped under test); wired `helmet`, `cors`, and a JSON body-size limit into
[app.ts](apps/api/src/app.ts); and added **graceful shutdown** (close HTTP server + `prisma.$disconnect`
on SIGTERM/SIGINT) in [index.ts](apps/api/src/index.ts). Tests: unit for `loadConfig` (defaults,
PORT coercion, prod fail-fast on missing secret/db, valid prod env); integration asserting helmet
headers + `x-powered-by` removed, CORS allow-origin/credentials, and the login limiter returning a
429 envelope after the threshold. Smoke-tested over real HTTP (hardened headers, CORS, 10×400→429,
JSON request log line, "shutting down gracefully" on SIGTERM, and a production boot aborting with
"JWT_SECRET must be set…"). `pnpm --filter api` typecheck / lint / test (now **95**) and shared
tests (**26**) all green. Not committed, per instruction.

> lets implement phase 9 of backend plan

Implemented **Phase 9 — OpenAPI spec & hosted interactive Swagger UI** of
[docs/plans/02-backend-implementation.md](docs/plans/02-backend-implementation.md), test-first — the
final backend phase. Updated [docs/tech-stack.md](docs/tech-stack.md) first: chose **Zod 4's native
`z.toJSONSchema`** (`target: "openapi-3.0"`) over `@asteasolutions/zod-to-openapi` (which predates
Zod 4) for the schema half, keeping the single source of truth with no extra dep, plus
**swagger-ui-express** for the hosted UI. Built an OpenAPI 3.0.3 document
([apps/api/src/openapi/document.ts](apps/api/src/openapi/document.ts)) from the shared schemas via
small helpers ([openapi/helpers.ts](apps/api/src/openapi/helpers.ts)) that convert request/response
bodies and expand object schemas into query/path parameters (defaulted params correctly marked
optional); declared `bearerAuth` + `cookieAuth` security schemes, tags, and servers. Served
`GET /openapi.json` (raw spec) and `GET /docs` (Swagger UI) publicly
([routes/docs.ts](apps/api/src/routes/docs.ts)), relaxing the strict global helmet CSP **only** for
the docs pages so the UI's inline assets load, and enabling `withCredentials`/`persistAuthorization`
so Authorize works. Tests: the spec is a valid 3.0 doc with both security schemes/tags; a
**coverage check walks every feature router and asserts each route is documented** (a new
undocumented route fails CI); protected routes carry the security requirement while `/auth/login`
is public; and `/docs` serves the Swagger HTML. Also resolved a pnpm `allowBuilds` prompt for the
transitive `@scarf/scarf` (telemetry → `false`). Smoke-tested over real HTTP: 11 documented paths,
both security schemes, `/import` as `multipart/form-data`, `/employees` query params auto-derived,
and the Swagger UI page + assets loading. Updated the README (docs link + Authorize flow) and marked
[CLAUDE.md](CLAUDE.md) **backend feature-complete**. `pnpm --filter api` typecheck / lint / test (now
**99**) and shared tests (**26**) all green. Not committed, per instruction.

> lets implement frontend plan phase 1

Implemented **Phase 1 — Foundation: app shell, routing & the data layer** of
[docs/plans/03-frontend-implementation.md](docs/plans/03-frontend-implementation.md), test-first.
Updated [docs/tech-stack.md](docs/tech-stack.md) first with the new frontend deps + reasoning
(**react-router-dom** for SPA routing; **clsx** + **tailwind-merge** for a `cn()` class helper) —
`react-hook-form`/`msw` deferred to the phases that first need them. Built the pieces every feature
reuses: a hardened, envelope-aware **API client**
([apps/web/src/api/client.ts](apps/web/src/api/client.ts)) with GET/POST/PUT/DELETE + multipart
upload + blob download, `credentials: "include"` (httpOnly-cookie session), parsing of the shared
`{ error }` envelope into a typed `ApiRequestError`, and a registerable **401 handler** (auth probes
opt out); a configured **QueryClient** + **query-key factory**
([lib/queryClient.ts](apps/web/src/lib/queryClient.ts),
[lib/queryKeys.ts](apps/web/src/lib/queryKeys.ts)); a **React Router** tree with a persistent **app
shell** (brand + primary nav + `<Outlet/>`), `/login` outside the shell, index→`/employees` redirect,
and a 404 page ([app/router.tsx](apps/web/src/app/router.tsx),
[components/layout/AppShell.tsx](apps/web/src/components/layout/AppShell.tsx)); and the **design-system
primitives** on a small Tailwind v4 `@theme` token set — `Button`, `Input`, `Select`, `Card`,
`Spinner`, `Skeleton`, `EmptyState`, and a `Toast` provider/region (hook split into its own module for
fast-refresh hygiene). Placeholder pages stand in for Directory/Analytics/Import-Export/Login until
their feature phases. Replaced the scaffold's health-badge `App.tsx` and removed the obsolete
`api/health`, `useHealth`, and `StatusBadge` files. Tests (Vitest + RTL): the client unwraps
success/error envelopes, throws typed errors, fires (and skips) the 401 handler, and handles 204; the
router renders the shell + nav + routed page, redirects the index, shows the 404 inside the shell, and
keeps `/login` outside it; primitives (Button/EmptyState/Toast) render and behave. Wired RTL
`cleanup()` into the test setup (Vitest globals are off) and updated the Playwright smoke to the new
shell. **Deviations (noted):** the `Dialog` primitive is deferred to Phase 4 (its first real use —
delete confirm) to avoid pulling a headless lib early. `pnpm --filter web` typecheck / lint / test
(**14**) and `build` all green, plus repo-wide typecheck/lint. Not committed, per instruction.

> phase 2 next

Implemented **Phase 2 — Authentication UI & route protection** of
[docs/plans/03-frontend-implementation.md](docs/plans/03-frontend-implementation.md), test-first.
Updated [docs/tech-stack.md](docs/tech-stack.md) first with the new deps + reasoning
(**react-hook-form** + **@hookform/resolvers** bound to the shared Zod schemas; **msw** for
realistic test mocking). Built the **auth API module** ([api/auth.ts](apps/web/src/api/auth.ts) —
`me`/`login`/`logout`, with the cookie-probe and login opting out of the global 401 redirect), an
**AuthProvider** ([features/auth/AuthProvider.tsx](apps/web/src/features/auth/AuthProvider.tsx)) that
bootstraps the session from `GET /auth/me` via TanStack Query (cookie is the source of truth — no
token in JS), exposes `user`/`isResolving`/`login`/`logout`, and registers the central
`setUnauthorizedHandler` so a mid-session 401 clears auth and routes to /login; a **RequireAuth**
guard (spinner while resolving → `/login` with the intended destination preserved → `<Outlet/>`); a
**LoginPage** (RHF + `zodResolver(loginSchema)`, inline 401 "invalid email or password" / 429
friendly message, submit spinner) that redirects to the originally requested route; and **sign-out**
in the app shell (email + button → `POST /auth/logout` → /login). Wired `AuthProvider` into `App`
and wrapped the shell routes in `RequireAuth`. Test infra: an **MSW** server + handlers
([tests/msw/](apps/web/tests/msw/)) and a `renderApp` provider harness
([tests/utils.tsx](apps/web/tests/utils.tsx)); set an explicit jsdom origin so relative `/api`
fetches resolve. Tests (RTL+MSW): guard redirects an unauthenticated deep link to login; valid
credentials sign in and land on the Directory (shell + email shown); invalid credentials show the
inline error; the form validates before calling the API; sign-out returns to login; and the routing
suite now asserts the shell through the guard. `pnpm --filter web` typecheck / lint / test (now
**18**) and `build` green, plus repo-wide typecheck/lint. Also set `msw` to `false` in the pnpm
`allowBuilds` (node tests don't need its browser worker). Not committed, per instruction.

> lets implement frontend plan phase 3

Implemented **Phase 3 — Employee directory (list, search, filter, sort, paginate)** of
[docs/plans/03-frontend-implementation.md](docs/plans/03-frontend-implementation.md), test-first (no
new deps). The directory's query state lives in the **URL**: a `useEmployeeQuery` hook
([features/employees/useEmployeeQuery.ts](apps/web/src/features/employees/useEmployeeQuery.ts))
parses the search params into a typed `EmployeeQuery` via the shared `employeeQuerySchema`
(defaults + coercion) and writes changes back, resetting to page 1 on any filter/sort change. The
list query ([useEmployees.ts](apps/web/src/features/employees/useEmployees.ts)) uses
`keepPreviousData` so paging/filtering doesn't flash, and `fetchEmployees`
([api/employees.ts](apps/web/src/api/employees.ts)) always sends `page`/`pageSize` — the client never
asks for the whole table. Built reusable **Table** and **Pagination** primitives plus a **FilterBar**
(debounced search synced via the render-phase pattern, not an effect; `country`/`department`/`level`
selects) and an **EmployeeTable** with sortable headers (`aria-sort`), skeleton-row loading,
local-currency salaries (`formatSalary`), and rows linking to the (Phase 4) detail route. The
[DirectoryPage](apps/web/src/pages/DirectoryPage.tsx) wires first-class **loading / empty (with Clear
filters) / error (retryable)** states. Filter options come from a documented **stopgap constants
file** ([filterOptions.ts](apps/web/src/features/employees/filterOptions.ts)) mirroring the seed —
with a noted **backend follow-up**: a `GET /employees/filters` distinct-values endpoint (also needed
to filter `jobTitle` well). Tests (RTL+MSW): renders a page with local-currency salaries; asserts the
request is **always bounded** (page+pageSize); debounced search, a filter select, a sort header, and
paging each update the query and refetch with the right params; empty + retryable-error states; and
rows link to `/employees/:id`. Added a default `/employees` MSW handler so auth/routing suites that
land on the Directory still resolve. `pnpm --filter web` typecheck / lint / test (now **26**) and
`build` green, plus repo-wide typecheck/lint. Not committed, per instruction.

> lets implement frontend plan phase 4

Implemented **Phase 4 — Employee detail & CRUD** of
[docs/plans/03-frontend-implementation.md](docs/plans/03-frontend-implementation.md), test-first.
Added the **Dialog primitive deferred from Phase 1** — `@radix-ui/react-dialog` (the headless lib
already named in tech-stack) wrapped as an accessible `ConfirmDialog`
([components/ui/Dialog.tsx](apps/web/src/components/ui/Dialog.tsx), focus-trap/Escape/labelling).
Extended the API module with `fetchEmployee`/`create`/`update`/`delete`
([api/employees.ts](apps/web/src/api/employees.ts)); a detail query
([useEmployee.ts](apps/web/src/features/employees/useEmployee.ts), `retry: false` so a 404 surfaces
at once); and **mutation hooks** ([employeeMutations.ts](apps/web/src/features/employees/employeeMutations.ts))
that invalidate the directory list + analytics keys (and the detail key on edit) on success. Built a
shared **EmployeeForm** ([features/employees/EmployeeForm.tsx](apps/web/src/features/employees/EmployeeForm.tsx))
bound to the **shared `createEmployeeSchema`** with **server-error mapping** — 409 → the email field,
400 `details` → the offending fields, else a form-level error. Three pages: **detail** (local-currency
fields, 404 not-found state, Edit link + Delete-with-confirm), **create**, and **edit** (pre-filled,
PUT); each does toast + navigate on success. Wired the `/employees/new`, `/employees/:id`,
`/employees/:id/edit` routes and a "New employee" button on the Directory. Tests (RTL+MSW): detail
renders + 404; create posts the right body and navigates (with success toast); client validation
blocks submit without calling the API; a 409 maps onto the email field; edit loads → PUTs the change →
navigates; delete confirms in the dialog, calls DELETE, and returns to the directory. **Decision
(noted):** both create *and* edit validate with `createEmployeeSchema` (the form always collects the
full record; the backend's PUT accepts it since its `updateEmployeeSchema` is partial). `pnpm --filter
web` typecheck / lint / test (now **33**) and `build` green, plus repo-wide typecheck/lint. Not
committed, per instruction.

> lets implement frontend plan phase 5

Implemented **Phase 5 — Compensation analytics dashboard** of
[docs/plans/03-frontend-implementation.md](docs/plans/03-frontend-implementation.md), test-first.
Added **Recharts** (already named in tech-stack). Built the analytics data layer
([api/analytics.ts](apps/web/src/api/analytics.ts) + [useAnalytics.ts](apps/web/src/features/analytics/useAnalytics.ts):
`useSummary`/`useByDimension`/`useDistribution`) and three feature views consuming the shared wire
types: **SummaryCards** (per-currency total/average/**median**, headcount; money always in its own
currency — there is deliberately **no cross-currency total**), **SegmentComparison** (a Recharts
bar chart of **average vs median** per segment for the chosen dimension+currency, backed by an exact
figures table incl. min/max for accessibility), and **DistributionChart** (a salary-band histogram
with a band-count control, backed by a range/count table). The [AnalyticsPage](apps/web/src/pages/AnalyticsPage.tsx)
composes them with a dimension toggle + currency selector (options derived from the summary's
currencies) and first-class **loading skeletons / empty / retryable-error** states. Added a `formatMoney`
helper. To keep the chart library out of the initial/login bundle (plan §2.1/§7), **code-split the
AnalyticsPage** via `React.lazy` behind a `Suspense` boundary in the app shell — Recharts now ships
as a separate ~104 kB-gzip chunk and the build size warning is gone. Tests (RTL+MSW): per-currency
cards render incl. median **and a guard that the combined cross-currency total never appears**;
switching the dimension refetches `by/:dimension`; switching currency re-renders the comparison for
that currency; distribution bands map to the backing table and a band-count change refetches; plus
empty and error states. Added a `ResizeObserver` polyfill to the test setup (jsdom lacks it; charts
render empty and we assert on the backing tables). `pnpm --filter web` typecheck / lint / test (now
**39**) and `build` (code-split) green, plus repo-wide typecheck/lint. Not committed, per instruction.

> implement frontend plan phase 6

Implemented **Phase 6 — Bulk import & export UI** of
[docs/plans/03-frontend-implementation.md](docs/plans/03-frontend-implementation.md), test-first (no
new deps). **Import** lives on the `/import-export` page
([pages/ImportExportPage.tsx](apps/web/src/pages/ImportExportPage.tsx)): a file picker (`.csv`/`.xlsx`)
+ Upload that POSTs multipart via a `useImport` mutation
([features/importExport/useImport.ts](apps/web/src/features/importExport/useImport.ts)) which on
success **invalidates the directory + analytics** so imported changes show immediately. The response
renders an [ImportResultView](apps/web/src/features/importExport/ImportResultView.tsx) — inserted /
updated / **failed** counts plus a **per-row error table** (row number + messages), so bad rows are
visible and never silently applied — and a 400 **header mismatch** surfaces a clear message listing
the missing columns. Expected columns are documented inline from the shared `EMPLOYEE_IMPORT_COLUMNS`
(no drift). **Export** is an [ExportButton](apps/web/src/features/importExport/ExportButton.tsx) on the
**Directory** header (where the filters live): it builds the `/export` request from the active
filters/sort (pagination dropped) + a CSV/Excel format select and triggers a browser download via a
small blob [download helper](apps/web/src/lib/download.ts); the import-export page links here for
export. Tests (RTL+MSW): upload shows the report (counts + skipped rows with messages); a header
mismatch shows a clear error; export issues the request with the **active filter + chosen format and
no pagination params**, and switching to Excel sends `format=xlsx`. Added a `URL.createObjectURL`
stub to the test setup (jsdom lacks it). **Design note:** export sits on the Directory (so it
reflects exactly the filtered view) rather than duplicating filter inputs on the import-export page.
`pnpm --filter web` typecheck / lint / test (now **43**) and `build` green, plus repo-wide
typecheck/lint. Not committed, per instruction.

> okay lets implement frontend plan phase 7

Implemented **Phase 7 — UX polish, accessibility & responsiveness** of
[docs/plans/03-frontend-implementation.md](docs/plans/03-frontend-implementation.md), test-first (no
new deps) — a focused pass, since earlier phases already folded in labelled controls, `aria-sort`,
the Radix dialog, `role=alert`, `aria-live` toasts, and lazy-loading. **Responsiveness:** the app
shell header ([components/layout/AppShell.tsx](apps/web/src/components/layout/AppShell.tsx)) now
reflows — on narrow screens the primary nav drops to its own full-width, horizontally-scrollable row
(flex-wrap + `order`) and the user email hides; the directory table already scrolls horizontally and
the dashboard/cards already reflow. **Accessibility:** added a **skip-to-content** link + a focusable
`<main id="main-content">` landmark, and **visible focus rings** on the brand, nav links, row links,
and sort buttons (buttons/inputs already had them); the active nav item carries `aria-current` (via
`NavLink`), and the directory marks `aria-busy` during background refetches. **Consistency:**
introduced shared [ErrorState](apps/web/src/components/ui/ErrorState.tsx) and
[PageSpinner](apps/web/src/components/ui/PageSpinner.tsx) components and refactored the directory,
analytics, detail, and edit pages to use them — unifying loading/error treatments (titles kept, so
behaviour is unchanged). Tests: a new a11y suite ([tests/a11y.test.tsx](apps/web/tests/a11y.test.tsx))
asserts the skip link, `aria-current` on the active nav, `aria-sort` reflecting the sort state, and
that the delete dialog has an accessible name, **traps focus**, and closes on **Escape**. Updated the
Playwright **smoke** to the auth-gated reality (unauthenticated → sign-in) and added a
**narrow-viewport** spec checking there's no horizontal overflow at 375px — these need a browser/stack
so they weren't run here (authenticated responsive E2E journeys are **Phase 8**). `pnpm --filter web`
typecheck / lint / test (now **46**) and `build` green, plus repo-wide typecheck/lint. Not committed,
per instruction.

> implement frontend plan phase 8

Implemented **Phase 8 — Test coverage & end-to-end journeys** of
[docs/plans/03-frontend-implementation.md](docs/plans/03-frontend-implementation.md), the final
frontend phase. First fixed a latent HTML/a11y issue: several `<Link><Button>` spots nested a button
inside an anchor — extracted [button-styles.ts](apps/web/src/components/ui/button-styles.ts)
(`buttonClasses`) and switched those to styled `<Link>`s (valid anchors, and clean `role=link`
locators for E2E). Stood up **Playwright E2E against the real stack**: a new api `e2e:serve` script
(`prisma migrate deploy && seed && start`) and a [playwright.config.ts](apps/web/playwright.config.ts)
that boots **two** web servers — the seeded Express API on :3000 (fresh `e2e.db`, full 10k seed + the
HR-Manager login via env) and the Vite dev server on :5173 (proxying `/api`) — running serially on
one worker for deterministic state. Wrote journey specs covering §2.9 end to end:
[auth](apps/web/e2e/auth.spec.ts) (deep-link guard → sign in → land on target; sign-out),
[directory](apps/web/e2e/directory.spec.ts) (paginate/sort/filter/search → URL + results),
[crud](apps/web/e2e/crud.spec.ts) (create → detail → edit → delete via the confirm dialog),
[analytics](apps/web/e2e/analytics.spec.ts) (per-currency summary + dimension/currency switch),
[import-export](apps/web/e2e/import-export.spec.ts) (upload → per-row report; export → download), plus
the smoke + responsive specs. **Ran the suite for real** — installed Chromium and executed
`playwright test`: **9/9 E2E passed** against the seeded stack (~12s). Updated the CI e2e step name;
the existing CI job already installs Chromium and runs `test:e2e` (config now starts both servers, so
no further CI change needed). Marked [CLAUDE.md](CLAUDE.md) **frontend feature-complete /
end-to-end**. Full local verification: repo `typecheck` / `lint` green; unit/integration **api +
web (46) + shared** green; **Playwright E2E 9/9** green; `build` green. Not committed, per instruction.
