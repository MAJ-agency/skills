// Test du jour et de l'heure (skill socle-tests, fiche « Le jour et l'heure » de tests.md) : trois points.
// 1. Le jour se lit dans le fuseau du métier, pas en UTC. 2. Un test crée ses données au lieu de lire
// celles du seed partagé. 3. Un banc tourne avec une horloge posée, aux instants qui cassent.
// À copier à côté de la fonction, sous le nom `<fonction>.spec.ts`.
//
// `businessDay(instant, timeZone)` rend le jour `AAAA-MM-JJ` de l'instant dans le fuseau, par
// `Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })`.
// L'horloge est un type local `{ now(): Date }` : le gabarit ne dépend pas du socle Nest. Dans un
// projet qui a le port d'horloge, un objet de même forme le satisfait.
import { describe, expect, it } from "vitest";
import { businessDay } from "./business-day";

type Clock = { now(): Date };

// Fuseau d'exemple, loin d'UTC et à changement d'heure. À REMPLACER par la constante du domaine
// du projet (le fuseau du métier, un nom IANA), jamais par celui de la machine.
const EXAMPLE_TIME_ZONE = "Pacific/Auckland";

describe("businessDay", () => {
  // Point 1 : le jour du métier, pas le jour UTC.
  it("should give the business day, not the UTC day, when the instant passes midnight in the business time zone", () => {
    // Hiver du fuseau (UTC+12) : 2026-07-10 23:30 locale = 2026-07-10 11:30 UTC, même jour ici.
    // 2026-07-11 00:15 locale = 2026-07-10 12:15 UTC : le jour UTC est en retard d'un jour.
    const winterInstant = new Date("2026-07-10T12:15:00Z");
    expect(winterInstant.toISOString().slice(0, 10)).toBe("2026-07-10"); // le piège
    expect(businessDay(winterInstant, EXAMPLE_TIME_ZONE)).toBe("2026-07-11");

    // Été du fuseau (UTC+13) : 2026-01-11 00:15 locale = 2026-01-10 11:15 UTC.
    const summerInstant = new Date("2026-01-10T11:15:00Z");
    expect(summerInstant.toISOString().slice(0, 10)).toBe("2026-01-10");
    expect(businessDay(summerInstant, EXAMPLE_TIME_ZONE)).toBe("2026-01-11");
  });

  // Point 3 : un banc à horloge posée, aux instants qui cassent (heures locales du fuseau).
  it.each([
    { label: "midday", instant: "2026-07-10T22:00:00Z", expected: "2026-07-11" }, // 10:00 locale
    { label: "just before midnight", instant: "2026-07-11T11:45:00Z", expected: "2026-07-11" }, // 23:45 locale
    { label: "one minute before midnight", instant: "2026-07-11T11:59:00Z", expected: "2026-07-11" }, // 23:59 locale
    { label: "just after midnight", instant: "2026-07-11T12:15:00Z", expected: "2026-07-12" }, // 00:15 locale
    // Lendemain du changement d'heure (2026-09-27, 02:00 → 03:00 locale) : 10:00 locale = 21:00 UTC la veille.
    { label: "the day after the clock change", instant: "2026-09-27T21:00:00Z", expected: "2026-09-28" },
  ])("should give $expected when the clock is set $label", ({ instant, expected }) => {
    const clock: Clock = { now: () => new Date(instant) };
    expect(businessDay(clock.now(), EXAMPLE_TIME_ZONE)).toBe(expected);
  });

  // Point 2 : la donnée se crée dans le test, relative au jour de l'horloge posée ; la référence
  // s'assert par sa forme, jamais par l'année du jour.
  it("should create its own due date relative to the clock's day instead of reading the seed", () => {
    const clock: Clock = { now: () => new Date("2026-07-11T11:45:00Z") }; // 23:45 locale
    const today = businessDay(clock.now(), EXAMPLE_TIME_ZONE);
    const tomorrow = businessDay(new Date(clock.now().getTime() + 24 * 3_600_000), EXAMPLE_TIME_ZONE);
    // Ici la donnée est construite sur place pour la démonstration ; dans un vrai test, `quote` vient
    // du code testé (ex. `createQuote(clock, …)`), et c'est sa référence que la forme contrôle.
    const quote = { reference: `Q-${today.slice(0, 4)}-0001`, dueDay: tomorrow };

    expect(quote.dueDay).toBe("2026-07-12");
    expect(quote.reference).toMatch(/^Q-\d{4}-\d{4}$/);
  });
});
