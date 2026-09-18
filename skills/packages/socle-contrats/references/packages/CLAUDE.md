# packages/ — shared packages

Imperative rules for what the API and its clients **share**. Read `apps/<service>/CLAUDE.md` for the rules of each service; this file only governs `packages/`.

## What lives here, and nothing else

| Package     | Holds                                                                                                                        | Depends on |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `contracts` | The **wire truth**: Zod schemas of request bodies, response shapes, the common error body, enums as `as const` tuples + `z.enum` | `zod` only |
| `utils`     | **Pure functions** two or more bricks share: formatting, normalisation, computation without I/O. Created with its first function, never before | nothing    |

**NEVER** put in `packages/`: UI components, stores, HTTP clients, framework glue. A React component and a React Native component are two different things; a Next client and an Expo client each own their HTTP client. Sharing them is a trap: they diverge the first week.

## One validation grammar: Zod, declared once

- A rule is written **once**, as a Zod schema in `contracts`. The API validates with it (`createZodDto` via `nestjs-zod`), the clients validate forms with it (`zodResolver`), the OpenAPI document is **generated** from it (`openapi:emit`). **NEVER** rewrite a validation rule in a client component or in a controller.
- The schema constant and its inferred type share one name: `export const XxxDto = z.object(…)` and `export type XxxDto = z.infer<typeof XxxDto>`. Request bodies: `Creer{Entity}Dto`, `Modifier{Entity}Dto`. Responses: `{Entity}Dto`, `{Entity}ListeDto`. The common error body is `ErreurDto`.
- **Response shapes are Zod schemas too**, not hand-written interfaces. That is what makes drift impossible: the API serialises through the schema, the client reads the inferred type, OpenAPI is derived from the same object. A manual `interface` next to a schema is a second source of truth — **NEVER**.
- Enums: `export const XXX = ["a", "b"] as const;` + `export type Xxx = (typeof XXX)[number];` + `export const XxxSchema = z.enum(XXX);`. Human labels for an enum are **presentation**: they live in `utils` (or in the client), never in `contracts`.
<!-- ══ ROLES-B ══ -->
- **The role catalogue lives here** (`ARC-2`): `src/roles.ts`, `export const ROLES = […] as const` + `Role` + `RoleSchema = z.enum(ROLES)`, re-exported by the barrel. It is created **with the first role validated at the grilling**, never before (an enum needs at least one value, and a guessed role is a wrong role). The API reads it to type the session, the clients read it to hide actions — **presentation only**, the API alone decides.
<!-- ══ /ROLES-B ══ -->

## Sealed type universes

- A client imports **only** `contracts` (and `utils`). **NEVER** a DB row type, **NEVER** a domain model, **NEVER** an external vendor DTO.
- The API's DB row types (`kysely-codegen`) never leave its repositories; its domain models never leave its use cases. What crosses to a client is a `contracts` shape, and nothing else.
- Changing a contract **breaks the typecheck of every consumer at once**. That is intended: it is the gate. Do not work around it with `as` or `any`.

## Zero framework, flat

- `contracts` depends on `zod` and nothing else; `utils` depends on nothing. **NEVER** import `react`, `react-native`, `@nestjs/*`, `kysely`, `next`, `expo` in a package — `eslint.rules.mjs` of each package refuses it.
- Packages **do not depend on each other**. `contracts` does not import `utils`, and vice versa. If two packages need the same thing, it is in the wrong package.
- No business rule in `packages/`: a contract describes a shape, it does not decide. A rule that decides belongs to the API's domain.

## Consumption — sources, no build step

- Every package exposes its **sources**: `"main": "./src/index.ts"`. There is no `dist/`, no `^build` ordering, no stale output. A consumer sees a change immediately.
- Each consumer declares how it transpiles workspace sources: the API through its own TypeScript build (nothing to declare), a Next client through `transpilePackages`, an Expo client through Metro's `watchFolders` + `nodeModulesPaths`. That is the consumer's `apps/<service>/CLAUDE.md` concern, not this file's.
- Consumers import from the **barrel** only: `@{{SCOPE}}/{{PROJET}}-contracts`. **NEVER** a deep path (`…/src/…`).

## Layout and tests

- `src/index.ts` is a barrel; **one file per subject** under `src/` (`erreur.ts`, `licence.ts`…), re-exported from the barrel. A subject that grows gets a folder with its own `index.ts`.
- `contracts`: schemas are declarative, no test by default. A schema with a `refine`/`superRefine` or a transform gets a colocated `*.spec.ts` (Vitest).
- `utils`: **every** exported function has a colocated `*.spec.ts`. A pure function without a test is not shared.

## Definition of done — any change in packages/

- [ ] `pnpm check` is green in the whole monorepo — every consumer still typechecks.
- [ ] `openapi:check` of the API is green — the document was regenerated, not edited.
- [ ] No `interface` duplicating a schema, no deep import, no framework import.
- [ ] A new enum comes with its `as const` tuple, its type, its `z.enum`.
