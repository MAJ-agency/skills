**Avant d'écrire la moindre ligne de code mobile, lire [`apps/mobile/CLAUDE.md`](apps/mobile/CLAUDE.md) en entier.**

Client mobile : **Expo** avec **Expo Router**, même architecture que le web (routes minces, features feuilles). Stack : **React Native** · **TanStack Query** · **Axios** (un seul client, jetons porteurs dans le Keychain via `expo-secure-store`, en-tête `X-Client-Type: mobile`) · **React Hook Form + Zod** (les schémas de `packages/contracts`) · **NativeWind** · **Vitest** (logique pure) · le bundle `expo export` comme gate.
