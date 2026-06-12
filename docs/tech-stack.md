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

---

## 5. Cross-Cutting

### Seeding — 10,000 employees

A dedicated, idempotent seed script generates ~10,000 realistic employees (using Faker) spread
across multiple countries, departments, job titles/levels, and **local-currency** salaries with a
believable distribution (so medians, bands, and outliers are meaningful). This satisfies the brief
and ensures we never develop or test against a toy dataset.

### Bulk import/export — Excel/CSV

A streaming parser (e.g. SheetJS / `csv-parse`) handles import; rows are validated with **Zod** and
bad rows are reported back without aborting the whole file (requirements §5.4). Export reuses the
same query layer as the directory so filtered views round-trip.

### Validation — Zod, shared

Zod schemas validate API inputs and import rows, and the inferred types are shared with the
frontend — one definition of an "Employee" across the wire.

### Authentication

A single trusted HR-Manager user class behind a simple session/token gate (requirements §5.5). No
roles or permissions — auth is only a lock on sensitive data, deliberately kept minimal.

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

### Validation & data movement

- **Zod** — https://zod.dev/
- **Faker** (seeding) — https://fakerjs.dev/
- **SheetJS** (Excel parse/write) — https://docs.sheetjs.com/
- **csv-parse** — https://csv.js.org/parse/

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
