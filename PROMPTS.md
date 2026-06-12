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
