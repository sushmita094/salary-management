# Backend Implementation Plan — API, Data, Analytics, Import/Export, Auth

**Status:** Draft v1
**Last updated:** 2026-06-12
**Owner of this plan:** all backend feature work, after the scaffold ([01-project-setup.md](01-project-setup.md)) and before/alongside the frontend feature plan.

This plan describes how we build the **complete backend** for the ACME Salary Management System on
top of the existing scaffold. It implements the scope in [../requirements.md](../requirements.md)
(§5) and the architecture in [../tech-stack.md](../tech-stack.md) (§3, §5, §6). It covers the data
model and 10k seed, the employee directory, CRUD, analytics, bulk Excel/CSV import/export, and the
authentication gate — every server-side concern end to end.

It does **not** design the React UI; that is a separate frontend plan. Where this plan adds shared
contracts (Zod schemas in `packages/shared`), those are explicitly the wire types the frontend will
later consume.

---

## 1. Where we start (the scaffold we build on)

Already in place from [01-project-setup.md](01-project-setup.md):

- **Layered `apps/api/src`**: `routes → controllers → services → repositories → db`, plus
  `middleware/`, `config/`, `utils/`. A `/health` route is wired through this stack and tested with
  Supertest against an in-memory DB.
- **Prisma 7 + better-sqlite3** via a driver adapter ([apps/api/src/db/client.ts](../../apps/api/src/db/client.ts)),
  client generated to `src/generated/prisma` (gitignored, regenerated on `postinstall`).
- A **minimal `Employee` model** ([apps/api/prisma/schema.prisma](../../apps/api/prisma/schema.prisma))
  with indexes on `country`, `department`, `jobTitle`, `salaryAmount`, `name`.
- A **stub `listEmployees()` repository** and a **stub seed** ([apps/api/prisma/seed.ts](../../apps/api/prisma/seed.ts)).
- **Shared `Employee` + `CreateEmployee`** Zod schemas/types in `packages/shared`.
- **Vitest + Supertest** wired; one green integration test.

Each phase below is a small, independently committable PR (per the working agreement on incremental
commits) and is built **test-first** (TDD per the JD): write the failing test, make it pass, refactor.

---

## 2. Cross-cutting decisions (settled once, applied everywhere)

These hold across all phases so individual phases don't re-litigate them.

### 2.1 Response & error envelope
- **Success**: lists return `{ data: T[], pagination: { page, pageSize, total, totalPages } }`;
  single resources return the resource object directly.
- **Errors**: a single shape `{ error: { code, message, details? } }`, produced **only** by the
  central error handler ([apps/api/src/middleware/error-handler.ts](../../apps/api/src/middleware/error-handler.ts)).
  Controllers and services throw typed domain errors (`NotFoundError`, `ValidationError`,
  `ConflictError`, `UnauthorizedError`); the handler maps them to HTTP status + envelope. No
  controller writes an error response by hand.
- Express 5 forwards rejected async handlers to the error middleware automatically — rely on that;
  wrap handlers in a small `asyncHandler` only if a case needs it.

### 2.2 Validation at the boundary
- All request input (params, query, body) is validated by **Zod schemas from `packages/shared`** in a
  reusable `validate({ params, query, body })` middleware. Controllers receive already-parsed,
  typed data — they never touch `req.body` raw.
- The same schemas validate import rows (§ Phase 6) and are the inferred types the frontend imports —
  *one definition across the wire*.

### 2.3 Performance posture (the 10k rule)
- **Never load the table into Node.** Lists always paginate; aggregates (including median) are
  computed **in SQL** via `prisma.$queryRaw` (window functions / `GROUP BY`), per
  [../tech-stack.md](../tech-stack.md) §3.
- Filter/sort only on indexed columns; if a new sort/filter column is added, add its index in the
  same migration.

### 2.4 Layering discipline
- `routes/` wire path→controller only. `controllers/` translate HTTP↔domain. `services/` hold logic
  (aggregation orchestration, import rules, auth) and are Express-agnostic and unit-tested.
  `repositories/` own all Prisma/raw-SQL access. Dependencies point one direction only.

### 2.5 Testing strategy per layer
- **Unit (Vitest)**: services and pure helpers (distribution bucketing, import row mapping, password
  hashing wrapper, query-param normalisation). No I/O.
- **Integration (Vitest + Supertest)**: each route group against a **fresh migrated SQLite DB**
  (file-based temp or `file::memory:` with a small seeded fixture), asserting status, envelope,
  pagination, and DB side effects. A shared test harness builds the app, migrates, seeds a small
  fixture, and tears down per suite.
- A handful of **larger-dataset assertions** (e.g. analytics correctness, pagination bounds) run
  against a few-thousand-row fixture to prove the SQL scales and the math is right.

### 2.6 API documentation as you go (OpenAPI from the Zod schemas)
- The OpenAPI spec is **generated from the shared Zod schemas** — the same schemas that validate
  requests (§2.2) — so docs can't drift from the contract. There is no hand-maintained spec file.
- Each feature phase **registers its routes** (path, method, params, request body, responses,
  security) in a single OpenAPI registry as that phase lands, rather than back-filling everything at
  the end. The hosted Swagger UI is wired up once in **Phase 9** and simply renders the accumulated
  registry.
- **Mechanism (primary):** `@asteasolutions/zod-to-openapi` to attach metadata to the shared schemas
  and build an OpenAPI 3.1 document, served interactively by `swagger-ui-express`. (Zod 4's native
  `z.toJSONSchema` is the fallback for the schema half if we avoid the extra dep, but the registry
  lib also gives us paths + security schemes, which is what makes "Try it out" work.)

---

## 3. Data model (the shape everything else depends on)

Decisions, with scope kept honest (no payroll/FX/audit — see requirements §6):

| Field            | Type             | Notes |
| ---------------- | ---------------- | ----- |
| `id`             | `String` (uuid)  | Server-assigned. Keep uuid (stable, non-guessable). |
| `name`           | `String`         | Searchable. |
| `email`          | `String @unique` | Searchable; natural import key (see §Phase 6 upsert). |
| `country`        | `String`         | Filterable; drives local currency. |
| `department`     | `String`         | Filterable / segment. |
| `jobTitle`       | `String`         | Filterable / segment. |
| `level`          | `String`         | **New** — requirements call out "job title/**level**" for analytics segments. |
| `salaryAmount`   | `Float`          | Base salary in local currency. |
| `salaryCurrency` | `String` (len 3) | ISO 4217; shown alongside country, **not** converted (FX out of scope). |
| `createdAt`      | `DateTime`       | **New** — `@default(now())`; cheap, aids stable sort tiebreak and "recently added". |
| `updatedAt`      | `DateTime`       | **New** — `@updatedAt`. |

**Money representation note.** Base salary stays `Float` for v1 to match the existing schema and keep
the seed/import simple; we record the known trade-off (float rounding) and that integer-minor-units
is the fast-follow if exact arithmetic is ever needed. Since there's no FX/summing across currencies
in scope, float totals per single currency are acceptable and this is documented, not hidden.

**Indexes.** Keep existing single-column indexes; add `level` index and a composite where a common
filter+sort pairing emerges (e.g. `@@index([country, salaryAmount])`) — added only when a query
needs it, justified in the migration.

---

## 4. Phases

### Phase 1 — Domain model & shared contracts
**Goal:** lock the data model and the wire schemas before building endpoints against them.

- Extend [schema.prisma](../../apps/api/prisma/schema.prisma): add `level`, `createdAt`, `updatedAt`,
  `level` index; create a Prisma **migration** (`prisma migrate dev`). Update the generated client.
- Expand `packages/shared`:
  - Enrich `employeeSchema` with `level`, `createdAt`, `updatedAt`.
  - `createEmployeeSchema` (omit server fields) and `updateEmployeeSchema` (partial, for PATCH/PUT).
  - `employeeQuerySchema`: `page`, `pageSize` (bounded, sane defaults), `search`, `department`,
    `country`, `jobTitle`, `level`, `sort` (whitelisted columns), `order` (`asc|desc`). Coerces
    query strings to typed values.
  - `paginatedSchema<T>` helper and the `{ error: { code, message, details? } }` error schema.
  - Re-export all from the barrel; keep schema unit tests (valid/invalid cases) green.
- **Done when:** migration applies on a clean DB; `packages/shared` exports the new schemas/types and
  its unit tests pass; `pnpm typecheck` is clean across workspaces.

### Phase 2 — 10,000-employee seed
**Goal:** never develop or test against a toy dataset (tech-stack §5; requirements §7).

- Replace the stub [seed.ts](../../apps/api/prisma/seed.ts) with an **idempotent, deterministic**
  Faker seed (fixed seed value for reproducibility):
  - ~10,000 employees spread across a fixed set of **countries** each with its **local currency**
    (country→currency map), realistic **departments**, **job titles**, and **levels**.
  - A **believable salary distribution** per (country, level) — log-normal-ish with outliers — so
    medians, bands, and segment comparisons are meaningful (not uniform noise).
  - Idempotent: wipe-and-reseed or upsert-by-email so re-running doesn't duplicate; batch
    `createMany` for speed.
- Add a `seed` script note in the README; confirm it runs in seconds, not minutes.
- **Done when:** `pnpm --filter api seed` populates exactly ~10k rows reproducibly; a quick count +
  spot-check query confirms spread across countries/departments/levels.

### Phase 3 — Employee directory (list: paginate, search, filter, sort)
**Goal:** `GET /employees` performant at 10k (requirements §5.1).

- **Repository:** `findEmployees(query)` and `countEmployees(query)` building a single parametrised
  Prisma query — `where` from search (name/email `contains`) + filters (country/department/jobTitle/
  level), `orderBy` from whitelisted `sort`+`order` (with `id`/`createdAt` tiebreak for stable
  pages), `skip`/`take` from pagination. Offset pagination for v1 (simple, indexed); note keyset as
  the upgrade path if deep pages matter.
- **Service:** `listEmployees(query)` → `{ data, pagination }`; computes `totalPages`, clamps `page`.
- **Controller + route:** `validate({ query: employeeQuerySchema })` → service → envelope.
- **Tests:** unit (query→args mapping, pagination math); integration (default page, search hit/miss,
  each filter, sort asc/desc, page bounds, empty result) against the seeded fixture; one assertion
  on a multi-thousand-row fixture for responsiveness/correctness.
- **Done when:** the endpoint returns correct paginated/filtered/sorted slices with the standard
  envelope and stays responsive on the full seed.

### Phase 4 — Employee detail & CRUD
**Goal:** maintain the data (requirements §5.2).

- `GET /employees/:id` → 404 (`NotFoundError`) when missing, else the resource.
- `POST /employees` → `validate({ body: createEmployeeSchema })`; 201 + created resource; **409**
  (`ConflictError`) on duplicate email (unique constraint, caught and mapped, not leaked as a Prisma
  error).
- `PUT /employees/:id` (or `PATCH` with `updateEmployeeSchema`) → 200 + updated resource; 404 if
  missing; 409 on email collision.
- `DELETE /employees/:id` → 204; 404 if missing.
- **Repository:** `findById`, `create`, `update`, `delete`; map Prisma known-error codes (e.g.
  unique violation `P2002`, not-found `P2025`) to domain errors in the service/repository boundary.
- **Tests:** integration for each verb incl. validation failures (400 + error envelope with field
  details), 404s, and the 409 duplicate-email path; unit for any mapping logic.
- **Done when:** full CRUD round-trips through the layered stack with correct status codes and the
  shared error envelope.

### Phase 5 — Compensation analytics
**Goal:** answer "how does the org pay people?" responsively (requirements §5.3) — **median included**.

- **Endpoints (REST, read-only):**
  - `GET /analytics/summary` — org-wide: total payroll spend (per currency, since no FX),
    headcount, overall average & median.
  - `GET /analytics/by/:dimension` — `dimension ∈ {department, country, jobTitle, level}`: per-group
    headcount, average, **median**, min/max — supporting side-by-side segment comparison.
  - `GET /analytics/distribution` — pay distribution as bands/buckets (count per salary range),
    optionally scoped by currency/segment, to surface spread and outliers.
- **Repository (raw SQL, computed in DB):**
  - Totals/headcount/average via `GROUP BY` aggregates.
  - **Median/percentiles** via a window-function / ordered approach in `prisma.$queryRaw`
    (`ROW_NUMBER()` over ordered partition, or `NTILE`/percentile logic) — never by loading rows
    into Node. Grouped medians per dimension in one query where feasible.
  - Distribution via `GROUP BY` on computed band boundaries (or `CASE`/`width_bucket`-style
    bucketing) returning ordered band counts.
- **Currency handling:** because salaries are local-currency and FX is out of scope, monetary
  rollups are reported **per currency** (or per single-currency segment); the response makes the
  currency explicit so the UI never implies a false cross-currency total.
- **Tests:** unit for distribution-band math and any normalisation; integration asserting the SQL
  results against a **known fixture** with hand-computed average/median/bands (the part most worth
  proving correct), plus a multi-thousand-row run to confirm it stays fast.
- **Done when:** each analytics endpoint returns correct, currency-explicit figures (avg **and**
  median) and runs in SQL against the full seed without loading rows into memory.

### Phase 6 — Bulk Excel/CSV import & export
**Goal:** migrate/bulk-update from spreadsheets and round-trip filtered views (requirements §5.4).

- **Import — `POST /import`** (multipart upload):
  - Parse Excel/CSV via **SheetJS** (`xlsx`) / `csv-parse` (stack §5), **streaming/row-by-row** to
    avoid loading a huge file fully into memory.
  - Validate **each row** with the shared import-row Zod schema; collect a per-row result
    `{ row, status: "ok" | "error", errors? }`. **Bad rows are reported, not fatal** — a malformed
    file never silently corrupts data (requirements §5.4).
  - Apply valid rows as an **upsert by email** inside a transaction (or batched transactions);
    response summarises `{ inserted, updated, failed, rowErrors[] }`.
  - Define and document the **expected column format** (header names → fields) so the HR Manager
    knows what to upload; surface header-mismatch errors clearly.
- **Export — `GET /export`**:
  - Reuse the **same query layer** as the directory so `search`/`filter` params round-trip — the
    export reflects exactly the filtered view (tech-stack §5).
  - Stream out CSV (and/or XLSX) with a sensible filename and headers matching the import format, so
    an export can be re-imported.
- **Tests:** unit for row mapping + validation (good row, bad row, header mismatch); integration for
  a small valid file (counts + DB state), a mixed valid/invalid file (partial success + error
  report, no corruption), and export→parse round-trip equality; a larger-file test to confirm
  streaming holds memory flat.
- **Done when:** import gives clear per-row validation feedback and applies valid rows transactionally;
  export honours the active filter and round-trips with import.

### Phase 7 — Authentication gate
**Goal:** sign-in protects all data; single trusted user class, **no roles** (requirements §5.5).

- **Model:** a single `User` (email + hashed password) — seed one HR-Manager credential from env;
  no self-registration UI needed for v1. Hash with a vetted library (bcrypt/argon2 wrapper); never
  store plaintext.
- **Endpoints:** `POST /auth/login` (verify credentials → issue session) and `POST /auth/logout`;
  optional `GET /auth/me` to let the frontend rehydrate session state.
- **Session mechanism:** stateless **signed JWT in an httpOnly, sameSite cookie** (simple, no session
  store; fits single-service deploy) — or server session if a store is trivial; pick JWT-cookie for
  v1 and document it. Secret from env/config.
- **`requireAuth` middleware:** gate **all** `/employees`, `/analytics`, `/import`, `/export` routes;
  `/health`, `/auth/login`, and the docs routes (`/docs`, `/openapi.json`) stay public. Unauthorised
  → 401 via the error envelope.
- **Testability from Swagger (Phase 9):** declare the auth scheme in the OpenAPI registry so the
  Swagger UI **Authorize** button can carry credentials to protected endpoints. Because the chosen
  cookie is httpOnly, also **accept the same JWT as a `Bearer` Authorization header** (cookie *or*
  header) — that makes "Try it out" trivially authorisable in Swagger while the cookie remains the
  browser path. Document both. Login can echo the token so a tester can paste it into Authorize.
- **Tests:** unit for credential verification + token issue/verify; integration that protected routes
  return 401 without/with-bad token and 200 with a valid one (via cookie **and** Bearer), and the
  login happy/sad paths.
- **Done when:** no protected route is reachable without a valid session; login/logout work; secrets
  come from config, never code.

### Phase 8 — Hardening & API polish
**Goal:** make the backend production-credible and easy to read/run.

- **Security/robustness middleware:** `helmet` (or equivalent headers), CORS configured for the web
  origin, JSON body-size limit, and **basic rate limiting** on `/auth/login` (brute-force guard).
  Add only what's justified; note each in tech-stack if it's a new dep.
- **Logging:** lightweight structured request logging (method, path, status, duration) with errors
  logged once in the central handler; no secrets/PII in logs.
- **Config hardening:** validate required env at boot (fail fast if `JWT_SECRET`/`DATABASE_URL`
  missing) by parsing `process.env` through a Zod config schema in `config/`.
- **API documentation:** the interactive OpenAPI/Swagger UI is its own deliverable — see **Phase 9**.
- **Graceful shutdown & DB lifecycle:** close Prisma/SQLite cleanly on `SIGTERM`/`SIGINT`.
- **Done when:** protected, header-hardened, rate-limited where it matters; misconfig fails fast;
  the full suite (`pnpm test`), `pnpm lint`, `pnpm typecheck` are green.

### Phase 9 — OpenAPI spec & hosted interactive Swagger UI
**Goal:** a hosted documentation page where the HR Manager / reviewer can **see and exercise every
endpoint** ("Try it out"), generated from the same Zod schemas that validate requests so docs never
drift from the contract.

- **Spec generation (from Zod, single source of truth):** finalise the OpenAPI 3.1 document built
  from the per-phase registry (§2.6) via `@asteasolutions/zod-to-openapi`. Every route contributes
  its params, request body, response schemas (success envelope + `{ error }`), status codes, tags
  (Employees / Analytics / Import-Export / Auth), and security requirement. Servers list includes
  local dev and the deployed base URL.
- **Hosted endpoints (served by the Express app itself):**
  - `GET /openapi.json` — the raw spec (public).
  - `GET /docs` — interactive **Swagger UI** (`swagger-ui-express`) rendering that spec (public).
  Because the API and docs are one Express service, the docs are reachable at `<host>/docs` wherever
  the service is deployed — **the link is just the deployed origin + `/docs`** (actual public URL is
  set by the deployment plan; locally it's `http://localhost:<port>/docs`).
- **Make "Try it out" actually work end to end:**
  - Declare the **security scheme** (Bearer JWT, plus the cookie scheme) so the **Authorize** button
    lets the tester authenticate once and then call every protected route (per Phase 7's cookie-or-
    Bearer support).
  - Configure Swagger UI to send credentials (`withCredentials`) and target the correct server so
    same-origin cookie auth also works after `POST /auth/login`.
  - Ensure CORS (Phase 8) permits the docs origin so requests from the UI aren't blocked.
  - Document the flow on the page: log in (or paste the echoed token into Authorize) → call any
    endpoint, including file upload for `POST /import`.
- **Keep it honest:** a CI/test check that the spec **builds** and that every registered route is
  represented (so a new route without docs fails the check), keeping coverage at "every API".
- **Tests:** integration that `GET /openapi.json` returns a valid OpenAPI document containing all
  routes, and that `GET /docs` serves the UI (200/HTML). A smoke check that a protected route is
  callable through the spec's Bearer scheme.
- **Done when:** visiting `<host>/docs` shows every endpoint grouped by tag, and a reviewer can
  authenticate via **Authorize** and successfully execute **every** endpoint (incl. import upload)
  from the page; the spec is generated from the Zod schemas and the CI coverage check is green.

---

## 5. Endpoint surface (target)

| Method | Path                       | Auth | Purpose |
| ------ | -------------------------- | ---- | ------- |
| GET    | `/health`                  | no   | Liveness (exists). |
| POST   | `/auth/login`              | no   | Sign in; set session cookie. |
| POST   | `/auth/logout`             | yes  | Clear session. |
| GET    | `/auth/me`                 | yes  | Current user (session rehydrate). |
| GET    | `/employees`               | yes  | Paginated list: search, filter, sort. |
| GET    | `/employees/:id`           | yes  | Single employee detail. |
| POST   | `/employees`               | yes  | Create (201; 409 dup email). |
| PUT    | `/employees/:id`           | yes  | Update (200; 404; 409). |
| DELETE | `/employees/:id`           | yes  | Remove (204; 404). |
| GET    | `/analytics/summary`       | yes  | Totals, headcount, overall avg & median. |
| GET    | `/analytics/by/:dimension` | yes  | Avg/median/min/max/headcount by segment. |
| GET    | `/analytics/distribution`  | yes  | Pay bands / buckets. |
| POST   | `/import`                  | yes  | Excel/CSV upload; per-row validation report. |
| GET    | `/export`                  | yes  | Filtered export (CSV/XLSX), round-trips with import. |
| GET    | `/openapi.json`            | no   | Generated OpenAPI 3.1 spec (from Zod schemas). |
| GET    | `/docs`                    | no   | Interactive Swagger UI — "Try it out" for every endpoint. |

---

## 6. New dependencies (update tech-stack.md before adding)

Per the working agreement, [../tech-stack.md](../tech-stack.md) is updated *first* with reasoning for
each. Already-listed: Faker, SheetJS/`csv-parse`, Zod, Supertest/Vitest. **New to record:** the
password-hashing lib (bcrypt/argon2), the JWT/cookie libs, the hardening middleware
(`helmet`, CORS, rate-limit, multipart parser e.g. `multer`/`busboy`), and the **API-docs stack**
(`@asteasolutions/zod-to-openapi` for the spec + `swagger-ui-express` for the hosted UI). Each gets a
one-line "why" in the doc; none pulls in excluded scope (payroll/FX/roles).

---

## 7. Risks & notes

- **Median in SQLite.** No built-in `PERCENTILE`; implement via window functions / ordered
  `ROW_NUMBER()` and verify against a hand-computed fixture — the correctness assertion that most
  matters. Keep it grouped/in-DB; resist the temptation to compute in Node.
- **Float money.** Documented v1 trade-off (§3); fine because no cross-currency summing is in scope.
  Integer-minor-units is the noted fast-follow.
- **Mixed-currency analytics.** Always report monetary rollups **per currency** so the UI can't imply
  a false global total (FX is deliberately out of scope, requirements §6).
- **Import memory.** Stream rows; don't `JSON`-buffer a 10k-row file. Transactionally batch writes.
- **Auth minimalism.** A gate, not an access-control system (requirements §5.5) — resist adding roles.
- **Swagger + httpOnly cookie.** "Try it out" can't read an httpOnly cookie, so protected calls would
  fail to authorise from the UI on cookie alone — hence Phase 7 also accepts a `Bearer` token and the
  spec declares that scheme, so the **Authorize** button works. Keep CORS/credentials aligned (Phase 8/9).
- **Spec drift.** Risk that docs lag the code; mitigated by generating the spec **from the Zod
  schemas** and a CI check that every registered route appears in the spec (Phase 9).
- **Prisma 7 / better-sqlite3.** Migrations + the driver adapter are already wired; new migrations
  follow the same flow, and the native module must match the CI Node version (see scaffold §7).

---

## 8. Definition of Done (whole plan)

- Model migrated; `pnpm --filter api seed` yields a realistic ~10k dataset reproducibly.
- Directory (paginate/search/filter/sort), full CRUD, analytics (avg **and** median, distribution,
  per-segment), and import/export all work through the layered stack with the standard
  success/error envelopes.
- Every protected route is behind `requireAuth`; login/logout function; secrets come from config.
- Analytics + median proven correct against a known fixture and responsive on the full seed
  (computed in SQL, never in Node).
- `pnpm test` (unit + integration at every layer), `pnpm lint`, `pnpm typecheck` are green locally
  and in CI; the endpoint surface in §5 is documented.
- **Hosted Swagger UI at `<host>/docs`** renders every endpoint from the Zod-generated OpenAPI spec,
  and a reviewer can **Authorize** and execute **every** API (incl. import upload) from the page.
- `docs/tech-stack.md` records any new deps; `CLAUDE.md` **Status** is updated to "backend feature-
  complete"; this work's prompts are appended to `PROMPTS.md`.

---

## 9. Out of scope for this plan (handled elsewhere)

- All React/UI feature work (directory table, forms, dashboard, charts) — separate frontend plan.
- Production deployment pipeline / hosting target — deployment plan.
- Excluded product scope (payroll, FX normalisation, roles/permissions, approval workflows, audit
  history) — see requirements §6; not built here.
