import { describe, expect, it } from "vitest";
import { queryKeys } from "./query-keys";

/**
 * Invariants structurels : chaque espace a un `all`, et chaque clé dérivée
 * commence par le `all` de son espace — sinon l'invalidation par sujet ne
 * l'atteint pas.
 */
describe("queryKeys", () => {
  const espaces = Object.entries(queryKeys);

  it("chaque espace expose `all`, préfixé par son nom", () => {
    for (const [nom, espace] of espaces) {
      expect(espace.all[0]).toBe(nom);
    }
  });

  it("chaque clé dérivée commence par le `all` de son espace", () => {
    for (const [, espace] of espaces) {
      for (const [nomCle, fabrique] of Object.entries(espace)) {
        if (nomCle === "all" || typeof fabrique !== "function") continue;
        const cle = (fabrique as (...args: never[]) => readonly unknown[])();
        expect(cle.slice(0, espace.all.length)).toEqual([...espace.all]);
      }
    }
  });
});
