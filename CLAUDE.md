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
- [PROMPTS.md](PROMPTS.md) — running log of prompts used with AI tools, kept as an artifact of the
  development process.

## Working Agreements

- **Save prompts as you go.** Append each user prompt to [PROMPTS.md](PROMPTS.md) so the AI-assisted
  development process is captured as a submission artifact.
- **Make incremental commits.** Commit history should show how the solution evolved — small,
  meaningful commits over one large drop.
- **Respect the scope.** [docs/requirements.md](docs/requirements.md) deliberately excludes payroll,
  auth, FX normalization, etc. Don't pull these in without a reason; note trade-offs if you do.
- **Design for scale.** The dataset is ~10,000 employees — lists must paginate and aggregates
  (including median) must stay responsive. Don't build against a toy dataset.

## Status

Early stage — requirements and assessment docs are in place; application code (backend, UI, seed
script, tests) is not yet built. Update this file as the stack and structure are decided.
