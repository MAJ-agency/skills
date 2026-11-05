// Test de propriétés (skill socle-tests, ADR « tests de propriétés ») : une fonction pure qui
// porte un invariant métier chiffré se prouve sur des milliers d'entrées, pas sur trois exemples.
// À copier à côté de la fonction, sous le nom `<fonction>.property.spec.ts`.
//
// L'oracle est indépendant de l'implémentation : ici, la somme des parts est recalculée en
// entiers (centimes), jamais par la fonction testée. Une propriété rouge est un bug : corriger
// le code, et garder le contre-exemple minimal affiché par fast-check comme test d'exemple.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { splitAmount } from "./split-amount";

describe("splitAmount (propriétés)", () => {
  it("should split any amount into parts that sum back to the total, to the cent", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10_000_000 }), // montant en centimes
        fc.integer({ min: 1, max: 12 }), // nombre de parts
        (totalCents, parts) => {
          const result = splitAmount(totalCents, parts);
          expect(result).toHaveLength(parts);
          expect(result.reduce((sum, p) => sum + p, 0)).toBe(totalCents);
          expect(Math.max(...result) - Math.min(...result)).toBeLessThanOrEqual(1);
        },
      ),
      { numRuns: 300 }, // 100 à 500 : moins de 5 s par fichier ; graine aléatoire, affichée en cas d'échec
    );
  });
});
