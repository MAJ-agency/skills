# Frontend guidelines — the why

Companion to `apps/web/CLAUDE.md`, which holds the rules. This file explains them, with examples. The example feature (`sante`) and the placeholder domain (`Demande`) illustrate a **form**, not a business.

## Why routes are thin

A Next route file is glued to the framework: its path, its conventions, its rendering mode. A feature component is plain React. Keeping every screen in `features/` means a route can move, be renamed or be grouped `(backoffice)`/`(public)` without touching the screen — and the screen can be rendered outside Next, in a test or another host.

```tsx
// app/(backoffice)/demandes/page.tsx — the whole file
import { DemandesListe } from "@/features/demandes";
export default function Page() {
  return <DemandesListe />;
}
```

## Why a feature never imports another feature

Two features that import each other cannot evolve, be deleted or be understood separately; the folder boundary stops meaning anything. The rule creates a friction at the exact moment a question must be asked: **who owns this code?** The answer is always one of four moves, by number of readers:

| Shared thing                              | Goes to               |
| ----------------------------------------- | --------------------- |
| a screen component used by two features   | `components/shared/`  |
| a data layer read by two features         | `lib/<subject>/`      |
| a type, a schema                          | `packages/contracts`  |
| a pure function                           | `packages/utils`      |

On an existing codebase the rule is introduced with a **ratchet**: today's couplings are frozen in `DETTE_FEATURES` with the date and the count, lint refuses any new one, `check:dette` refuses a stale entry. The list can only shrink. On a new project it is empty from day one.

## Anatomy of a feature

```
features/demandes/
├── api/demandes-api.ts        one function per endpoint; parses with the contract schema
├── hooks/use-demandes.ts      useQuery/useMutation; keys from lib/query-keys
├── components/                screens, forms, rows — PascalCase exports, kebab-case files
├── lib/                       pure local logic, only if there is some (with *.spec.ts)
└── index.ts                   barrel: what app/ may import
```

```ts
// api/demandes-api.ts
import { DemandeDto, DemandeListeDto, CreerDemandeDto } from "@{{SCOPE}}/{{PROJET}}-contracts";
import { apiClient } from "@/lib/api-client";

export async function listerDemandes(): Promise<DemandeListeDto> {
  const reponse = await apiClient.get<unknown>("/demandes");
  return DemandeListeDto.parse(reponse.data);          // the edge parses; a lying API fails here
}
export async function creerDemande(corps: CreerDemandeDto): Promise<DemandeDto> {
  const reponse = await apiClient.post<unknown>("/demandes", corps);
  return DemandeDto.parse(reponse.data);
}
```

```ts
// hooks/use-demandes.ts
"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { creerDemande, listerDemandes } from "@/features/demandes/api/demandes-api";
import { queryKeys } from "@/lib/query-keys";

export function useDemandes() {
  return useQuery({ queryKey: queryKeys.demandes.liste(), queryFn: listerDemandes });
}
export function useCreerDemande() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: creerDemande,
    meta: { messageSucces: "Demande créée." },   // feedback is global — no toast in the component
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.demandes.all }),
  });
}
```

```tsx
// components/demande-form.tsx — the same schema the API validates with
const form = useForm<CreerDemandeDto>({ resolver: zodResolver(CreerDemandeDto) });
```

## Why parse responses at the edge

TypeScript types vanish at runtime. `apiClient.get<DemandeDto>()` is a promise, not a check: if the API changes a field, the UI breaks three components later with an undefined. `DemandeDto.parse()` moves the failure to the boundary, with a message that names the field. The cost is one call per response; the schema already exists in `packages/contracts`, nothing is written twice.

## Why the mutation feedback is global

Thirty features that each write `toast.success(...)` in their `onSuccess` produce thirty wordings and ten forgotten error paths. One `MutationCache` reads `meta` and does it once: success message declared next to the mutation, error message from the API's prescriptive `message`, `silencieuse` for the rare mutation whose feedback is the UI itself.

## Why no SSR prefetch by default

TanStack Query can prefetch on the server and hydrate the client (`HydrationBoundary`). It is the right tool for a public page that must render full on first paint, or for SEO. A back-office behind a session does not need it: the page shell renders instantly, data arrives from the client with the cookie. Add it **per page**, when a page needs it, with an ADR if it becomes a pattern — not as a rule that everyone ignores.

## Why unit tests stop at pure logic

Rendering tests with a fake DOM verify that React works, and drift from real behaviour (cookies, redirects, timing). They are a fifth test tool for a repository that already has one per level. Vitest with `environment: node` tests what is worth unit-testing — parsers, key factories, error readers, business helpers — and fails on purpose if a test touches the DOM. Rendering and flows are covered end-to-end by Playwright against a real API, with axe for accessibility.

## Why tokens as CSS variables

Tailwind 4 declares tokens in `@theme`; each becomes a CSS variable. A theme (a tenant's brand, a dark mode) is then a `style` on `<body>` or a class that redefines the variables, at runtime, with no rebuild. A hex value in a component escapes the theme — hence the rule.
