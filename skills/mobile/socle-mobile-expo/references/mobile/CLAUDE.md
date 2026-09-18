# apps/mobile — imperative rules

Expo client of the {{TITRE}}. Read this file **entirely** before writing mobile code. What is shared with the API lives in `packages/CLAUDE.md`; the API's rules in `apps/api/CLAUDE.md`; the web client's in `apps/web/CLAUDE.md`. The *why*: `apps/mobile/docs/MOBILE_GUIDELINES.md`.

## Golden rule — same architecture as the web client

```
packages/contracts, packages/utils   ←  nothing
lib/                                 ←  packages/*
components/                          ←  lib/, packages/*
features/<module>/                   ←  components/, lib/, packages/*
features/<module>/                   ←  NEVER features/<other>/
app/                                 ←  features/, components/, lib/
```

- `app/` is **Expo Router**: route files only (`_layout.tsx`, `index.tsx`, `(group)/`). **ZERO** business logic, **ZERO** component defined there. A route renders one feature screen.
- A **feature** is a leaf: `features/<module>/{api,hooks,components,lib?}` + `index.ts`. It **NEVER** imports another feature. Shared code moves by number of readers: screen → `components/shared/`, data layer → `lib/<subject>/`, type/schema → `packages/contracts`, pure function → `packages/utils`.
- Enforced by `eslint.rules.mjs`: feature list read from disk, relative parent imports forbidden (`@/…` says where a module comes from), `DETTE_FEATURES` empty and staying empty.
- **What is shared with the web client**: types, schemas, utils — through `packages/`. **What is NOT shared**: components (React Native ≠ DOM), the HTTP client (Bearer ≠ cookie), stores. Two clients, two implementations, one contract.

## Living reference

`features/sante` is a labelled placeholder. **The first real feature becomes the living reference**: before creating another one, read it entirely and reproduce its shape — and keep it in step with its web twin when the feature exists on both clients.

## Session — the Keychain, and nothing else

- Tokens live in **`expo-secure-store`** (Keychain / EncryptedSharedPreferences) through `lib/secure-store.ts`, the **only** file allowed to import it (lint). **NEVER** AsyncStorage for anything secret, **NEVER** a token in React state, **NEVER** a token in a log.
- `lib/api-client.ts` sends `Authorization: Bearer` from the Keychain and `X-Client-Type: mobile`, so the API returns tokens as JSON instead of `Set-Cookie`. The single-flight refresh queue is inert until the API exposes `/auth/refresh` (ticket).
- **Same endpoints as the web.** **NEVER** a `/mobile/*` route on the API to duplicate an existing one. A contract change is expand/contract: a mobile app does not update by force.
- Biometrics, offline caches, push: **not** in the socle. Each is a ticket with its own security review.
<!-- ══ TENANT-B ══ -->
- **Tenant (`ARC-2`)**: the client **NEVER** sends a `tenantId` — not in a header, not in a body. The session (the access token) carries it. A tenant switch re-issues the tokens, then `queryClient.clear()`; **NEVER** keep tenant data cached across a switch, on device least of all.
<!-- ══ /TENANT-B ══ -->
<!-- ══ ROLES-B ══ -->
- **Roles (`ARC-2`)**: the current role comes from `/auth/me` through `lib/auth/`, typed by `RoleSchema` from `packages/contracts`. Hiding a screen or a button by role is **presentation**; the API alone decides. **NEVER** decode the token on device to read a role — call `/auth/me`.
<!-- ══ /ROLES-B ══ -->

## API client and errors

- **One HTTP client**: `lib/api-client.ts` (Axios). **NEVER** `fetch` in a feature.
- Every response is typed by a schema from `packages/contracts` and **parsed** at the edge (`Schema.parse(reponse.data)`). **NEVER** a response `interface` in `features/*/api/*`.
- Errors: the API's error body is `ErreurDto`. Read it through `lib/api-error.ts` only. Branch on `code`, show `message`.
- `EXPO_PUBLIC_API_URL` is read **literally** and validated by Zod in `lib/env.ts` at boot — fail-fast. On a physical device `localhost` is the device: use the LAN address in `.env.local`.

## State — three kinds, three tools

- **Server state**: TanStack Query, keys from `lib/query-keys.ts` only.
- **Navigation state**: Expo Router params (`useLocalSearchParams`) — the mobile equivalent of URL state.
- **Local UI state**: `useState`, React Hook Form (`zodResolver` on a contract schema), a context for one zone. No global store until a real need, by ADR.

## Mutations — feedback is global

Every `useMutation` declares `meta.messageSucces` **or** `meta.silencieuse: true`; `meta.messageErreur` is the fallback. `lib/query-provider.tsx` shows the feedback through `lib/toast.ts`. **NEVER** `Alert.alert` or a toast in a screen for a mutation result. Invalidate by subject after a mutation.

## Screens and components

- Every top-level screen renders inside `components/ui/screen.tsx` (`Screen`): safe area, loading, error with retry, empty state are decided **once**. A feature screen passes a `statut` and renders its content.
- **NativeWind only** (`className`). **NEVER** `StyleSheet.create` (lint), **NEVER** inline `style` for colours, **NEVER** another UI library (Tamagui, Gluestack…). Tokens in `tailwind.config.js` mirror the web's `globals.css`; keep them aligned by hand until a tokens package exists (ticket design system).
- Accessibility: every `Pressable` has `accessibilityRole` and `accessibilityLabel`; async status uses `accessibilityLiveRegion`; touch targets ≥ 44 pt.
- **NEVER** a WebView for a screen the app can render natively.

## Environment and build

- `app.config.ts` is dynamic; bundle identifiers, icons, splash, EAS profiles are the **distribution** ticket. **NEVER** commit a signing key (`.gitignore` refuses `*.jks`, `*.p8`, `*.p12`, `*.mobileprovision`).
- `ios/` and `android/` are generated by `expo prebuild` and **never versioned**. A native change is a config plugin, not a hand edit.
- The bundle is the gate: `check:bundle` (`expo export --platform android`) runs in `pnpm check` through `check:gates`. It proves Metro resolves the monorepo, NativeWind compiles, Babel is right — without a device.

## Testing

- **Unit (Vitest, `environment: node`)**: pure logic of `lib/` and `features/*/lib/` — no React Native, no Expo import. A test that touches the native layer fails immediately, on purpose.
- **Flows**: on device or simulator, end-to-end (ticket: Maestro or Detox). No component test with a fake native layer.

## Definition of done — every feature

- [ ] `app/` contains only the route; the feature owns the screen, rendered inside `Screen`.
- [ ] No import from another feature; `pnpm lint` green (`--max-warnings 0`).
- [ ] Responses parsed with a contract schema; forms resolved with a contract schema.
- [ ] Every mutation has `meta.messageSucces` or `meta.silencieuse`.
- [ ] No token outside `lib/secure-store.ts`; no `StyleSheet`; every `Pressable` labelled.
- [ ] Pure logic covered by a colocated `*.spec.ts`; `pnpm check` green, bundle included.
