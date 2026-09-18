import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Configuration Expo, dynamique pour lire l'environnement de build. Ce qui
 * dépend d'une décision non prise (identifiants de bundle, icônes, profils
 * EAS) est laissé au ticket « distribution ». Les variables `EXPO_PUBLIC_*`
 * sont inlinées dans le code par Expo : elles se lisent dans src/lib/env.ts,
 * pas ici.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "{{TITRE}}",
  slug: "{{PROJET}}",
  scheme: "{{PROJET}}",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  ios: { supportsTablet: false, bundleIdentifier: "com.{{SCOPE}}.{{PROJET_SNAKE}}" },
  android: { package: "com.{{SCOPE}}.{{PROJET_SNAKE}}" },
  plugins: ["expo-router", "expo-secure-store", "expo-splash-screen"],
  experiments: { typedRoutes: true },
});
