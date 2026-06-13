# ACME Salary Management System — Tech Stack & Architecture

**Status:** Draft v1
**Last updated:** 2026-06-12

This document records the technology choices for the project and the reasoning behind each one.
Choices are driven by three things: the [assessment brief](assessment.md) (build end-to-end
backend + UI, relational DB, seed 10,000 employees, meaningful tests), the
[requirements](requirements.md) (directory, CRUD, analytics, import/export at ~10k scale), and the
target role's job description, which centres on **Node.js + TypeScript + React**, **Test-Driven
Development**, and **Extreme Programming** craftsmanship.

---

## 1. Guiding Principles

- **Match the JD's craft, not just its keywords.** The role is a "Software Craftsperson" in
  Node/TypeScript/React with an explicit emphasis on TDD, clean code, and continuous delivery. The
  stack is chosen so tests come first and stay fast and deterministic.
- **One language, end to end.** TypeScript across backend, frontend, and tests keeps types shared,
  reduces context-switching, and lets domain models be defined once.
- **Design for 10,000 records from day one.** Every list paginates; every aggregate (including
  median) is computed in the database, not in application memory.
- **Boring, well-understood tools.** Prefer mature, widely-supported libraries over novelty so the
  reviewer can read the code without learning a framework first.
- **Keep the scope honest.** No payroll, FX, or multi-role auth (see requirements §6). The stack
  carries no weight for excluded features.

---

## 2. Stack at a Glance

| Layer         | Choice                                                                  | Why (short)                                                                     |
| ------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Language      | **TypeScript** (strict)                                                 | One typed language end to end; matches JD.                                      |
| Runtime       | **Node.js (LTS)**                                                       | Required by JD; mature ecosystem.                                               |
| API framework | **Express**                                                             | Minimal, well-understood HTTP layer.                                            |
| Database      | **SQLite** (via better-sqlite3)                                         | Relational, zero-ops, fast for read-heavy analytics; brief names it explicitly. |
| ORM / query   | **Prisma**                                                              | Typed schema + migrations; raw SQL escape hatch for median/aggregates.          |
| Frontend      | **React + Vite + TypeScript**                                           | Required by brief; Vite for fast dev/build.                                     |
| Styling       | **Tailwind CSS**                                                        | Utility-first styling; components built in-house for full control of a data-dense HR UI. |
| Server state  | **TanStack Query**                                                      | Pagination, caching, loading/error states out of the box.                       |
| Testing       | **Vitest** + **Supertest** + **React Testing Library** + **Playwright** | Fast unit/integration/E2E; TDD-friendly.                                        |
| Validation    | **Zod**                                                                 | Shared request/response schemas; import-row validation.                         |
| Tooling       | ESLint + Prettier, **GitHub Actions** CI                                | Clean code, continuous integration per JD.                                      |

> Parenthesised alternatives are interchangeable; the primary choice is what the implementation
> targets. Final picks are confirmed as code lands and this doc is updated.

---

## 3. Backend

### Language & runtime — TypeScript on Node.js (LTS)

The JD lists Node.js and TypeScript as must-haves. TypeScript's strict mode catches whole classes
of bugs at compile time and makes the compensation domain (money, currency, country) explicit in
the type system.

### API — Express

A REST API is sufficient for a single-persona CRUD-plus-analytics tool; GraphQL would add ceremony
without a client that needs its flexibility. Express is the most widely understood Node HTTP
framework, which keeps the reviewer's reading cost low and gives ready access to a mature
middleware ecosystem.

**Planned routes (illustrative):**

- `GET /employees` — paginated, with `search`, `filter` (department/country/title), `sort`.
- `GET /employees/:id`, `POST /employees`, `PUT /employees/:id`, `DELETE /employees/:id`.
- `GET /analytics/summary` — totals, headcount, average/median by segment, distribution bands.
- `POST /import`, `GET /export` — Excel/CSV bulk operations with per-row validation feedback.

### Database — SQLite (relational)

The brief explicitly suggests SQLite, and it's a strong fit: the workload is read-heavy analytics
over a single, modest (~10k-row) dataset with one user. SQLite needs no separate server, makes the
project trivial to clone and run, and gives fully deterministic, fast tests (each test can use a
fresh in-memory database). The schema is standard SQL, so moving to Postgres later is mechanical if
scale or concurrency ever demands it — that portability is itself a reason to stay relational now.

### ORM — Prisma with a raw-SQL escape hatch

Prisma gives a typed schema, generated client, and first-class migrations, which keeps data access
clean and refactor-safe. The one place it doesn't shine is **median** — there's no portable ORM
primitive for it — so aggregate/percentile queries are written as raw SQL (window functions /
`PERCENTILE`-style logic) and computed **in the database**, never by loading 10k rows into Node.
This keeps analytics responsive at scale, which the requirements call out explicitly.

**Prisma 7 specifics.** We build on Prisma 7 (current latest). Prisma 7 moved the database URL out
of `schema.prisma` into a `prisma.config.ts`, and connects through a **driver adapter** rather than
a bundled engine — for SQLite that adapter is `@prisma/adapter-better-sqlite3`, which is exactly the
`better-sqlite3` driver named above. The generated client is emitted to `apps/api/src/generated`
(gitignored, regenerated on `postinstall`). This is more current-practice setup than Prisma 6's
in-schema URL, and realises "SQLite via better-sqlite3" literally.

### Performance notes

- Indexes on the columns we filter/sort by: `country`, `department`, `job_title`, `salary`, `name`.
- Keyset or limit/offset pagination on the directory endpoint; never return the full table.
- Aggregates run as SQL `GROUP BY` + window functions, so adding employees doesn't slow the UI.

---

## 4. Frontend

### React + Vite + TypeScript

React is required by the brief and is the JD's frontend framework. Vite gives near-instant dev
server start and fast builds. Plain React + Vite (rather than Next.js) is chosen because this is a
single-user authenticated **dashboard/SPA** with no SEO, server-rendering, or marketing-page needs
— Next.js's routing/SSR machinery would be weight without payoff here. (If a deployment target
favoured Next, the component code would port with little change.)

### Styling — Tailwind CSS

The brief leaves styling open. Tailwind's utility-first approach keeps styles colocated with markup
(no separate CSS files to drift out of sync) and gives a consistent design-token system — spacing,
colour, and typography scales — out of the box. Rather than adopt a heavyweight component library,
the data-dense UI elements (table, filters, forms, modals) are **built in-house on Tailwind**,
which keeps full control over behaviour and markup and avoids fighting a library's opinions on a
custom HR layout. Where accessible interaction primitives are needed (dialogs, menus,
comboboxes), an unstyled headless library such as Radix or Headless UI can supply the behaviour
while Tailwind handles all presentation. Charts for the analytics dashboard come from a dedicated
charting library (e.g. Recharts), since Tailwind covers styling, not data visualisation.

### Server state — TanStack Query

Pagination, caching, request de-duplication, and clean loading/error/empty states are exactly what
the requirements ask for (§5.6). TanStack Query provides them declaratively so the UI components
stay focused on rendering, not fetch plumbing.

### Client routing & utilities

**react-router-dom** drives the SPA's pages and route guards (a single-user dashboard needs client
routing, not SSR). **clsx** + **tailwind-merge** compose conditional Tailwind classes without
specificity clashes (a tiny `cn()` helper) — the ergonomic glue for the in-house design system.
**react-hook-form** + **@hookform/resolvers** power forms, bound via the resolver to the **shared**
Zod schemas (`loginSchema`, `createEmployeeSchema`, …) so client and server validate identically.
**msw** (Mock Service Worker) backs component/feature tests with realistic response envelopes — no real
network — so tests exercise the same `{ data }` / `{ error }` shapes the API returns.

---

## 5. Cross-Cutting

### Seeding — 10,000 employees

A dedicated, idempotent seed script generates ~10,000 realistic employees (using Faker) spread
across multiple countries, departments, job titles/levels, and **local-currency** salaries with a
believable distribution (so medians, bands, and outliers are meaningful). This satisfies the brief
and ensures we never develop or test against a toy dataset.

### Bulk import/export — Excel/CSV

**SheetJS (`xlsx`)** parses *both* Excel and CSV uploads and generates exports in either format, so a
single library covers the round-trip with matching column headers. **`multer`** (memory storage)
handles the multipart upload. Rows are validated with **Zod** and bad rows are reported back without
aborting the whole file (requirements §5.4); valid rows are upserted by email in a transaction.
Export reuses the same query layer (filters/sort) as the directory so filtered views round-trip.

*Trade-off:* SheetJS buffers the workbook rather than truly streaming (the `.xlsx` zip format isn't
streamable anyway). At the in-scope size (~10k rows / a few MB) this is fine; `csv-parse` remains the
noted fast-follow if a true row-streaming CSV path is ever needed for much larger files.

### Validation — Zod, shared

Zod schemas validate API inputs and import rows, and the inferred types are shared with the
frontend — one definition of an "Employee" across the wire.

### API documentation — OpenAPI from Zod, hosted Swagger UI

The OpenAPI 3.0 document is generated from the **same shared Zod schemas** that validate requests, so
the docs can't drift from the contract. The schema half uses **Zod 4's native `z.toJSONSchema`**
(`target: "openapi-3.0"`) rather than the `@asteasolutions/zod-to-openapi` registry — that library
predates Zod 4, and Zod's built-in converter keeps the single-source-of-truth without an extra
dependency. A small hand-assembled path/security layer adds the routes, tags, and the Bearer + cookie
security schemes. **swagger-ui-express** serves an interactive UI at `/docs` (and the raw spec at
`/openapi.json`), with the **Authorize** button wired for the Bearer token so every protected
endpoint — including the `POST /import` file upload — is executable from the page. A test asserts the
spec covers every registered route.

### Authentication

A single trusted HR-Manager user class behind a simple session/token gate (requirements §5.5). No
roles or permissions — auth is only a lock on sensitive data, deliberately kept minimal.

Implementation: the password is hashed with **bcryptjs** (pure-JS, so no extra native build on top
of better-sqlite3) and never stored in plaintext. Login issues a **stateless signed JWT**
(`jsonwebtoken`) carried in an **httpOnly, sameSite cookie** (`cookie-parser` reads it back) — no
session store, which fits the single-service deploy. The token is *also* accepted as a `Bearer`
Authorization header so the hosted Swagger UI's **Authorize** button can exercise protected routes
(the httpOnly cookie is unreadable from JS). `requireAuth` verifies the token statelessly (no DB
round-trip) and gates every data route; the secret comes from config/env.

### Security & hardening

Production-credible defaults, each justified rather than kitchen-sink: **helmet** sets sensible
security response headers; **cors** is scoped to the web origin with credentials enabled (for the
auth cookie); the JSON body parser has a size limit; and **express-rate-limit** throttles
`POST /auth/login` to blunt brute-force attempts. Required env is validated at boot through a **Zod**
config schema — the process **fails fast** if e.g. `JWT_SECRET` is missing (or left at the dev
default) in production. Request logging is a small in-house structured (JSON) middleware — no extra
dependency — and the central error handler logs unexpected failures once, without leaking secrets/PII.
The server closes Prisma/SQLite cleanly on `SIGTERM`/`SIGINT`.

### Monorepo & tooling

The project is a single **pnpm-workspaces** monorepo. Runnable apps live in `apps/` (`api`, `web`);
shared libraries live in `packages/` (`shared` domain schemas/types, plus shared `tsconfig` and
`eslint-config`). pnpm is the de-facto standard for JS monorepos and links the shared package via
`workspace:*`. Task orchestration is plain root scripts fanning out with `pnpm -r` / `--filter`;
**Turborepo is deferred** — with two apps and one shared package its caching isn't yet worth the
ceremony. **Node 22 LTS** is pinned in `.nvmrc` (Prisma 7 does not support Node 25). Latest stable
versions are used across the stack and frozen in the committed lockfile. See the repository
[README](../README.md) and [docs/plans/01-project-setup.md](plans/01-project-setup.md) for the
layout and setup steps.

---

## 6. Testing & Quality (TDD / XP)

The JD's core is "write tests first." The test pyramid:

- **Unit** (Vitest) — domain logic: salary aggregation, median/percentile math, import-row
  validation, formatting. Fast and deterministic; no I/O.
- **Integration** (Vitest + Supertest) — API routes against a fresh in-memory SQLite DB per suite,
  covering pagination, filtering, CRUD, and analytics endpoints.
- **Component** (React Testing Library) — directory list, forms, and dashboard states (loading,
  empty, error).
- **E2E** (Playwright) — a thin layer over the critical HR journeys: find an employee, edit a
  salary, read an analytics answer.

Tests are kept fast and deterministic (in-memory DB, seeded fixtures, no network) so they can be
run on every change — the practical foundation for TDD.

### Tooling & CI

ESLint + Prettier enforce a consistent, clean style. **GitHub Actions** runs lint, typecheck, and
the full test suite on every push, reflecting the JD's continuous-deployment expectation.

---

## 7. Deployment

Target a single deployable unit: the Express server serves the API and the built React assets, with
the SQLite file on a persistent volume. A platform like Render / Railway / Fly.io keeps deployment
to one service and satisfies the brief's "fully functional deployed software," with a short video
demo as the secondary readiness artifact.

---

## 8. Rejected / Deferred Alternatives

| Considered                 | Decision | Reason                                                                            |
| -------------------------- | -------- | --------------------------------------------------------------------------------- |
| Next.js                    | Deferred | No SSR/SEO need for a single-user dashboard; plain SPA is simpler.                |
| Postgres/MySQL             | Deferred | SQLite fits a single-user, read-heavy 10k dataset; relational schema ports later. |
| GraphQL                    | Rejected | REST is sufficient for one known client; GraphQL adds tooling overhead.           |
| Compute aggregates in Node | Rejected | Loading 10k rows to average/median doesn't scale; do it in SQL.                   |
| Jest                       | Deferred | Vitest is faster and shares Vite's config; same RTL/assertion ergonomics.         |

---

## 9. Official Documentation

Authoritative docs for every tool in the stack. **This is the canonical reference — when in doubt,
follow these, not memory or blog posts.**

### Language & runtime

- **TypeScript** — https://www.typescriptlang.org/docs/
- **Node.js** — https://nodejs.org/docs/latest/api/

### Backend

- **Express** — https://expressjs.com/
- **SQLite** — https://www.sqlite.org/docs.html
- **better-sqlite3** — https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md
- **Prisma** — https://www.prisma.io/docs

### Frontend

- **React** — https://react.dev/
- **Vite** — https://vite.dev/
- **Tailwind CSS** — https://tailwindcss.com/docs
- **Radix UI** (headless primitives) — https://www.radix-ui.com/primitives/docs/overview/introduction
- **Headless UI** (alternative primitives) — https://headlessui.com/
- **Recharts** (charts) — https://recharts.org/en-US/
- **TanStack Query** — https://tanstack.com/query/latest/docs/framework/react/overview
- **React Router** — https://reactrouter.com/
- **clsx** / **tailwind-merge** — https://github.com/lukeed/clsx · https://github.com/dcastil/tailwind-merge
- **React Hook Form** + **@hookform/resolvers** — https://react-hook-form.com/ · https://github.com/react-hook-form/resolvers
- **MSW** (Mock Service Worker) — https://mswjs.io/

### Validation & data movement

- **Zod** — https://zod.dev/
- **Faker** (seeding) — https://fakerjs.dev/
- **SheetJS** (Excel/CSV parse + write) — https://docs.sheetjs.com/
- **multer** (multipart upload) — https://github.com/expressjs/multer
- **csv-parse** (noted streaming fast-follow) — https://csv.js.org/parse/

### Authentication

- **bcryptjs** (password hashing) — https://github.com/dcodeIO/bcrypt.js
- **jsonwebtoken** (JWT) — https://github.com/auth0/node-jsonwebtoken
- **cookie-parser** — https://github.com/expressjs/cookie-parser

### Security & hardening

- **helmet** (security headers) — https://helmetjs.github.io/
- **cors** — https://github.com/expressjs/cors
- **express-rate-limit** — https://express-rate-limit.mintlify.app/

### API documentation

- **Zod `toJSONSchema`** (OpenAPI from schemas) — https://zod.dev/json-schema
- **swagger-ui-express** — https://github.com/scottie1984/swagger-ui-express
- **OpenAPI Specification** — https://spec.openapis.org/oas/v3.0.3

### Testing

- **Vitest** — https://vitest.dev/
- **Supertest** — https://github.com/ladjs/supertest
- **React Testing Library** — https://testing-library.com/docs/react-testing-library/intro/
- **Playwright** — https://playwright.dev/docs/intro

### Tooling & CI

- **ESLint** — https://eslint.org/docs/latest/
- **Prettier** — https://prettier.io/docs/
- **GitHub Actions** — https://docs.github.com/en/actions

---

_This document is updated as choices are confirmed in code. Where two options are listed, the first
is the working default._
