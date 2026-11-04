import * as SecureStore from "expo-secure-store";

/**
 * Les jetons de session vivent ici et NULLE PART AILLEURS : Keychain (iOS) et
 * EncryptedSharedPreferences (Android) — l'équivalent mobile du cookie httpOnly.
 * Jamais AsyncStorage, jamais un état React, jamais un log (apps/mobile/CLAUDE.md, Session).
 *
 * Inerte tant que l'API n'émet pas de jetons : c'est le ticket « session ».
 */
const ACCESS_KEY = "{{PROJET}}.access_token";
const REFRESH_KEY = "{{PROJET}}.refresh_token";

export const tokens = {
  async set(access: string, refresh: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_KEY, access);
    await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  },
  getAccess(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_KEY);
  },
  getRefresh(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },
  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  },
};
