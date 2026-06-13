# ACME Salary Management System

A web-based tool that replaces spreadsheets for managing compensation across ~10,000 employees in
multiple countries, for the HR Manager persona. See [docs/requirements.md](docs/requirements.md) for
scope and [docs/tech-stack.md](docs/tech-stack.md) for the technology choices.

This repository is a single **pnpm-workspaces monorepo**. Runnable apps live in `apps/`; shared
libraries live in `packages/`.

## Layout

```
apps/
  api/        Express 5 + Prisma 7 (SQLite) backend
  web/        React 19 + Vite + Tailwind v4 SPA
packages/
  shared/         Zod schemas + inferred domain types (one Employee definition)
  tsconfig/       Shared strict TypeScript bases
  eslint-config/  Shared ESLint flat config + Prettier preset
docs/         Requirements, assessment, tech stack, and plans
```

## Prerequisites

- **Node.js 22 LTS** — the version is pinned in [.nvmrc](.nvmrc). With nvm: `nvm install && nvm use`.
  (Prisma 7 does not support Node 25.)
- **pnpm** — `corepack enable` (ships with Node), or `npm install -g pnpm`.

## Setup

```bash
pnpm install                 # installs deps; generates the Prisma client (postinstall)
cp apps/api/.env.example apps/api/.env
pnpm --filter api prisma:migrate   # creates apps/api/prisma/dev.db and applies migrations
pnpm --filter api seed             # populates ~10,000 realistic employees (deterministic; runs in seconds)
```

The seed is **idempotent and deterministic** — it wipes and re-inserts the same ~10,000 employees
(fixed Faker seed) spread across 12 countries with their local currencies, 10 departments, and 8
seniority levels, with a log-normal salary distribution per country/level. Re-running it always
leaves exactly 10,000 rows.

## Running

```bash
pnpm dev                     # api + web (+ shared in watch) together
pnpm --filter api dev        # API only  → http://localhost:3000
pnpm --filter web dev        # web only  → http://localhost:5173 (proxies /api to the API)
```

## Testing & quality

```bash
pnpm test                    # unit/integration across all workspaces (Vitest)
pnpm typecheck               # tsc --noEmit everywhere
pnpm lint                    # ESLint everywhere
pnpm format                  # Prettier write

# End-to-end (first run downloads the browser):
pnpm --filter web exec playwright install chromium
pnpm test:e2e
```

## Bulk import / export format

`POST /import` (multipart, field `file`) and `GET /export` share one CSV/Excel layout, so an export
re-imports unchanged. The first row must be these headers, in any order:

```
name,email,country,department,jobTitle,level,salaryAmount,salaryCurrency
```

- **email** is the key: an import **upserts by email** (existing → updated, new → inserted).
- **salaryAmount** is a number in the employee's local currency; **salaryCurrency** is a 3-letter
  ISO 4217 code. No FX conversion happens.
- Each row is validated independently — **bad rows are reported, not fatal** (the response lists
  `{ inserted, updated, failed, rowErrors[] }`); a header mismatch fails the whole upload with 400.
- `GET /export?format=xlsx` returns an `.xlsx` workbook; the default is CSV. Export honours the same
  `search`/filter/`sort` params as the directory, so the file reflects the filtered view.

## Build

```bash
pnpm build                   # builds shared → api → web in dependency order
```

## Root scripts

| Script           | Effect                                                    |
| ---------------- | --------------------------------------------------------- |
| `pnpm dev`       | Run api + web dev servers (and shared in watch).          |
| `pnpm build`     | Build every workspace in topological order.               |
| `pnpm test`      | Run all unit/integration tests.                           |
| `pnpm test:e2e`  | Run the Playwright E2E suite (web).                       |
| `pnpm lint`      | ESLint across all workspaces.                             |
| `pnpm typecheck` | `tsc --noEmit` across all workspaces.                     |
| `pnpm format`    | Prettier write.                                           |

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs lint, typecheck, test, and build on
every push to `main` and on PRs, plus the Playwright smoke in a separate job.
