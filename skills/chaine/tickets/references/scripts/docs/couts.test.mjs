import assert from "node:assert/strict";
import { test } from "node:test";
import { bilan, enEuros, enMarkdown, lireCarte, montant, table } from "./couts.mjs";

/** Les tables sont alignées : on compare le contenu, espaces de remplissage écrasés. */
const plat = (md) => md.replace(/ {2,}/g, " ");

const carte = (sujet, lignes, phase = "4-vague-2") =>
  `# X — Carte\n\nSujet: sujet/${sujet}\n\n## Fiche\n\nPhase: ${phase}\n\n## Coût\n\n` +
  "| Rôle | Ticket | Session | Modèle | Contexte max | Coût $ |\n| --- | --- | --- | --- | --- | --- |\n" +
  lignes.map((l) => `| ${l.join(" | ")} |`).join("\n") +
  "\n\n## Rétro\n\nRien.\n";

test("un montant à virgule ou à point est lu, un texte ou un gabarit ne l'est pas", () => {
  assert.equal(montant("68,92"), 68.92);
  assert.equal(montant(" 4.08 "), 4.08);
  assert.equal(montant("{{coût}}"), null);
  assert.equal(montant("—"), null);
  assert.equal(enEuros(3.5), "3,50");
});

test("une carte rend son chantier, sa phase et ses seules lignes chiffrées", () => {
  const c = lireCarte(
    "docs/f/all/SPEC_ALL_SOC-9-demo.map.md",
    carte("demo", [
      ["fille", "SPEC_ALL_SOC-9.01", "s1", "sonnet", "200 k", "3,00"],
      ["fille", "SPEC_ALL_SOC-9.02", "s2", "sonnet", "—", "à relever"],
      ["architecte", "—", "s3", "opus", "300 k", "10,50"],
    ]),
  );
  assert.equal(c.chantier, "demo");
  assert.equal(c.phase, "4-vague-2");
  assert.deepEqual(
    c.lignes.map((l) => [l.role, l.session, l.cout]),
    [
      ["fille", "s1", 3],
      ["architecte", "s3", 10.5],
    ],
  );
});

test("le bilan compte les tickets distincts des filles et leur coût moyen, hors architecte", () => {
  const c = lireCarte(
    "docs/f/all/SPEC_ALL_SOC-9-demo.map.md",
    carte("demo", [
      ["fille", "SPEC_ALL_SOC-9.01", "s1", "sonnet", "", "3,00"],
      ["fille", "SPEC_ALL_SOC-9.01", "s1b", "sonnet", "", "1,00"],
      ["fille", "SPEC_ALL_SOC-9.02", "s2", "opus", "", "6,00"],
      ["architecte", "—", "s3", "opus", "", "10,00"],
    ]),
  );
  assert.deepEqual(bilan(c), { total: 20, filles: 10, tickets: 2, parTicket: 5 });
});

test("une carte sans section Coût ni Sujet garde le nom de son fichier et n'apparaît pas au registre", () => {
  const vide = lireCarte("docs/f/all/SPEC_ALL_SOC-8-vide.map.md", "# Carte\n\nPhase: 1-grilling\n");
  assert.equal(vide.chantier, "SPEC_ALL_SOC-8-vide");
  assert.deepEqual(vide.lignes, []);
  const md = enMarkdown([vide]);
  assert.match(md, /\*\*Total : 0,00 \$\*\* sur 0 session\(s\) et 0 chantier\(s\)\./);
  assert.doesNotMatch(md, /SPEC_ALL_SOC-8-vide/);
});

test("le registre totalise tous les chantiers, triés par chemin, avec une ligne par session", () => {
  const b = lireCarte(
    "docs/b/B.map.md",
    carte("beta", [["fille", "SPEC_ALL_SOC-7.01", "sb", "sonnet", "1 k", "2,00"]]),
  );
  const a = lireCarte(
    "docs/a/A.map.md",
    carte(
      "alpha",
      [
        ["fille", "SPEC_ALL_SOC-6.01", "sa", "sonnet", "1 k", "4,00"],
        ["capitaine", "—", "sc", "sonnet", "1 k", "0,50"],
      ],
      "fini",
    ),
  );
  const md = plat(enMarkdown([b, a]));
  assert.match(
    md,
    /\*\*Total : 6,50 \$\*\* sur 3 session\(s\) et 2 chantier\(s\)\. Filles : 6,00 \$ pour 2 ticket\(s\), soit 3,00 \$ par ticket\./,
  );
  assert.ok(md.indexOf("| alpha | fini |") < md.indexOf("| beta | 4-vague-2 |"));
  assert.match(
    md,
    /\| alpha \| fini \| 2 \| 1 \| 4,00 \| 4,50 \| 4,00 \| `docs\/a\/A\.map\.md` \|/,
  );
  assert.match(md, /\| beta \| fille \| SPEC_ALL_SOC-7\.01 \| sb \| sonnet \| 1 k \| 2,00 \|/);
  assert.equal(enMarkdown([a, b]), enMarkdown([b, a]));
});

test("une table est alignée comme Prettier : colonnes à la largeur de la plus longue cellule, au moins 3", () => {
  assert.deepEqual(
    table(
      ["A", "Coût $"],
      [
        ["fille", "4,08"],
        ["—", "68,92"],
      ],
    ),
    ["| A     | Coût $ |", "| ----- | ------ |", "| fille | 4,08   |", "| —     | 68,92  |"],
  );
});

test("une Phase vide ne lit pas la ligne suivante, et un coût mal écrit est signalé sans être compté", (t) => {
  const erreurs = [];
  t.mock.method(console, "error", (m) => erreurs.push(m));
  const c = lireCarte(
    "docs/f/all/X.map.md",
    "Phase:\nAutre: y\n\n## Coût\n\n| R | T | S | M | C | Coût $ |\n| - | - | - | - | - | - |\n" +
      "| fille | SPEC_ALL_XYZ-1.01 | s1 | sonnet | 1 k | 4,08 $ |\n| fille | SPEC_ALL_XYZ-1.02 | s2 | sonnet | 1 k | à relever |\n",
  );
  assert.equal(c.phase, "—");
  assert.deepEqual(c.lignes, []);
  assert.equal(erreurs.length, 1);
  assert.match(erreurs[0], /coût illisible « 4,08 \$ »/);
});
