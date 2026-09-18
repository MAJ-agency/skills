# Mobile guidelines — the why

Companion to `apps/mobile/CLAUDE.md`. The example feature (`sante`) illustrates a **form**, not a business.

## Why the same architecture as the web client

Two clients that consume the same API with two different organisations cost twice the onboarding and drift on every rule. `features/<module>/{api,hooks,components}` with a barrel, `lib/` underneath, `app/` as thin routes: a developer who knows one client knows the other. The difference is confined to what the platform forces — components, HTTP transport, navigation state — and stays out of `packages/`.

## Why Bearer tokens in the Keychain, not cookies

A mobile app has no cookie jar worth trusting and no same-origin policy to lean on. The API keeps **one** set of endpoints and reads `X-Client-Type: mobile` to answer with tokens in JSON instead of `Set-Cookie`. The tokens go to the Keychain (iOS) or EncryptedSharedPreferences (Android): encrypted at rest, scoped to the app, cleared on uninstall. AsyncStorage is a plain file — a rooted device reads it.

The refresh queue is the same single-flight pattern as the web: one refresh for N concurrent 401s, then replay. Without it, refresh-token rotation revokes the family on the second concurrent request.

## Why `Screen` decides loading, error and empty once

Thirty screens that each handle their spinner, their error and their empty state produce thirty variants and ten forgotten retries. `Screen` takes a `statut` and does it once, with the safe area. A feature screen only renders its content:

```tsx
export function DemandesEcran() {
  const { data, error, isPending, refetch } = useDemandes();
  const statut = isPending ? "chargement" : error ? "erreur" : data.length === 0 ? "vide" : "ok";
  return (
    <Screen statut={statut} messageErreur={error ? messageErreurApi(error, "Impossible de charger.") : undefined} onReessayer={() => void refetch()}>
      {data?.map((d) => <DemandeLigne key={d.id} demande={d} />)}
    </Screen>
  );
}
```

## Why NativeWind and not StyleSheet

`className` with the same token names as the web (`bg-primary-500`, `text-neutral-900`) keeps two clients on one vocabulary, readable by someone who has never opened React Native. `StyleSheet.create` reintroduces hex values and per-file palettes. The lint refuses the import; the rare case that needs a computed style uses `style` for layout values only, never colours.

## Why the bundle is a gate

Nobody has a simulator in CI by default, yet most mobile breakage is not on the device: it is Metro failing to resolve a workspace package, Babel missing a plugin, NativeWind not compiling a class. `expo export --platform android` exercises all of that in a minute, on any machine. It is not a device test; it is the cheapest proof that the app still builds.

## Why Metro needs three settings in a pnpm monorepo

`watchFolders` so Metro sees `packages/*` sources; `nodeModulesPaths` so it resolves from the root store as well as the app's; `unstable_enableSymlinks` + `unstable_enablePackageExports` because pnpm is made of symlinks and modern packages use `exports`. And the `node:` stub: a shared package may lazily require `node:crypto` for the server; on a device that import must resolve to nothing, not fail.

## Why unit tests stop at pure logic

React Native components in a fake native layer test the mock, not the app. Vitest in Node covers what is worth unit-testing — parsers, key factories, error readers, business helpers. Flows are tested on a device, end-to-end, where the native layer is real.
