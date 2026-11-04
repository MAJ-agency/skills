import { describe, expect, it } from "vitest";
import { queryKeys } from "./query-keys";

/**
 * Invariants structurels : chaque espace a un `all`, et chaque clé dérivée
 * commence par le `all` de son espace — sinon l'invalidation par sujet ne
 * l'atteint pas.
 */
describe("queryKeys", () => {
  const namespaces = Object.entries(queryKeys);

  it("chaque espace expose `all`, préfixé par son nom", () => {
    for (const [name, namespace] of namespaces) {
      expect(namespace.all[0]).toBe(name);
    }
  });

  it("chaque clé dérivée commence par le `all` de son espace", () => {
    for (const [, namespace] of namespaces) {
      for (const [keyName, factory] of Object.entries(namespace)) {
        if (keyName === "all" || typeof factory !== "function") continue;
        const key = (factory as (...args: never[]) => readonly unknown[])();
        expect(key.slice(0, namespace.all.length)).toEqual([...namespace.all]);
      }
    }
  });
});
