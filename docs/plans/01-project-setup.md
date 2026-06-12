# Project Setup Plan — Monorepo Scaffold

**Status:** Draft v1
**Last updated:** 2026-06-12
**Owner of this plan:** initial scaffolding work, before any feature code lands.

This plan describes how we stand up the **repository skeleton, tooling, and workspaces** for the
ACME Salary Management System. It implements the choices already locked in
[../tech-stack.md](../tech-stack.md) and the scope in [../requirements.md](../requirements.md).
It does **not** design features (directory, analytics, import/export) — those follow in later plans.

---

## 1. Constraints (the rules this plan obeys)

- **Single monorepo.** One repository holds backend, frontend, shared code, and tooling.
- **All applications live in `apps/`.** Each deployable/runnable app is its own workspace under `apps/`.
- **Latest stable versions everywhere.** Install the current stable release of every tool; pin the
  resolved versions in `package.json` + the lockfile so the build is reproducible.
- **Stick to the stack.** Only the technologies in [../tech-stack.md](../tech-stack.md). The one
  addition this plan introduces is *monorepo tooling* (package manager + workspaces), which is not a
  product library — see §3. That doc gets a short "Monorepo & tooling" note as part of this work.

---

## 2. Target Repository Layout

```
acme-salary-management/
├─ apps/
│  ├─ api/                    # Express + Prisma backend (the only server)
│  │  ├─ src/
│  │  │  ├─ routes/           # Express routers — HTTP wiring only (path → handler)
│  │  │  ├─ controllers/      # request/response handling, calls services
│  │  │  ├─ services/         # business/domain logic (aggregation, import rules)
│  │  │  ├─ repositories/     # data access (Prisma queries, raw SQL for median)
│  │  │  ├─ middleware/       # auth gate, error handler, request validation
│  │  │  ├─ db/               # Prisma client singleton + connection helpers
│  │  │  ├─ config/           # env loading, app config
│  │  │  ├─ utils/            # small shared helpers
│  │  │  ├─ app.ts            # builds the Express app (no listen) — testable
│  │  │  └─ index.ts          # entrypoint: starts the server
│  │  ├─ prisma/              # schema.prisma, migrations, seed.ts
│  │  ├─ tests/               # Vitest + Supertest integration tests
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  └─ vitest.config.ts
│  └─ web/                    # React + Vite + Tailwind frontend (SPA)
│     ├─ src/
│     │  ├─ components/       # reusable presentational UI (table, modal, inputs)
│     │  ├─ features/         # feature modules (directory, employee, analytics)
│     │  ├─ pages/            # route-level page components
│     │  ├─ hooks/            # custom hooks (incl. TanStack Query hooks)
│     │  ├─ api/              # query client + typed fetchers to the backend
│     │  ├─ lib/              # framework-agnostic helpers (formatting, etc.)
│     │  ├─ types/            # web-only types (shared domain types come from packages/shared)
│     │  ├─ styles/           # Tailwind entry CSS (@import "tailwindcss") + globals
│     │  ├─ App.tsx
│     │  └─ main.tsx          # entrypoint: mounts React + Query provider
│     ├─ tests/               # RTL component tests
│     ├─ e2e/                 # Playwright specs
│     ├─ index.html
│     ├─ package.json
│     ├─ tsconfig.json
│     ├─ vite.config.ts
│     └─ playwright.config.ts
├─ packages/
│  ├─ shared/                 # Zod schemas + inferred domain types (Employee, etc.)
│  │  ├─ src/
│  │  │  ├─ schemas/          # Zod schemas (employee, pagination, import rows)
│  │  │  ├─ types/            # types inferred from schemas, re-exported
│  │  │  └─ index.ts          # public barrel export for the package
│  │  └─ package.json
│  ├─ tsconfig/               # shared tsconfig base(s) extended by every workspace
│  └─ eslint-config/          # shared ESLint flat config + Prettier preset
├─ docs/                      # existing: requirements, assessment, tech-stack, plans/
├─ .github/
│  └─ workflows/
│     └─ ci.yml               # lint + typecheck + test on every push/PR
├─ .nvmrc                     # pins the Node version
├─ .gitignore
├─ .editorconfig
├─ package.json               # root: workspaces + orchestration scripts only
├─ pnpm-workspace.yaml        # workspace globs
├─ tsconfig.base.json         # solution-style references entry (optional)
├─ PROMPTS.md                 # existing
└─ CLAUDE.md                  # existing
```

**Why `packages/` exists alongside `apps/`.** Apps are runnable units (per your constraint, they all
live in `apps/`). `packages/` holds **non-app shared libraries** — code imported by apps but never
run on its own. The most important is `packages/shared`, which realises the tech-stack goal of *"one
definition of an Employee across the wire"*: Zod schemas live there and both `api` and `web` import
them. Keeping these out of `apps/` keeps the "apps = deployables" rule clean.

> If we want zero shared-library ceremony to start, `packages/shared` is the only package we
> strictly need; `tsconfig/` and `eslint-config/` can begin as root files and graduate to packages
> later. They're shown above as the end state.

### Source-folder conventions (separation by concern)

Each app's `src/` is split into **single-responsibility folders** rather than one flat dump, so the
codebase reads by layer and stays testable. The folders are created as part of scaffolding (each
with a placeholder so it's committable), even before they're filled.

**`apps/api/src` — layered, one direction of dependency:**

```
routes → controllers → services → repositories → db
```

- **`routes/`** — only HTTP wiring: map a path/method to a controller. No logic.
- **`controllers/`** — translate HTTP ↔ domain: read validated input, call a service, shape the response.
- **`services/`** — the business logic (salary aggregation, median orchestration, import rules).
  Pure and unit-testable; knows nothing about Express.
- **`repositories/`** — all data access lives here (Prisma queries, and the raw-SQL median/percentile
  queries from the tech-stack doc). Swappable without touching services.
- **`middleware/`**, **`db/`**, **`config/`**, **`utils/`** — cross-cutting support.

A request flows in one direction; lower layers never import upper ones. This is what keeps the
median/aggregate SQL isolated in `repositories/` and the domain math unit-testable in `services/`.

**`apps/web/src` — by UI concern, feature-first:**

- **`components/`** — reusable, presentational, no data fetching (built in-house on Tailwind).
- **`features/`** — a folder per feature area (`directory`, `employee`, `analytics`), each colocating
  its components, hooks, and queries.
- **`pages/`** — route-level composition.
- **`hooks/`** + **`api/`** — TanStack Query hooks and typed fetchers; keeps fetch plumbing out of components.
- **`lib/`**, **`types/`**, **`styles/`** — helpers, web-only types, Tailwind entry CSS.

Shared domain types/schemas are **not** redefined here — they're imported from `packages/shared`.

---

## 3. Tooling Decisions

### Package manager & workspaces — **pnpm workspaces**

- **Recommended:** pnpm, enabled via **Corepack** (ships with Node, so it's effectively zero-install:
  `corepack enable`). pnpm is the de-facto standard for JS monorepos, has first-class
  `workspace:*` linking for `packages/shared`, and a strict, content-addressed store.
- **Fallback:** npm workspaces (built into npm, nothing extra to install) if we want to avoid any new
  tool at all. The layout and scripts in this plan work unchanged under npm workspaces; only the
  lockfile and `workspace:` protocol syntax differ.
- **Task orchestration:** start with plain root `package.json` scripts that fan out with
  `pnpm -r` (recursive) / `pnpm --filter`. **Turborepo is deliberately deferred** — with two apps and
  one shared package it's overhead; add it only if build/test caching becomes worth it.

**Action:** add a short "Monorepo & tooling" subsection to [../tech-stack.md](../tech-stack.md)
recording pnpm + workspaces and the Turborepo deferral, so we honour the "update the doc before
adding tooling" working agreement.

### Language baseline — TypeScript strict, one base config

- `packages/tsconfig` (or root `tsconfig.base.json`) holds the strict base: `strict: true`,
  `noUncheckedIndexedAccess`, `moduleResolution: "bundler"` (web) / `"nodenext"` (api as appropriate),
  `esModuleInterop`, `skipLibCheck`. Every workspace `tsconfig.json` extends it and only sets what's
  local (paths, lib, jsx).

### Lint & format — ESLint (flat config) + Prettier

- Single shared flat config in `packages/eslint-config`, extended by each workspace. Prettier for
  formatting (no formatting rules in ESLint — let Prettier own that). One `format`/`lint` script at root.

### Node version — pinned via `.nvmrc`

- Pin to the **current active LTS** (Node 22 LTS, or Node 24 LTS if adopted — confirm at install time
  and write the exact line into `.nvmrc`). CI uses the same version.

---

## 4. Versions — "latest stable", captured reproducibly

Install the **latest stable** release of each tool at scaffold time, then commit the lockfile so the
versions are frozen. Expected major versions at the time of writing (verify the actual resolved
version during install — do not assume):

| Tool                | Expected major | Setup note                                                                 |
| ------------------- | -------------- | -------------------------------------------------------------------------- |
| Node.js             | 22 / 24 LTS    | Pin in `.nvmrc`; match in CI.                                              |
| TypeScript          | 5.x            | Strict base config shared across workspaces.                              |
| Express             | 5.x            | Express **5** is the stable line — use it, not legacy 4.                  |
| Prisma              | 6.x            | `prisma` + `@prisma/client`; SQLite datasource.                           |
| better-sqlite3      | latest         | Native module — see §7 install caveat.                                    |
| React               | 19.x           | New JSX transform; React 19 APIs.                                          |
| Vite                | latest (6/7)   | React + TS template as the starting point.                               |
| Tailwind CSS        | **4.x**        | v4 is **CSS-first**: `@import "tailwindcss"` + `@theme` in CSS, Vite plugin — there is no `tailwind.config.js` by default. Follow v4 docs, not v3 muscle memory. |
| TanStack Query      | 5.x            | React adapter.                                                            |
| Zod                 | latest (3/4)   | Lives in `packages/shared`.                                              |
| Vitest              | latest         | Shared config patterns across api/web.                                   |
| Supertest           | latest         | API integration tests.                                                   |
| React Testing Lib   | latest         | Component tests under `apps/web`.                                        |
| Playwright          | latest         | E2E under `apps/web/e2e`; `npx playwright install` for browsers.         |
| ESLint              | 9.x            | **Flat config** (`eslint.config.js`).                                    |
| Prettier            | 3.x            | Formatting only.                                                          |

> Tailwind v4 and ESLint flat config are the two places where "latest" meaningfully changes the setup
> shape from older tutorials — call these out to whoever scaffolds so they don't reach for v3/legacy patterns.

---

## 5. Setup Phases (ordered, each independently committable)

Per the working agreement on incremental commits, each phase is a small PR-sized commit.

### Phase 0 — Root workspace skeleton
- `corepack enable` and set `"packageManager"` in root `package.json`.
- Root `package.json` (`"private": true`, workspaces config), `pnpm-workspace.yaml` with
  `apps/*` and `packages/*` globs.
- `.nvmrc`, `.gitignore` (node_modules, dist, `*.db`, `.env`, coverage, playwright artifacts),
  `.editorconfig`.
- Root scripts that fan out: `dev`, `build`, `test`, `lint`, `typecheck`, `format`.
- **Done when:** `pnpm install` succeeds on an empty workspace tree.

### Phase 1 — Shared config packages
- `packages/tsconfig` (strict base) and `packages/eslint-config` (flat ESLint + Prettier preset).
- Root `lint`/`format`/`typecheck` wired to them.
- **Done when:** `pnpm lint` and `pnpm typecheck` run clean against the empty tree.

### Phase 2 — `packages/shared`
- TS library with `src/schemas/`, `src/types/`, and an `index.ts` barrel (start with a minimal
  `Employee` schema to prove the wiring; full schema is a feature-plan concern).
- Exported via package `exports`; consumed by apps with `workspace:*`.
- **Done when:** a trivial import of a shared type from another workspace typechecks.

### Phase 3 — `apps/api` (backend skeleton)
- Create the layered `src/` folders (`routes/`, `controllers/`, `services/`, `repositories/`,
  `middleware/`, `db/`, `config/`, `utils/`), each with a placeholder so the structure commits.
- Express 5 app with a `/health` route, split as `app.ts` (build) + `index.ts` (listen), TS build,
  `tsconfig` extending the base.
- Prisma initialised with a **SQLite** datasource (`apps/api/prisma/schema.prisma`), `.env.example`
  with `DATABASE_URL`, an empty initial migration, and a stub `seed.ts` (full 10k Faker seed is a
  later plan).
- Vitest + Supertest set up; one passing integration test hitting `/health` against an in-memory DB.
- **Done when:** `pnpm --filter api dev` serves `/health`, and `pnpm --filter api test` is green.

### Phase 4 — `apps/web` (frontend skeleton)
- Create the `src/` folders (`components/`, `features/`, `pages/`, `hooks/`, `api/`, `lib/`,
  `types/`, `styles/`), each with a placeholder so the structure commits.
- Vite + React + TS app; Tailwind v4 wired via its Vite plugin and a single CSS entry under
  `styles/` (`@import "tailwindcss"`).
- TanStack Query provider mounted at the root; a placeholder page that fetches `/health` to prove the
  api↔web path and shared types end to end.
- Vitest + React Testing Library with one passing component test; Playwright configured with one
  smoke E2E (`app loads`).
- Dev proxy (Vite) to the api during local dev.
- **Done when:** `pnpm --filter web dev` renders the page, component test and Playwright smoke pass.

### Phase 5 — CI
- `.github/workflows/ci.yml`: checkout → setup Node (from `.nvmrc`) + pnpm → `pnpm install --frozen-lockfile`
  → `lint` → `typecheck` → `test` (+ Playwright browsers install for the E2E job). Run on push and PR.
- **Done when:** CI is green on the scaffold branch.

### Phase 6 — Developer experience & docs
- Root `README` section: prerequisites, `corepack enable`, `pnpm install`, how to run each app, how to
  run tests. (Or fold into existing docs.)
- Update [../tech-stack.md](../tech-stack.md) with the "Monorepo & tooling" note (§3).
- Update [../../CLAUDE.md](../../CLAUDE.md) **Status** section to reflect the now-scaffolded structure.
- Append this work's prompt to [../../PROMPTS.md](../../PROMPTS.md).

---

## 6. Root Scripts (intended surface)

| Script             | Effect                                                            |
| ------------------ | ---------------------------------------------------------------- |
| `pnpm dev`         | Run api + web dev servers together (parallel).                  |
| `pnpm build`       | Build all workspaces (`shared` → `api` → `web`).                |
| `pnpm test`        | Run every workspace's unit/integration tests.                  |
| `pnpm test:e2e`    | Run Playwright E2E (web).                                       |
| `pnpm lint`        | ESLint across all workspaces.                                   |
| `pnpm typecheck`   | `tsc --noEmit` across all workspaces.                           |
| `pnpm format`      | Prettier write.                                                 |
| `pnpm --filter <w>`| Scope any of the above to one workspace.                       |

---

## 7. Risks & Notes

- **better-sqlite3 is a native module.** It compiles on install and must match the Node version/ABI —
  keep CI's Node identical to `.nvmrc`, and prebuilt binaries usually avoid a local toolchain. Flag if
  install needs build tools on a fresh machine.
- **Tailwind v4 ≠ v3 setup.** No `tailwind.config.js` by default; configuration is CSS-first via
  `@theme`. Use the official v4 + Vite guide.
- **ESLint 9 flat config** only — no `.eslintrc`. Ensure plugins used are flat-config compatible.
- **Express 5**, not 4 — async error handling and a few middleware behaviours differ; follow the v5 docs.
- **Deployment shape is unchanged** by the monorepo: the tech-stack target is *one* deployable where
  `apps/api` serves the built `apps/web` assets. The build step copies `web`'s `dist` into what the
  server serves; this is a build-wiring detail handled when we reach deployment, not in this scaffold.

---

## 8. Definition of Done (whole plan)

- `pnpm install` from a clean clone, then `pnpm dev`, brings up api + web locally.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, and the Playwright smoke all pass locally and in CI.
- A shared `Employee` type is imported by both `api` and `web`, proving the workspace wiring.
- `docs/tech-stack.md` and `CLAUDE.md` reflect the monorepo tooling and structure.

---

## 9. Out of Scope for This Plan (handled in later plans)

- Database schema design and the full 10,000-row Faker seed.
- API route implementations (directory, CRUD, analytics, import/export).
- UI feature work (directory table, filters, dashboard, charts).
- Authentication implementation.
- Production deployment pipeline and hosting target.
