# apps/web — imperative rules

Next.js client of the {{TITRE}}. Read this file **entirely** before writing front code. Rules for what is shared with the API live in `packages/CLAUDE.md`; the API's own rules in `apps/api/CLAUDE.md`. The *why* with examples: `apps/web/docs/FRONTEND_GUIDELINES.md`.

## Golden rule — routes are thin, features are leaves

```
packages/contracts, packages/utils   ←  nothing
lib/                                 ←  packages/*
components/                          ←  lib/, packages/*
features/<module>/                   ←  components/, lib/, packages/*
features/<module>/                   ←  NEVER features/<other>/
app/                                 ←  features/, components/, lib/
```

- `app/` holds **route files only**: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`. **ZERO** business logic, **ZERO** component defined there. A `page.tsx` imports one feature component and renders it.
- A **feature** is a leaf: `features/<module>/{api,hooks,components,lib?}` + `index.ts` barrel. Nothing imports a feature except `app/`. A feature **NEVER** imports another feature. When `features/a` needs something from `features/b`, the shared code **moves**: a screen component → `components/shared/`; a data layer read by two features (API functions, query hooks) → `lib/<subject>/`; a type or schema → `packages/contracts`; a pure function → `packages/utils`. The criterion is the **number of readers**, not thematic proximity.
- `lib/` is the transverse floor: HTTP client, query provider, query keys, env, utils. It knows neither `features/` nor `components/`.
- All of this is **enforced by `eslint.rules.mjs`**: feature list read from disk, one block per feature, relative parent imports (`../`) forbidden everywhere — cross-folder imports use `@/…`, which says where a module comes from. The debt ratchet `DETTE_FEATURES` is empty on a new project and stays empty; `pnpm check:dette` refuses a stale entry.

## Living reference

`features/sante` is a labelled placeholder. **The first real feature becomes the living reference**: before creating another one, read it entirely and reproduce its shape (`api/` → `hooks/` → `components/`, barrel, tests). When it drifts from this file, fix one of the two.

## File naming

kebab-case files, PascalCase component exports. `features/<module>/api/<module>-api.ts`, `features/<module>/hooks/use-<module>.ts`, `features/<module>/components/<name>.tsx`, `features/<module>/index.ts`. Tests: `*.spec.ts` colocated.

## State — three kinds, three tools

- **Server state** (everything that comes from the API): TanStack Query. ~90 % of all state. **NEVER** copy server data into a `useState` or a store.
- **URL state** (filters, pagination, active tab): `nuqs`. It survives refresh and is shareable. **NEVER** a store for what belongs in the URL.
- **Local UI state** (open panel, form in progress): React itself — `useState`, React Hook Form, a context for one zone. No global client store: it will be added the day a real need exists (a persisted UI preference), by an ADR, not by habit.
- Query keys come from **`lib/query-keys.ts` only** — one namespace per subject with `all`, then `liste(filtres)` / `detail(id)`. A feature never writes a key array by hand. `query-keys.spec.ts` checks the invariants.

## API client and errors

- **One HTTP client**: `lib/api-client.ts` (Axios, `withCredentials`). **NEVER** `fetch` in a feature. In development the browser calls `/api` and Next rewrites to the API (same origin, so the httpOnly cookie is sent); elsewhere `NEXT_PUBLIC_API_URL`.
- Auth is a **cookie httpOnly** set by the API. The client **NEVER** sees, stores or forwards a token. **NEVER** `localStorage` for anything session-related. The single-flight refresh queue in `api-client.ts` is inert until the API exposes `/auth/refresh` (ticket).
- Every response is typed by a schema from `packages/contracts` and **parsed** at the edge (`Schema.parse(reponse.data)`) — a lying API fails loudly, at the boundary, not three components later. **NEVER** declare a response `interface` in `features/*/api/*`: it belongs to the contract.
- Errors: the API's error body is `ErreurDto` (`code` stable, `message` prescriptive). Read it through `lib/api-error.ts` only. Branch behaviour on `code`, show `message`.
<!-- ══ TENANT-B ══ -->
- **Tenant (`ARC-2`)**: the client **NEVER** sends a `tenantId` — not in a header, not in a body, not in a query string. The session carries it; the API resolves it. A tenant switch is an API call that re-issues the session, then `queryClient.clear()`. **NEVER** cache data across a tenant switch.
<!-- ══ /TENANT-B ══ -->
<!-- ══ ROLES-B ══ -->
- **Roles (`ARC-2`)**: the current role comes from `/auth/me` through `lib/auth/`, typed by `RoleSchema` from `packages/contracts`. Hiding a button by role is **presentation**: it improves the screen, it protects nothing. **NEVER** treat a role check in the client as authorisation — the API refuses, the client only avoids showing what would be refused.
<!-- ══ /ROLES-B ══ -->

## Mutations — feedback is global

- Every `useMutation` declares `meta.messageSucces` **or** `meta.silencieuse: true`. `meta.messageErreur` is the fallback when the API gives no message. The `MutationCache` in `lib/query-provider.tsx` shows the toast. **NEVER** call `toast()` in a component for a mutation result, **NEVER** an inline generic error message.
- After a mutation, invalidate by subject: `queryClient.invalidateQueries({ queryKey: queryKeys.<subject>.all })`.

## Forms

React Hook Form + `zodResolver(schema)` with the schema from `packages/contracts` — the **same** schema the API validates with. **NEVER** rewrite a validation rule in a component.

## Components and styling

- **shadcn/ui, vendored** in `components/ui/`: primitives live in the repo, built with `cva` + `cn`. **NEVER** install another component library.
- **Tailwind only**. Colours come from the tokens in `app/globals.css` (`@theme`, exposed as CSS variables so a theme can override at runtime). **NEVER** a hex value in a component, **NEVER** CSS-in-JS, **NEVER** inline `style` for colours.
- Accessibility is a gate: `jsx-a11y` rules are errors, every interactive element is reachable at the keyboard, every region has a name (`aria-labelledby`), every async status uses `role="status"`.

## Environment

- Public variables are read **literally** (`process.env.NEXT_PUBLIC_X`, never `process.env[name]`) and validated by Zod in `lib/env.ts` at module load — fail-fast. A new variable goes in `lib/env.ts` **and** `.env.example`, and in the hosting manifest the day one exists.
- No secret in the client. `NEXT_PUBLIC_*` is public by construction.

## Testing

- **Unit (Vitest, `environment: node`)**: pure logic of `lib/` and `features/*/lib/` — parsers, key factories, error readers. A test that touches the DOM fails immediately, on purpose: rendering is **not** unit-tested here.
- **Rendering and flows**: Playwright at the monorepo root, against a real API (ticket). Accessibility checked with axe at `serious`/`critical`.
- No Testing Library, no Storybook, no snapshot: one test tool per level, and the rendering level is end-to-end.

## Verification — the loop

```bash
pnpm --filter @{{SCOPE}}/{{PROJET}}-web test           # pure logic, no DOM — runs at pre-commit
pnpm --filter @{{SCOPE}}/{{PROJET}}-web typecheck      # runs at pre-commit
pnpm --filter @{{SCOPE}}/{{PROJET}}-web check:dette    # feature-import ratchet (gate)
pnpm --filter @{{SCOPE}}/{{PROJET}}-api dev &          # the API on 3000
pnpm --filter @{{SCOPE}}/{{PROJET}}-web dev            # the client on 3001
curl -s localhost:3001/api/health                      # the /api relay reaches the API
curl -s localhost:3001/ | grep -c "<main"              # the page renders
```

"It works" means: the page renders through the real API, not that the code compiles. Before claiming a screen is done, **run it**: start both servers, hit the route, read the response. A rendering or flow that matters gets a Playwright test (ticket) — that is the only test that sees the DOM.

## Definition of done — every feature

- [ ] `app/` contains only the route; the feature owns the screen.
- [ ] No import from another feature; `pnpm lint` and `pnpm check:dette` green.
- [ ] Responses parsed with a contract schema; forms resolved with a contract schema.
- [ ] Every mutation has `meta.messageSucces` or `meta.silencieuse`; invalidation by `queryKeys.<subject>.all`.
- [ ] Keyboard-navigable, named regions, `pnpm lint` (jsx-a11y) green.
- [ ] Pure logic covered by a colocated `*.spec.ts`; `pnpm check` green.
- [ ] **Reviewed before commit**: `/mattpocock-skills:code-review` run from the branch base; Standards axis against this file and the ADRs, Spec axis against the ticket. Every Standards finding is either fixed or answered in writing — and any finding the machine could have caught becomes a proposal for a lint rule or a `verify-*` script, so it is never found twice.
