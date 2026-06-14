# CLAUDE.md

Guidance for working in this repository.

## Project

**ACME Salary Management System** — a web-based tool that replaces spreadsheets for managing
compensation data across **10,000 employees in multiple countries**. The single user persona is
the **HR Manager**, who needs to maintain salary records and answer questions about how the
organization pays people (totals, headcount, average/median by department/country/job title,
pay distribution).

This is a take-home assessment. The emphasis is on clear thinking, sound architecture, clean and
maintainable code, meaningful tests, and intentional, well-documented use of AI tools.

## Key Documents

- [Requirements](docs/requirements.md) — goal, scope, in/out-of-scope features, assumptions, and
  the reasoning behind each decision. Read this before adding features to confirm something is in scope.
- [Assessment brief](docs/assessment.md) — the original exercise: expectations, problem statement,
  technical constraints, and how submissions are evaluated.
- [Tech stack](docs/tech-stack.md) — the chosen technologies, the reasoning behind each, and links
  to their official documentation. The single source of truth for what we build with.
- [PROMPTS.md](PROMPTS.md) — running log of prompts used with AI tools, kept as an artifact of the
  development process.

## Working Agreements

- **Save prompts as you go.** Append each user prompt to [PROMPTS.md](PROMPTS.md) so the AI-assisted
  development process is captured as a submission artifact.
- **Make incremental commits.** Commit history should show how the solution evolved — small,
  meaningful commits over one large drop.
- **Respect the scope.** [docs/requirements.md](docs/requirements.md) deliberately excludes payroll,
  FX normalization, roles/permissions, etc. Don't pull these in without a reason; note trade-offs if you do.
- **Stick to the stack.** Build with the technologies in [docs/tech-stack.md](docs/tech-stack.md).
  Don't introduce a new library or framework without updating that doc (with reasoning) first, and
  follow the official documentation linked there rather than working from memory.
- **Design for scale.** The dataset is ~10,000 employees — lists must paginate and aggregates
  (including median) must stay responsive. Don't build against a toy dataset.

## Structure

Single **pnpm-workspaces** monorepo (Node 22 LTS, pinned in `.nvmrc`):

- `apps/api` — Express 5 + Prisma 7 (SQLite via the better-sqlite3 driver adapter) backend. Layered
  `src/`: `routes → controllers → services → repositories → db` (+ `middleware`, `config`, `utils`).
- `apps/web` — React 19 + Vite + Tailwind v4 SPA with TanStack Query. Feature-first `src/`:
  `components`, `features`, `pages`, `hooks`, `api`, `lib`, `types`, `styles`.
- `packages/shared` — Zod schemas + inferred domain types (one Employee definition across the wire).
- `packages/tsconfig`, `packages/eslint-config` — shared strict TS bases and ESLint flat config.

Common commands (run from the repo root): `pnpm install`, `pnpm dev`, `pnpm test`, `pnpm lint`,
`pnpm typecheck`, `pnpm build`. See [README.md](README.md) for setup and per-app commands.

## Status

**Backend feature-complete** ([02-backend-implementation.md](docs/plans/02-backend-implementation.md),
all 9 phases): the data model + idempotent 10k seed, employee directory (paginate/search/filter/sort),
full CRUD, compensation analytics (avg **and** in-SQL median, distribution, per-currency), bulk
Excel/CSV import (per-row validation, no silent corruption) + filter-round-tripping export, the
single-user auth gate (JWT cookie *or* Bearer), hardening (helmet/CORS/rate-limit, env fail-fast,
graceful shutdown), and a hosted Swagger UI at `/docs` generated from the shared Zod schemas. All
layers tested (Vitest + Supertest); `pnpm test`/`lint`/`typecheck` green.

**Frontend feature-complete** ([03-frontend-implementation.md](docs/plans/03-frontend-implementation.md),
all 8 phases): a React 19 + React Router SPA with the auth gate (login + route protection), the
URL-synced employee directory (paginate/search/filter/sort), full CRUD with shared-schema validation
and mapped server errors, the per-currency analytics dashboard (avg + median + distribution via
Recharts, lazy-loaded), bulk import (per-row report) + filtered export, and an a11y/responsive polish
pass. Tested with Vitest + RTL + MSW and **Playwright E2E journeys against the seeded api+web stack**;
`pnpm test`/`test:e2e`/`lint`/`typecheck`/`build` green locally and in CI.

The product is now **end-to-end complete**. Remaining work is deployment/hosting (a separate plan).
Update this file as structure evolves.
