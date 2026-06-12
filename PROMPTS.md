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
