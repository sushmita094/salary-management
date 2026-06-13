# Frontend Implementation Plan — Directory, CRUD, Analytics, Import/Export, Auth UI

**Status:** Draft v1
**Last updated:** 2026-06-12
**Owner of this plan:** all React/UI feature work, after the scaffold ([01-project-setup.md](01-project-setup.md))
and consuming the backend built in [02-backend-implementation.md](02-backend-implementation.md).

This plan describes how we build the **complete frontend** for the ACME Salary Management System on
top of the existing `apps/web` scaffold. It implements the user-facing scope in
[../requirements.md](../requirements.md) (§5.1–§5.6) against the REST API in
[02-backend-implementation.md](02-backend-implementation.md) (§5), and follows the frontend
architecture in [../tech-stack.md](../tech-stack.md) (§4).

The single persona is the **HR Manager** (requirements §3): one trusted user who must _find_ any
employee in seconds, _maintain_ records confidently, and _answer_ compensation questions without
spreadsheets. The UI is a single-user authenticated **dashboard/SPA** — no SEO, SSR, or
multi-role surfaces (tech-stack §4).

This plan does **not** build new backend endpoints; it consumes the ones already shipped. Where a
gap is found, it is noted as a backend change, not silently worked around in the client.

---

## 1. Where we start (the scaffold we build on)

Already in place from [01-project-setup.md](01-project-setup.md) (web phase) and proven against the API:

- **React 19 + Vite + TypeScript** SPA under [apps/web](../../apps/web), strict TS, ESLint flat config.
- **Tailwind v4** (CSS-first, `@import "tailwindcss"`) wired through `@tailwindcss/vite`.
- **TanStack Query** provider mounted in [main.tsx](../../apps/web/src/main.tsx).
- A minimal **typed fetch helper** ([api/client.ts](../../apps/web/src/api/client.ts), `apiGet<T>`) and a
  **feature pattern** (`features/health/useHealth` → a `useQuery` hook) proving the api↔web path.
- **Shared wire types** from `@acme/shared` consumed in the client (e.g. [lib/format.ts](../../apps/web/src/lib/format.ts)
  `formatSalary` uses the shared `Employee` type) — _one definition across the wire_.
- **Dev proxy**: Vite forwards `/api/*` to the Express server ([vite.config.ts](../../apps/web/vite.config.ts)).
- **Feature-first `src/`**: `components`, `features`, `pages`, `hooks`, `api`, `lib`, `types`, `styles`.
- **RTL + Vitest** (component/unit) and **Playwright** (E2E) configured with one green test each.

The scaffold's `App.tsx` is a placeholder health badge; Phase 1 replaces it with the router + app shell.

Each phase below is a small, independently committable PR (per the working agreement on incremental
commits) and is built **test-first** (TDD per the JD): write the failing test, make it pass, refactor.

---

## 2. Cross-cutting decisions (settled once, applied everywhere)

These hold across all phases so individual phases don't re-litigate them.

### 2.1 Routing & app shell

- A client router (**React Router**) drives the SPA: a persistent **app shell** (header with app name
  - current user + sign-out; primary nav: Directory / Analytics / Import-Export) wraps the routed
    pages. The login route renders outside the shell.
- Routes are lazy-loaded per feature where it keeps the initial bundle lean; the shell stays eager.

### 2.2 Typed API client (one place, envelope-aware)

- Extend [api/client.ts](../../apps/web/src/api/client.ts) into a small typed client covering `GET/POST/PUT/DELETE`,
  JSON bodies, **`credentials: "include"`** (the session is an httpOnly cookie — backend §Phase 7),
  multipart upload (for import), and **blob** download (for export).
- It parses the backend's **`{ error: { code, message, details? } }`** envelope into a typed
  `ApiError` (the shared `ApiError` type), so components get structured errors (incl. field `details`
  for form validation), not raw strings.
- A **401** anywhere clears auth state and redirects to `/login` (central interceptor), so an expired
  session never strands the user on a broken page.
- Base URL comes from `import.meta.env` (dev: the `/api` proxy; prod: configured origin) so the client
  isn't hard-coded to localhost. CORS-with-credentials is already aligned on the backend (§Phase 8).

### 2.3 Server state — TanStack Query conventions

- All server data flows through TanStack Query; **no server state in React state/Context** except the
  auth session snapshot.
- A **query-key factory** (`keys.employees.list(query)`, `keys.employees.detail(id)`,
  `keys.analytics.summary()`, …) keeps keys consistent and makes invalidation precise.
- Lists use `placeholderData: keepPreviousData` so pagination/filtering doesn't flash empty.
- Mutations (create/update/delete/import) **invalidate** the relevant list/detail/analytics keys on
  success; optimistic updates only where they clearly help (e.g. delete), otherwise invalidate-and-refetch.

### 2.4 URL is the source of truth for directory state

- Directory `page`, `pageSize`, `search`, filters, `sort`, `order` live in the **URL query string**
  (mirroring `employeeQuerySchema`), so views are shareable/bookmarkable, back/forward works, and a
  refresh preserves state. The query hook derives its key from the URL.

### 2.5 Forms & validation (reuse the shared schemas)

- Forms use **React Hook Form** with a **Zod resolver** bound to the **shared** `createEmployeeSchema`
  / `updateEmployeeSchema` / `loginSchema` — _the same schemas the server validates with_, so client
  and server can't disagree on what's valid.
- Server-side failures still surface: a **400** maps its `details` onto the offending fields, and a
  **409** (duplicate email) maps to the email field — the client never assumes it caught everything.

### 2.6 Design system on Tailwind + headless primitives

- Reusable, in-house **Tailwind** components (`Button`, `Input`, `Select`, `Table`, `Card`, `Badge`,
  `Dialog`, `Toast`, `Pagination`, `Spinner/Skeleton`, `EmptyState`) live in `components/` with a
  small design-token set (spacing/colour/typography) for a consistent, data-dense HR UI (tech-stack §4).
- Accessible interaction primitives (dialog, dropdown/menu, combobox, tooltip) come from an **unstyled
  headless library** (Radix UI / Headless UI — already named in tech-stack §4); Tailwind owns all
  presentation. We don't adopt a heavyweight component library.

### 2.7 Money & currency presentation (no false cross-currency totals)

- All money is formatted in its **local currency** via the shared `formatSalary` helper (Intl).
- Because the backend reports analytics **per currency** (FX out of scope, requirements §6), the UI
  **never sums across currencies**: summary and breakdowns are grouped/selectable by currency, and any
  monetary figure always shows its currency. This is a hard rule, surfaced in the components.

### 2.8 Loading / empty / error conventions (requirements §5.6)

- Every async surface has three first-class states: **loading** (skeletons for tables/cards, not
  spinners-only), **empty** (a helpful `EmptyState` with the next action, e.g. "No employees match —
  clear filters" / "Import a spreadsheet to get started"), and **error** (inline, retryable; the
  envelope `message` shown, never a raw stack). The user always trusts what they see.

### 2.9 Testing strategy

- **Component/feature (Vitest + RTL + MSW)**: render features against **Mock Service Worker** handlers
  that return the real response envelopes/fixtures, asserting rendered states, interactions, and that
  the right requests fire. Covers loading/empty/error, pagination, filter→URL, form validation
  (client + mapped server errors), and chart/data rendering — no real network.
- **End-to-end (Playwright)** against the **running api+web stack** (seeded DB): the core journeys —
  sign in → search/filter the directory → open a detail → create/edit/delete → read the analytics
  dashboard → import a file (see the per-row report) → export. These prove the wiring the unit tests mock.
- Accessibility assertions (roles, labels, focus) ride along in RTL; a smoke a11y pass in Playwright.

### 2.10 New dependencies (update tech-stack.md first)

Per the working agreement, [../tech-stack.md](../tech-stack.md) is updated _first_ (with a one-line
"why") before any of these is added. Already named there: **TanStack Query**, **Tailwind**,
**Radix/Headless UI**, **Recharts**, **RTL**, **Playwright**. **New to record:** the **router**
(`react-router-dom`), **forms** (`react-hook-form` + `@hookform/resolvers`), **API mocking for tests**
(`msw`), and small UI utilities if used (`clsx`/`tailwind-merge` for class composition, an icon set).
None pulls in excluded scope (payroll/FX/roles).

---

## 3. Phases

### Phase 1 — Foundation: app shell, routing & the data layer

**Goal:** a navigable, themed shell with the plumbing every feature reuses — before any feature exists.

- Replace the placeholder `App.tsx` with the **router** and an **app shell** layout (header, primary
  nav, content outlet, a global toast region). Add a **404 / not-found** route.
- Harden the **API client** (§2.2): verbs, credentials, error-envelope parsing → `ApiError`, multipart
  - blob support, the 401→login interceptor, env-driven base URL.
- Configure the **QueryClient** (sane defaults: retry/stale times, `keepPreviousData` default for
  lists) and the **query-key factory** (§2.3).
- Stand up the **design-system primitives** (§2.6) needed early (`Button`, `Input`, `Select`, `Card`,
  `Spinner/Skeleton`, `EmptyState`, `Toast`, `Dialog`) with the token set, and global styles.
- **Tests:** client unwraps success + error envelopes and throws typed `ApiError`; 401 triggers the
  redirect; the shell renders nav and an `<Outlet/>`; primitives render/agree with their props.
- **Done when:** the app boots into the shell, routes resolve, and the client/query/design foundations
  are in place and tested (no feature data yet).

### Phase 2 — Authentication UI & route protection

**Goal:** the HR Manager signs in before any data is reachable (requirements §5.5).

- **Auth context/provider:** bootstraps session on load via `GET /auth/me` (cookie-based), exposes
  `user`, `login`, `logout`, and `isResolving`. No token kept in JS — the httpOnly cookie is the session.
- **Login page:** RHF + shared `loginSchema`; `POST /auth/login` (credentials included). On success,
  hydrate auth + redirect to the originally requested route (or Directory). Sad paths: 401 → inline
  "invalid email or password", 429 (rate-limited) → friendly message, field errors for 400.
- **Protected-route guard:** wraps all app routes; unauthenticated → `/login` (preserving the intended
  destination). The login route is public.
- **Sign-out:** `POST /auth/logout` clears the cookie + auth state → `/login`; the central 401
  interceptor (§2.2) covers expiry mid-session.
- **Tests (RTL+MSW):** login happy path redirects; bad credentials show the inline error; guard
  redirects when unauthenticated and renders when authenticated; logout returns to login.
- **Done when:** no app route is reachable without a session; login/logout work; refresh rehydrates.

### Phase 3 — Employee directory (list, search, filter, sort, paginate)

**Goal:** find any employee in seconds at 10k scale (requirements §5.1).

- **Directory page** with a reusable **data table**: server-driven **pagination** (page/size controls
  reflecting `{ data, pagination }`), **sortable** column headers (whitelisted `sort`+`order`), and a
  **filter bar** — debounced `search` (name/email) and selects for `country`/`department`/`jobTitle`/`level`.
- **URL-synced query state** (§2.4): every control writes to the URL; the list query reads from it
  (`keepPreviousData` so paging/filtering doesn't flash). Salaries shown in local currency (§2.7).
- Filter option sources: a small set of known dimensions (or a lightweight distinct-values source); if
  a values endpoint is wanted, note it as a backend follow-up rather than scanning 10k client-side.
- First-class **loading (skeleton rows)**, **empty** ("no matches — clear filters"), and **error**
  states; rows link to the detail route.
- **Tests (RTL+MSW):** default render + pagination; search/filter/sort update the URL and refetch;
  empty + error states; an assertion that the client never fetches the whole table (always paginated).
- **Done when:** the directory paginates/searches/filters/sorts against the API, state lives in the
  URL, and it stays responsive on the seeded 10k dataset.

### Phase 4 — Employee detail & CRUD

**Goal:** maintain the data confidently (requirements §5.2).

- **Detail view** (`GET /employees/:id`): full compensation in local currency; **404 → not-found**
  state; actions to Edit / Delete.
- **Create** and **Edit** forms (RHF + shared `createEmployeeSchema`/`updateEmployeeSchema`):
  `POST` / `PUT`; inline client validation, plus **mapped server errors** (400 `details` → fields,
  **409 duplicate email** → email field). Success → toast + navigate + **invalidate** list/detail
  (and analytics) keys.
- **Delete** via an accessible **confirm dialog** → `DELETE /employees/:id` (204); optimistic removal
  with rollback on failure, or invalidate-and-refetch; toast on completion.
- **Tests (RTL+MSW):** create/edit happy paths (correct request body, success nav + invalidation);
  client validation blocks bad input; server 400/409 map onto fields; delete confirm + list refresh;
  detail 404.
- **Done when:** full CRUD round-trips through the UI with correct validation, error mapping, and
  cache invalidation.

### Phase 5 — Compensation analytics dashboard

**Goal:** answer "how does the org pay people?" at a glance — **median emphasised** (requirements §5.3).

- **Summary** (`GET /analytics/summary`): headcount cards + **per-currency** rollups (total spend,
  average, **median**, min/max) — each card labelled with its currency; **never a cross-currency total** (§2.7).
- **By-dimension comparison** (`GET /analytics/by/:dimension`): a dimension toggle
  (department/country/jobTitle/level) and a **currency selector**, rendered as side-by-side
  **bar charts** (avg vs median per segment) via **Recharts**; median called out as much as average
  (requirements note). Tables back the charts for exact figures + accessibility.
- **Distribution** (`GET /analytics/distribution`): a **histogram** of salary bands for a selected
  currency (and optional segment), with a band-count control, to surface spread/outliers.
- **Loading skeletons** for cards/charts; **empty** (no data / unknown currency) and **error** states.
- **Tests (RTL+MSW):** cards render per-currency figures (incl. median); switching dimension/currency
  refetches and re-renders; the histogram maps buckets to bars; a guard test that no UI element sums
  across currencies; loading/empty/error.
- **Done when:** the dashboard presents accurate, currency-explicit averages **and** medians,
  segment comparisons, and a distribution view — responsive on the full dataset.

### Phase 6 — Bulk import & export UI

**Goal:** move spreadsheets in and out without editing records one by one (requirements §5.4).

- **Export:** a control on the directory/import-export surface that calls `GET /export` with the
  **active filters** and a **format** choice (CSV / XLSX), triggering a browser **download** (blob).
  The export reflects exactly the filtered view (backend reuses the directory query).
- **Import:** a dialog/page to **upload** a `.csv`/`.xlsx` (`POST /import`, multipart). On response,
  render the **summary** (`inserted` / `updated` / `failed`) and a **per-row error table**
  (`rowErrors`: row number + messages) so bad rows are visible and **nothing silently corrupts data**
  (requirements §5.4). Document the expected columns inline (link to the README's column table). On
  success, **invalidate** the directory + analytics so the new data shows immediately.
- Handle header-mismatch (400) and oversized/invalid files with clear, recoverable messaging.
- **Tests (RTL+MSW):** export issues the request with current filters + chosen format and downloads;
  import shows the summary + per-row errors for a mixed file; success refreshes the directory; header
  mismatch surfaces a clear error.
- **Done when:** the HR Manager can export the current view and import a spreadsheet with clear,
  per-row validation feedback, and the directory/analytics reflect imported changes.

### Phase 7 — UX polish, accessibility & responsiveness

**Goal:** a clean, trustworthy, daily-use HR UI (requirements §5.6).

- **Accessibility:** keyboard navigation throughout, focus management/trapping in dialogs, labelled
  controls, ARIA on the table/charts, visible focus, sufficient contrast. Lean on the headless
  primitives' a11y (§2.6).
- **Responsiveness:** layouts work from laptop down to tablet/narrow widths (table → sensible
  responsive treatment; nav collapses); the dashboard reflows.
- **Consistency pass:** unify loading/empty/error treatments, toasts, and form affordances across
  features; finalise the design tokens; polish the not-found page and sign-in.
- **Tests:** RTL a11y assertions (roles/labels/focus) on dialogs, table, and forms; a Playwright
  smoke check at a narrow viewport.
- **Done when:** the app is keyboard-accessible, responsive, and visually consistent, with trustworthy
  states everywhere.

### Phase 8 — Test coverage & end-to-end journeys

**Goal:** prove the whole thing works together, not just in mocks.

- Fill out **RTL+MSW** coverage to the per-phase bars above (every feature's states + interactions).
- **Playwright E2E** against the running **api + web** stack (seeded DB): the full journeys from §2.9 —
  sign in → directory search/filter/sort/paginate → detail → create/edit/delete → analytics → import
  (with per-row report) → export. Include an auth-guard journey (deep link while logged out → login →
  land on the target).
- Wire E2E into **CI** (the workflow already has a Playwright job); keep `typecheck`/`lint`/`test`
  green across workspaces.
- **Done when:** unit + E2E suites are green locally and in CI and cover every feature and the core
  journeys end to end.

---

## 4. Screen / route map (target)

| Route                 | Auth | Screen / purpose                                                              |
| --------------------- | ---- | ----------------------------------------------------------------------------- |
| `/login`              | no   | Sign-in form (outside the app shell).                                         |
| `/`                   | yes  | Redirect → `/employees` (Directory as home).                                  |
| `/employees`          | yes  | Directory: paginated table, search/filter/sort, export/import entry points.   |
| `/employees/new`      | yes  | Create employee form.                                                         |
| `/employees/:id`      | yes  | Employee detail + Edit/Delete actions.                                        |
| `/employees/:id/edit` | yes  | Edit employee form.                                                           |
| `/analytics`          | yes  | Compensation dashboard: summary, by-dimension comparison, distribution.       |
| `/import-export`      | yes  | Bulk import dialog/page + export controls (may also surface on `/employees`). |
| `*`                   | —    | Not-found page.                                                               |

---

## 5. Backend endpoints consumed (per feature)

| Feature (phase)   | Endpoints                                                                               |
| ----------------- | --------------------------------------------------------------------------------------- |
| Auth (2)          | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`                                 |
| Directory (3)     | `GET /employees` (page/search/filter/sort)                                              |
| CRUD (4)          | `GET /employees/:id`, `POST /employees`, `PUT /employees/:id`, `DELETE /employees/:id`  |
| Analytics (5)     | `GET /analytics/summary`, `GET /analytics/by/:dimension`, `GET /analytics/distribution` |
| Import/Export (6) | `POST /import` (multipart), `GET /export` (filters + `format`)                          |
| Reference         | `GET /openapi.json` / `/docs` for contract reference (not called at runtime)            |

All request/response shapes come from `@acme/shared` (the wire types/schemas the backend already
exports) — no client-side duplicate type definitions.

---

## 6. New dependencies (update tech-stack.md before adding)

Recorded first in [../tech-stack.md](../tech-stack.md) with a one-line "why" each:

- **`react-router-dom`** — client routing for the SPA's pages/guards.
- **`react-hook-form`** + **`@hookform/resolvers`** — performant forms bound to the shared Zod schemas.
- **`msw`** — request mocking so component/feature tests run against realistic response envelopes.
- _(if used)_ **`clsx`/`tailwind-merge`** — ergonomic conditional Tailwind classes; an **icon set**.

Already listed in tech-stack (no new entry needed): TanStack Query, Tailwind, Radix/Headless UI,
Recharts, React Testing Library, Playwright.

---

## 7. Risks & notes

- **Cookie auth in the SPA.** The session is an httpOnly, sameSite cookie; the client must send
  `credentials: "include"` and the API's CORS must allow the web origin with credentials (backend
  §Phase 8 already does). In dev the Vite proxy makes it same-origin; document the prod origin/env.
- **Filter option sources.** Populating country/department/level selects shouldn't scan 10k rows in
  the browser; use a known set or a small distinct-values source. If an endpoint is preferable, raise
  it as a backend follow-up rather than working around it client-side.
- **Currency, not FX.** The UI must never imply a cross-currency total (requirements §6); every money
  figure carries its currency and analytics are grouped/selected per currency (§2.7).
- **10k responsiveness.** The directory relies on **server** pagination (never fetch all); list
  virtualization is unnecessary while pages stay bounded — revisit only if a page size grows large.
- **Schema reuse vs. wire dates.** Shared `employeeSchema` carries `createdAt`/`updatedAt` as ISO
  strings; forms use the **create/update** schemas (which omit server fields), so the client never has
  to invent timestamps.
- **Form/server validation drift.** Mitigated by binding forms to the _shared_ Zod schemas and still
  mapping server `details`/409 onto fields — the client treats the server as the final authority.
- **Bundle size.** Lazy-load feature routes and the chart library so the login/initial shell stays light.

---

## 8. Definition of Done (whole plan)

- Sign-in gates the whole app; refresh rehydrates the session; logout and session-expiry both return
  to login cleanly.
- The directory searches/filters/sorts/paginates against the API with state in the URL, responsive on
  the seeded 10k dataset, with first-class loading/empty/error states.
- Full CRUD works through the UI with shared-schema validation, mapped server errors (400/409), and
  correct cache invalidation.
- The analytics dashboard shows accurate, **currency-explicit** averages **and medians**, segment
  comparisons, and a distribution view — never summing across currencies.
- Import shows per-row validation feedback (no silent corruption) and refreshes the data; export
  honours the active filters and format and downloads.
- The UI is accessible (keyboard, focus, ARIA) and responsive, with consistent states throughout.
- `pnpm test` (RTL+MSW), `pnpm test:e2e` (Playwright journeys), `pnpm lint`, `pnpm typecheck`, and
  `pnpm build` are green locally and in CI.
- `docs/tech-stack.md` records any new deps; `CLAUDE.md` **Status** is updated to reflect a working
  end-to-end product; this work's prompts are appended to `PROMPTS.md`.

---

## 9. Out of scope for this plan (handled elsewhere)

- All backend/API work — already shipped in [02-backend-implementation.md](02-backend-implementation.md);
  gaps are raised as backend changes, not client workarounds.
- Production deployment / hosting of the SPA and API — a separate deployment plan.
- Excluded product scope (payroll, FX normalisation, roles/permissions, approval workflows, audit
  history, employee self-service) — see requirements §6; not built here.
