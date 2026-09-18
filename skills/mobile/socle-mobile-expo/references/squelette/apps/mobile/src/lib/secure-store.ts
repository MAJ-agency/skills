import * as SecureStore from "expo-secure-store";

/**
 * Les jetons de session vivent ici et NULLE PART AILLEURS : Keychain (iOS) et
 * EncryptedSharedPreferences (Android) — l'équivalent mobile du cookie httpOnly.
 * Jamais AsyncStorage, jamais un état React, jamais un log (apps/mobile/CLAUDE.md, Session).
 *
 * Inerte tant que l'API n'émet pas de jetons : c'est le ticket « session ».
 */
const CLE_ACCES = "{{PROJET}}.jeton_acces";
const CLE_REFRESH = "{{PROJET}}.jeton_refresh";

export const jetons = {
  async definir(acces: string, refresh: string): Promise<void> {
    await SecureStore.setItemAsync(CLE_ACCES, acces);
    await SecureStore.setItemAsync(CLE_REFRESH, refresh);
  },
  lireAcces(): Promise<string | null> {
    return SecureStore.getItemAsync(CLE_ACCES);
  },
  lireRefresh(): Promise<string | null> {
    return SecureStore.getItemAsync(CLE_REFRESH);
  },
  async effacer(): Promise<void> {
    await Promise.all([SecureStore.deleteItemAsync(CLE_ACCES), SecureStore.deleteItemAsync(CLE_REFRESH)]);
  },
};
